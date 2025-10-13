import { useEffect, useRef } from "react";

/**
 * 画像のプリロードを管理するカスタムフック
 * 最新の日付から順番に画像を読み込んでいく
 * @param {Array} entries - 日記エントリの配列（日付昇順）
 * @param {number} currentIndex - 現在のインデックス
 */
export const useImagePreloader = (entries, currentIndex) => {
  const preloadedImages = useRef(new Set());
  const isPreloadingRef = useRef(false);
  const preloadQueueRef = useRef([]);

  useEffect(() => {
    if (!entries || entries.length === 0) return;

    // 画像URLを生成
    const getImageUrl = (entry) => `/images/${entry.date}.webp`;

    // すでにプリロード済みかチェック
    const isPreloaded = (entry) => preloadedImages.current.has(entry.date);

    // 画像をプリロード
    const preloadImage = (entry) => {
      return new Promise((resolve, reject) => {
        if (isPreloaded(entry)) {
          resolve();
          return;
        }

        const img = new Image();
        img.src = getImageUrl(entry);

        img.onload = () => {
          preloadedImages.current.add(entry.date);
          resolve();
        };

        img.onerror = () => {
          console.warn(`Failed to preload image: ${getImageUrl(entry)}`);
          reject();
        };
      });
    };

    // プリロードキューを構築（優先順位付き）
    const buildPreloadQueue = () => {
      const queue = [];
      const currentEntry = entries[currentIndex];

      // 1. 現在の画像（最優先）
      if (currentEntry && !isPreloaded(currentEntry)) {
        queue.push(currentEntry);
      }

      // 2. 現在の画像の前後数枚（次に優先）
      const surroundingRange = 5;
      for (let i = 1; i <= surroundingRange; i++) {
        const prevIndex = currentIndex - i;
        const nextIndex = currentIndex + i;

        if (nextIndex < entries.length && !isPreloaded(entries[nextIndex])) {
          queue.push(entries[nextIndex]);
        }
        if (prevIndex >= 0 && !isPreloaded(entries[prevIndex])) {
          queue.push(entries[prevIndex]);
        }
      }

      // 3. 残りの画像を新しい順（配列の後ろから前へ）
      for (let i = entries.length - 1; i >= 0; i--) {
        if (!isPreloaded(entries[i]) && !queue.includes(entries[i])) {
          queue.push(entries[i]);
        }
      }

      return queue;
    };

    // プリロードを順次実行
    const processPreloadQueue = async () => {
      if (isPreloadingRef.current) return;

      isPreloadingRef.current = true;
      const queue = buildPreloadQueue();
      preloadQueueRef.current = queue;

      // 最初の3枚は並列で読み込み、その後は順次読み込み
      const initialBatch = queue.slice(0, 3);
      const restOfQueue = queue.slice(3);

      // 最初の3枚を並列読み込み
      await Promise.allSettled(
        initialBatch.map((entry) => preloadImage(entry))
      );

      // 残りを順次読み込み（バックグラウンドで）
      for (const entry of restOfQueue) {
        await preloadImage(entry).catch(() => {});
        // 少し待機してブラウザのリソースを圧迫しないように
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      isPreloadingRef.current = false;
    };

    processPreloadQueue();

    // クリーンアップ
    return () => {
      preloadQueueRef.current = [];
    };
  }, [entries, currentIndex]);

  return preloadedImages.current;
};

export default useImagePreloader;
