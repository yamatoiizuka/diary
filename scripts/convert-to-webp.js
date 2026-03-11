import { appendFile, mkdir, readFile, readdir, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, parse } from "path";
import { createHash } from "crypto";
import { execFile as execFileCallback } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

/**
 * src/data/images の JPEG/PNG 画像を public/images に WebP 変換して配置
 * 差分変換に対応（manifest のフィンガープリントが変わった画像のみ変換）
 */
const execFile = promisify(execFileCallback);
const sourceDir = join(process.cwd(), "src/data/images");
const outputDir = join(process.cwd(), "public/images");
const manifestDir = join(process.cwd(), ".webp-cache");
const manifestPath = join(manifestDir, "manifest.json");
const imagePattern = /\.(jpg|jpeg|png)$/i;

function getOutputName(file) {
  return `${parse(file).name}.webp`;
}

async function loadManifest() {
  if (!existsSync(manifestPath)) {
    return { version: 1, entries: {} };
  }

  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && parsed.entries) {
      return parsed;
    }
  } catch (error) {
    console.warn("⚠️  manifest の読み込みに失敗したため再生成します", error);
  }

  return { version: 1, entries: {} };
}

async function saveManifest(entries) {
  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        entries,
      },
      null,
      2
    )}\n`
  );
}

async function appendGithubOutput(outputs) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  await appendFile(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

async function getTrackedFingerprints() {
  try {
    const { stdout } = await execFile("git", ["ls-files", "-s", "--", "src/data/images"]);
    const fingerprints = new Map();

    for (const line of stdout.split("\n")) {
      if (!line.trim()) {
        continue;
      }

      const [meta, filePath] = line.split("\t");
      const [, hash] = meta.trim().split(/\s+/);

      if (!hash || !filePath) {
        continue;
      }

      fingerprints.set(filePath.replace(/^src\/data\/images\//, ""), hash);
    }

    return fingerprints;
  } catch {
    return new Map();
  }
}

async function getDirtySourceFiles() {
  try {
    const { stdout } = await execFile("git", [
      "status",
      "--porcelain",
      "--untracked-files=all",
      "--",
      "src/data/images",
    ]);

    const dirtyFiles = new Set();

    for (const line of stdout.split("\n")) {
      if (!line.trim()) {
        continue;
      }

      const filePart = line.slice(3).trim();
      const currentPath = filePart.includes(" -> ")
        ? filePart.split(" -> ").at(-1)
        : filePart;

      if (currentPath.startsWith("src/data/images/")) {
        dirtyFiles.add(currentPath.replace(/^src\/data\/images\//, ""));
      }
    }

    return dirtyFiles;
  } catch {
    return new Set();
  }
}

async function hashFile(filePath) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

async function getSourceFingerprints(files) {
  const trackedFingerprints = await getTrackedFingerprints();
  const dirtyFiles = await getDirtySourceFiles();
  const fingerprints = new Map();

  for (const file of files) {
    if (!dirtyFiles.has(file) && trackedFingerprints.has(file)) {
      fingerprints.set(file, trackedFingerprints.get(file));
      continue;
    }

    fingerprints.set(file, await hashFile(join(sourceDir, file)));
  }

  return fingerprints;
}

async function convertImagesToWebP() {
  console.log("🖼️  画像のWebP変換を開始します...");
  console.log(`   ソース: ${sourceDir}`);
  console.log(`   出力先: ${outputDir}`);
  console.log(`   manifest: ${manifestPath}\n`);

  // ソースディレクトリが存在しない場合は終了
  if (!existsSync(sourceDir)) {
    console.warn("⚠️  警告: src/data/images ディレクトリが存在しません");
    await appendGithubOutput({
      changed: "false",
      converted: "0",
      pruned: "0",
    });
    process.exit(0);
  }

  try {
    await mkdir(outputDir, { recursive: true });
    const files = await readdir(sourceDir);
    const imageFiles = files.filter((file) => imagePattern.test(file)).sort();

    if (imageFiles.length === 0) {
      console.log("ℹ️  変換対象の画像がありません");
      await appendGithubOutput({
        changed: "false",
        converted: "0",
        pruned: "0",
      });
      process.exit(0);
    }

    const outputNames = new Map();
    for (const file of imageFiles) {
      const outputName = getOutputName(file);
      if (outputNames.has(outputName)) {
        throw new Error(
          `同じ出力名に衝突する画像があります: ${outputNames.get(outputName)} / ${file}`
        );
      }
      outputNames.set(outputName, file);
    }

    const manifest = await loadManifest();
    const previousEntries = manifest.entries ?? {};
    const nextEntries = {};
    const sourceFingerprints = await getSourceFingerprints(imageFiles);
    const existingOutputs = new Set(
      (await readdir(outputDir)).filter((file) => file.endsWith(".webp"))
    );

    let convertedCount = 0;
    let skippedCount = 0;
    let prunedCount = 0;

    for (const outputFile of existingOutputs) {
      if (!outputNames.has(outputFile)) {
        await unlink(join(outputDir, outputFile));
        console.log(`🧹 削除: ${outputFile} (対応するソースが存在しません)`);
        prunedCount++;
      }
    }

    for (const file of imageFiles) {
      const sourcePath = join(sourceDir, file);
      const outputFile = getOutputName(file);
      const outputPath = join(outputDir, outputFile);
      const fingerprint = sourceFingerprints.get(file);
      const previousEntry = previousEntries[outputFile];
      const needsConversion =
        !existsSync(outputPath) ||
        !previousEntry ||
        previousEntry.sourceFile !== file ||
        previousEntry.fingerprint !== fingerprint;

      if (needsConversion) {
        await sharp(sourcePath).webp({ quality: 85 }).toFile(outputPath);
        console.log(`✅ 変換完了: ${file} → ${outputFile}`);
        convertedCount++;
      } else {
        console.log(`⏭️  スキップ: ${file} (既に最新)`);
        skippedCount++;
      }

      nextEntries[outputFile] = {
        sourceFile: file,
        fingerprint,
      };
    }

    await saveManifest(nextEntries);

    const changed = convertedCount > 0 || prunedCount > 0;

    console.log(`\n🎉 変換処理完了!`);
    console.log(`   変換: ${convertedCount}個`);
    console.log(`   スキップ: ${skippedCount}個`);
    console.log(`   削除: ${prunedCount}個`);

    await appendGithubOutput({
      changed: changed ? "true" : "false",
      converted: String(convertedCount),
      pruned: String(prunedCount),
    });
  } catch (error) {
    console.error("❌ 画像変換エラー:", error);
    await appendGithubOutput({
      changed: "false",
      converted: "0",
      pruned: "0",
    });
    process.exit(1);
  }
}

convertImagesToWebP();
