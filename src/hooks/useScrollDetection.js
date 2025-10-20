import { useEffect } from "react";

/**
 * 手動スクロール時にビューポート中心に最も近いエントリを検出するカスタムフック
 */
export const useScrollDetection = ({
  containerRef,
  diaryEntries,
  setCurrentIndex,
}) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || diaryEntries.length === 0) return;

    const handleScroll = () => {
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

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // 初回実行

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []); // 依存配列を空にして初回のみイベントリスナーを設定
};

export default useScrollDetection;
