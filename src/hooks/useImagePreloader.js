import { useEffect, useRef } from 'react';

/**
 * 画像のプリロードを管理するカスタムフック
 * @param {Array} entries - 日記エントリの配列
 * @param {number} currentIndex - 現在のインデックス
 * @param {boolean} isPlaying - 再生中かどうか
 * @param {number} preloadCount - 先読みする画像の数（デフォルト: 3）
 */
export const useImagePreloader = (entries, currentIndex, isPlaying, preloadCount = 3) => {
  const preloadedImages = useRef(new Map());

  useEffect(() => {
    if (!entries || entries.length === 0) return;

    // プリロードする画像のインデックスを決定
    const indicesToPreload = [];

    // 再生中の場合は次の画像を先読み
    if (isPlaying) {
      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = currentIndex - i; // 逆方向にスクロールしているため
        if (nextIndex >= 0) {
          indicesToPreload.push(nextIndex);
        }
      }
    } else {
      // 停止中は前後の画像を先読み
      for (let i = 1; i <= Math.floor(preloadCount / 2); i++) {
        const nextIndex = currentIndex - i;
        const prevIndex = currentIndex + i;

        if (nextIndex >= 0) indicesToPreload.push(nextIndex);
        if (prevIndex < entries.length) indicesToPreload.push(prevIndex);
      }
    }

    // 画像のプリロード実行
    indicesToPreload.forEach(index => {
      const entry = entries[index];
      if (entry?.image && !preloadedImages.current.has(entry.image)) {
        const img = new Image();
        img.src = entry.image;

        img.onload = () => {
          preloadedImages.current.set(entry.image, img);
          // 古い画像をキャッシュから削除（メモリ管理）
          if (preloadedImages.current.size > 10) {
            const firstKey = preloadedImages.current.keys().next().value;
            preloadedImages.current.delete(firstKey);
          }
        };

        img.onerror = () => {
          console.warn(`Failed to preload image: ${entry.image}`);
        };
      }
    });

    // クリーンアップ
    return () => {
      // コンポーネントがアンマウントされる時のクリーンアップ
    };
  }, [entries, currentIndex, isPlaying, preloadCount]);

  return preloadedImages.current;
};

export default useImagePreloader;