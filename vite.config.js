import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // ビルド時のタイムスタンプを環境変数として埋め込み（キャッシュバスティング用）
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now()),
  },
  build: {
    // 古いビルドファイルを削除してからビルド
    emptyOutDir: true,
  },
});
