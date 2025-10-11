import React from "react";

/**
 * 全てのテキストコンテンツを非表示でレンダリングして
 * FONTPLUSのダイナミックサブセット機能でフォントを完全に読み込む
 */
const AllTextPreloader = ({ entries }) => {
  // 全ユニーク文字を収集（重複を避けるため）
  const uniqueChars = React.useMemo(() => {
    const charSet = new Set();

    // 日付の文字を追加
    entries.forEach((entry) => {
      if (entry.date) {
        const formattedDate = entry.date.replace(/-/g, ".");
        [...formattedDate].forEach((char) => charSet.add(char));
      }

      // テキストの文字を追加（最初の500文字で十分）
      if (entry.text) {
        const text = entry.text.substring(0, 500);
        [...text].forEach((char) => charSet.add(char));
      }
    });

    return Array.from(charSet).join("");
  }, [entries]);

  return (
    <div
      className="all-text-preloader"
      style={{
        position: "fixed",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        visibility: "hidden",
        pointerEvents: "none",
        userSelect: "none",
        opacity: 0,
        zIndex: -9999,
      }}
      aria-hidden="true"
    >
      {/* CezannePro-M用の文字 */}
      <div
        style={{
          fontFamily: "CezannePro-M, sans-serif",
        }}
      >
        {uniqueChars}
      </div>

      {/* Helvetica Now Text用の文字（カレンダー用） */}
      <div
        style={{
          fontFamily:
            '"Helvetica Now Text", HelveticaNowText-Regular, sans-serif',
        }}
      >
        ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
      </div>
    </div>
  );
};

export default AllTextPreloader;
