import { useEffect, useRef } from "react";

/**
 * 手動スクロール時にビューポート中心に最も近いエントリを検出するカスタムフック
 */
export const useScrollDetection = ({
  containerRef,
  diaryEntries,
  setCurrentIndex,
  setIsScrolling,
}) => {
  const scrollTimeoutRef = useRef(null);
  const userHasInteractedRef = useRef(false);
  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || diaryEntries.length === 0) return;

    // ユーザーがタッチ/マウス操作を開始したらフラグを立てる
    const handleInteractionStart = () => {
      userHasInteractedRef.current = true;
      isUserScrollingRef.current = true;
    };

    const handleScroll = () => {
      // ユーザー操作によるスクロール中のみ手動スクロールとして扱う
      if (setIsScrolling && isUserScrollingRef.current) {
        setIsScrolling(true);

        // 既存のタイムアウトをクリア
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // スクロール終了を検出（150ms後）- 慣性スクロールも含めてスクロールが止まったら解除
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          isUserScrollingRef.current = false;
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
    container.addEventListener("mousedown", handleInteractionStart);
    handleScroll(); // 初回実行

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("touchstart", handleInteractionStart);
      container.removeEventListener("mousedown", handleInteractionStart);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []); // 依存配列を空にして初回のみイベントリスナーを設定
};

export default useScrollDetection;
