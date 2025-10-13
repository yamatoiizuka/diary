import { readdir, stat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, parse } from "path";
import sharp from "sharp";

/**
 * src/data/images の JPEG/PNG 画像を public/images に WebP 変換して配置
 * 差分変換に対応（ソースファイルが更新された場合のみ変換）
 */
async function convertImagesToWebP() {
  const sourceDir = join(process.cwd(), "src/data/images");
  const outputDir = join(process.cwd(), "public/images");

  console.log("🖼️  画像のWebP変換を開始します...");
  console.log(`   ソース: ${sourceDir}`);
  console.log(`   出力先: ${outputDir}\n`);

  // ソースディレクトリが存在しない場合は終了
  if (!existsSync(sourceDir)) {
    console.warn("⚠️  警告: src/data/images ディレクトリが存在しません");
    process.exit(0);
  }

  // 出力ディレクトリが存在しない場合は作成
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  try {
    const files = await readdir(sourceDir);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      console.log("ℹ️  変換対象の画像がありません");
      process.exit(0);
    }

    let convertedCount = 0;
    let skippedCount = 0;

    for (const file of imageFiles) {
      const sourcePath = join(sourceDir, file);
      const { name } = parse(file);
      const outputPath = join(outputDir, `${name}.webp`);

      // 差分チェック: 出力ファイルが存在し、ソースより新しい場合はスキップ
      let needsConversion = true;
      if (existsSync(outputPath)) {
        const sourceStat = await stat(sourcePath);
        const outputStat = await stat(outputPath);

        if (outputStat.mtime > sourceStat.mtime) {
          needsConversion = false;
        }
      }

      if (needsConversion) {
        // WebPに変換
        await sharp(sourcePath).webp({ quality: 85 }).toFile(outputPath);
        console.log(`✅ 変換完了: ${file} → ${name}.webp`);
        convertedCount++;
      } else {
        console.log(`⏭️  スキップ: ${file} (既に最新)`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 変換処理完了!`);
    console.log(`   変換: ${convertedCount}個`);
    console.log(`   スキップ: ${skippedCount}個`);

    // GitHub Actions 用の出力
    if (process.env.GITHUB_ACTIONS === "true") {
      // 変換されたファイルがある場合は出力変数を設定
      if (convertedCount > 0) {
        console.log("\n::set-output name=converted::true");
        console.log(`::set-output name=count::${convertedCount}`);
      } else {
        console.log("\n::set-output name=converted::false");
      }
    }
  } catch (error) {
    console.error("❌ 画像変換エラー:", error);
    process.exit(1);
  }
}

convertImagesToWebP();

