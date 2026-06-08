import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const rootDir = process.cwd();
const entriesDir = join(rootDir, "src/data/entries");
const legacyEntriesPath = join(rootDir, "src/data/entries.json");
const imagesDir = join(rootDir, "src/data/images");
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const imagePattern = /\.(jpe?g|png)$/i;

const errors = [];
const warnings = [];

const addError = (message) => errors.push(message);
const addWarning = (message) => warnings.push(message);

async function readJsonFile(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${filePath}: ${error.message}`);
  }
}

async function loadEntries() {
  const entryFiles = existsSync(entriesDir)
    ? (await readdir(entriesDir)).filter((file) => file.endsWith(".json")).sort()
    : [];

  if (entryFiles.length > 0) {
    const entries = [];
    for (const file of entryFiles) {
      const source = `src/data/entries/${file}`;
      const value = await readJsonFile(join(entriesDir, file));
      entries.push({ source, value });
    }
    return { mode: "split", entries };
  }

  const legacyEntries = await readJsonFile(legacyEntriesPath);
  if (!Array.isArray(legacyEntries)) {
    addError("src/data/entries.json must be an array while fallback mode is active.");
    return { mode: "legacy", entries: [] };
  }

  return {
    mode: "legacy",
    entries: legacyEntries.map((value, index) => ({
      source: `src/data/entries.json[${index}]`,
      value,
    })),
  };
}

function isValidDate(date) {
  const match = typeof date === "string" ? date.match(datePattern) : null;
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isValidDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

async function getImageBasenames() {
  if (!existsSync(imagesDir)) return new Set();

  const imageFiles = (await readdir(imagesDir)).filter((file) =>
    imagePattern.test(file)
  );

  return new Set(imageFiles.map((file) => file.replace(imagePattern, "")));
}

function normalizeEntry({ source, value }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    addError(`${source}: entry must be an object.`);
    return null;
  }

  const id = value.id ?? value.date;
  if (typeof id !== "string" || id.trim() === "") {
    addError(`${source}: id must be a non-empty string.`);
  }

  if (!isValidDate(value.date)) {
    addError(`${source}: date must be a valid YYYY-MM-DD string.`);
  }

  if (typeof value.text !== "string") {
    addError(`${source}: text must be a string.`);
  }

  for (const field of ["createdAt", "updatedAt"]) {
    if (value[field] !== undefined && !isValidDateTime(value[field])) {
      addError(`${source}: ${field} must be an ISO-compatible date-time string.`);
    }
  }

  return {
    source,
    id,
    date: value.date,
    image: value.image ?? id,
  };
}

async function main() {
  const { mode, entries } = await loadEntries();
  const imageBasenames = await getImageBasenames();
  const normalizedEntries = entries.map(normalizeEntry).filter(Boolean);
  const ids = new Map();
  const dates = new Map();

  for (const entry of normalizedEntries) {
    if (typeof entry.id === "string") {
      if (ids.has(entry.id)) {
        addError(
          `Duplicate entry id "${entry.id}" in ${ids.get(entry.id)} and ${entry.source}.`
        );
      } else {
        ids.set(entry.id, entry.source);
      }
    }

    if (typeof entry.date === "string") {
      if (!dates.has(entry.date)) {
        dates.set(entry.date, []);
      }
      dates.get(entry.date).push(entry.source);
    }

    if (typeof entry.image === "string" && !imageBasenames.has(entry.image)) {
      addWarning(
        `${entry.source}: missing source image src/data/images/${entry.image}.{jpg,jpeg,png}.`
      );
    }
  }

  for (const [date, sources] of dates) {
    if (sources.length > 1) {
      addWarning(
        `Duplicate date "${date}" appears in ${sources.length} entries (${mode} mode allows this; ids must remain unique).`
      );
    }
  }

  if (normalizedEntries.length === 0) {
    addError("No diary entries were found.");
  }

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Error: ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Diary data validation passed: ${normalizedEntries.length} entries (${mode} mode), ${warnings.length} warnings.`
  );
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
