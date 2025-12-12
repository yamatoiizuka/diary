import { useEffect, useRef } from "react";

/**
 * 手動スクロール時にビューポート中心に最も近いエントリを検出するカスタムフック
 */
export const useScrollDetection = ({
  containerRef,
  diaryEntries,
  setCurrentIndex,
  setIsScrolling,
  isAutoScrollingRef,
}) => {
  const scrollTimeoutRef = useRef(null);
  const isTouchEndedRef = useRef(false);
  const isScrollStoppedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || diaryEntries.length === 0) return;

    // 両方の条件が揃った時のみisScrollingを解除
    const tryEndScrolling = () => {
      if (isTouchEndedRef.current && isScrollStoppedRef.current) {
        setIsScrolling(false);
        // フラグをリセット
        isTouchEndedRef.current = false;
        isScrollStoppedRef.current = false;
      }
    };

    // タッチ/マウス操作開始
    const handleInteractionStart = () => {
      hasUserInteractedRef.current = true;
      isTouchEndedRef.current = false;
      isScrollStoppedRef.current = false;
    };

    // タッチ/マウス操作終了
    const handleInteractionEnd = () => {
      isTouchEndedRef.current = true;
      tryEndScrolling();
    };

    const handleScroll = () => {
      // 自動スクロールによるscrollイベントはスキップ
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        return;
      }

      // ユーザーがtouchstartした後のみスクロール検出を有効化
      if (hasUserInteractedRef.current) {
        setIsScrolling(true);
        isScrollStoppedRef.current = false;

        // 既存のタイムアウトをクリア
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // スクロール終了を検出（150ms後）
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollStoppedRef.current = true;
          tryEndScrolling();
        }, 150);
      }
      // スクロール位置から現在のエントリを特定
      const scrollTop = container.scrollTop;
      const viewportCenter = scrollTop + container.clientHeight / 2;

      let closestEntry = null;
      let closestIndex = 0;
      let minDistance = Infinity;

      // 各月のセクションをチェック
      const monthSections = container.querySelectorAll(".month-section");
      monthSections.forEach((section) => {
        const monthIndex = parseInt(section.getAttribute("data-month"));
        const monthEntries = diaryEntries.filter((e) => e.month === monthIndex);

        monthEntries.forEach((entry, idx) => {
          const entryIndex = diaryEntries.findIndex((e) => e === entry);
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;

          // セクション内でエントリを均等配置した場合の位置を計算
          const entryPosition =
            sectionTop + (sectionHeight / monthEntries.length) * (idx + 0.5);

          const distance = Math.abs(entryPosition - viewportCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestEntry = entry;
            closestIndex = entryIndex;
          }
        });
      });

      if (closestEntry) {
        setCurrentIndex(closestIndex);
      }
    };

    // イベントリスナーを登録
    container.addEventListener("scroll", handleScroll);
    container.addEventListener("touchstart", handleInteractionStart);
    container.addEventListener("touchend", handleInteractionEnd);
    handleScroll(); // 初回実行

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("touchstart", handleInteractionStart);
      container.removeEventListener("touchend", handleInteractionEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []); // 依存配列を空にして初回のみイベントリスナーを設定
};

export default useScrollDetection;
