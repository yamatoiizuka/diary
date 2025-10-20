import { useEffect, useRef } from "react";
import { scrollToEntry } from "../utils/scrollHelpers";

/**
 * 自動スクロール機能を管理するカスタムフック
 * @param {boolean} isPlaying - 自動スクロールの再生状態
 * @param {Array} diaryEntries - 日記エントリの配列
 * @param {Object} activeEntry - 現在アクティブなエントリ
 * @param {Function} setActiveEntry - アクティブエントリを更新する関数
 * @param {Object} containerRef - スクロールコンテナのref
 * @param {number} intervalSeconds - スクロール間隔（秒）
 */
export const useAutoScroll = ({
  isPlaying,
  diaryEntries,
  activeEntry,
  setActiveEntry,
  containerRef,
  intervalSeconds = 2,
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
      const currentIndex = diaryEntries.findIndex(
        (e) => e.date === activeEntry.date
      );
      const nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        // 最上部に到達しても再生状態は維持（動きは停止）
        return;
      }

      const entry = diaryEntries[nextIndex];
      scrollToEntry(entry, containerRef.current, diaryEntries);
      setActiveEntry(entry);
    };

    // タイマー設定
    timerRef.current = setInterval(scrollToNext, intervalSeconds * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isPlaying,
    activeEntry,
    diaryEntries,
    setActiveEntry,
    containerRef,
    intervalSeconds,
  ]);
};

export default useAutoScroll;
