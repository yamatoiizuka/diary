## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on default Vite port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Convert JPEG/PNG images to WebP format
npm run convert-webp
```

## エントリの追加

1. `/src/data/entries.json` にエントリを追加
   ```json
   { "date": "YYYY-MM-DD", "text": "hi" }
   ```
2. `/src/data/images/` に画像を追加（`YYYY-MM-DD.jpg`）

CMS について：[iOS ファーストな CMS をショートカットで構築する](https://zenn.dev/yamatoiizuka/articles/79ad1b2099b966)

## デプロイ

GitHub Actions でデプロイされる。

1. `npm run convert-webp` を実行して画像を WebP に変換
2. `npm run build` を実行してビルド

## メモ

- `vite.config.js`

  - `__BUILD_TIMESTAMP__`: キャッシュ対策用のグローバル定数

- `FONTPLUS 関連`
  - 初回マウント後に `FONTPLUS.reload()` を呼び出してフォントをロード
  - `AllTextPreloader` コンポーネントで、テキストを事前にレンダリング
