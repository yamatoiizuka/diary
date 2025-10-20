/**
 * 特定のエントリまでスクロールする
 * @param {Object} entry - スクロール先のエントリ
 * @param {HTMLElement} container - スクロールコンテナ
 * @param {Array} diaryEntries - 日記エントリの配列
 */
export const scrollToEntry = (entry, container, diaryEntries) => {
  if (!container) return;

  const monthSections = container.querySelectorAll(".month-section");
  for (const section of monthSections) {
    const monthIndex = parseInt(section.getAttribute("data-month"));
    if (monthIndex === entry.month) {
      const monthEntries = diaryEntries.filter((e) => e.month === monthIndex);
      const entryIndex = monthEntries.findIndex((e) => e.day === entry.day);
      if (entryIndex !== -1) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        // セクション内でエントリを均等配置した場合の位置を計算
        // entryIndex + 0.5 は、エントリの中央位置を取得するため
        const entryPosition =
          sectionTop + (sectionHeight / monthEntries.length) * (entryIndex + 0.5);

        // エントリをビューポートの中央に配置するため、コンテナの高さの半分を引く
        const scrollPosition = Math.max(0, entryPosition - container.clientHeight / 2);

        container.scrollTop = scrollPosition;
        break;
      }
    }
  }
};
