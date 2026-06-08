import { existsSync } from "fs";
import { copyFile, mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const rootDir = process.cwd();
const legacyEntriesPath = join(rootDir, "src/data/entries.json");
const entriesDir = join(rootDir, "src/data/entries");
const imagesDir = join(rootDir, "src/data/images");
const imageExtensions = [".jpg", ".jpeg", ".png"];

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const isDryRun = args.has("--dry-run") || !shouldWrite;

function sanitizeId(value) {
  return String(value)
    .trim()
    .replace(/:/g, "-")
    .replace(/[^0-9A-Za-z._+-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildEntryId(entry, usedIds) {
  const baseId = sanitizeId(entry.id ?? entry.createdAt ?? entry.date);
  if (!baseId) {
    throw new Error(`Cannot create id for entry: ${JSON.stringify(entry)}`);
  }

  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 1;
  while (true) {
    const nextId = `${baseId}-${String(suffix).padStart(2, "0")}`;
    if (!usedIds.has(nextId)) {
      usedIds.add(nextId);
      return nextId;
    }
    suffix += 1;
  }
}

function findImagePath(imageBase) {
  for (const extension of imageExtensions) {
    const imagePath = join(imagesDir, `${imageBase}${extension}`);
    if (existsSync(imagePath)) {
      return { imagePath, extension };
    }
  }

  return null;
}

function buildMigratedEntry(entry, id) {
  const migrated = {
    id,
    date: entry.date,
  };

  if (entry.createdAt) migrated.createdAt = entry.createdAt;
  if (entry.updatedAt) migrated.updatedAt = entry.updatedAt;

  migrated.text = entry.text;
  migrated.image = entry.image ?? id;

  return migrated;
}

async function main() {
  if (!args.has("--dry-run") && !args.has("--write")) {
    console.log("No mode supplied; running as --dry-run. Use --write to create files.");
  }

  const legacyEntries = JSON.parse(await readFile(legacyEntriesPath, "utf8"));
  if (!Array.isArray(legacyEntries)) {
    throw new Error("src/data/entries.json must be an array.");
  }

  const usedIds = new Set();
  const plannedEntries = legacyEntries.map((entry) => {
    const id = buildEntryId(entry, usedIds);
    const originalImageBase = entry.image ?? entry.id ?? entry.date;
    const sourceImage = findImagePath(originalImageBase);
    const image = sourceImage ? id : entry.image ?? id;
    const migrated = buildMigratedEntry({ ...entry, image }, id);

    return {
      id,
      sourceImage,
      image,
      migrated,
      entryPath: join(entriesDir, `${id}.json`),
    };
  });

  for (const plan of plannedEntries) {
    console.log(`entry: src/data/entries/${plan.id}.json`);
    if (plan.sourceImage && plan.sourceImage.imagePath) {
      const targetImagePath = join(imagesDir, `${plan.image}${plan.sourceImage.extension}`);
      if (targetImagePath !== plan.sourceImage.imagePath) {
        console.log(
          `image: ${plan.sourceImage.imagePath.replace(`${rootDir}/`, "")} -> ${targetImagePath.replace(`${rootDir}/`, "")}`
        );
      }
    } else {
      console.log(`image: missing source for ${plan.image}`);
    }
  }

  if (isDryRun) {
    console.log(`Dry run complete: ${plannedEntries.length} entries planned.`);
    return;
  }

  await mkdir(entriesDir, { recursive: true });

  for (const plan of plannedEntries) {
    await writeFile(plan.entryPath, `${JSON.stringify(plan.migrated, null, 2)}\n`);

    if (plan.sourceImage) {
      const targetImagePath = join(imagesDir, `${plan.image}${plan.sourceImage.extension}`);
      if (targetImagePath !== plan.sourceImage.imagePath && !existsSync(targetImagePath)) {
        await copyFile(plan.sourceImage.imagePath, targetImagePath);
      }
    }
  }

  console.log(`Migration complete: wrote ${plannedEntries.length} entry files.`);
  console.log("src/data/entries.json was left in place as a fallback.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
