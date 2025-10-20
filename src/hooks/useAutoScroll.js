import { useEffect, useRef } from "react";
import { scrollToEntry } from "../utils/scrollHelpers";

/**
 * 自動スクロール機能を管理するカスタムフック
 */
export const useAutoScroll = ({
  isPlaying,
  currentIndex,
  diaryEntries,
  setCurrentIndex,
  containerRef,
}) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || diaryEntries.length === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const scrollToNext = () => {
      const nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        // 最上部に到達しても再生状態は維持（動きは停止）
        return;
      }

      const entry = diaryEntries[nextIndex];
      scrollToEntry(entry, containerRef.current, diaryEntries);
      setCurrentIndex(nextIndex);
    };

    // タイマー設定
    timerRef.current = setInterval(scrollToNext, 2 * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, currentIndex, diaryEntries, setCurrentIndex, containerRef]);
};

export default useAutoScroll;
