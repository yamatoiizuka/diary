/**
 * セクション内でのエントリの位置を計算
 * @param {number} sectionTop - セクションの上端位置
 * @param {number} sectionHeight - セクションの高さ
 * @param {number} entryIndex - エントリのインデックス
 * @param {number} totalEntries - セクション内の総エントリ数
 * @returns {number} エントリの画面上の位置
 */
export const calculateEntryPositionInSection = (sectionTop, sectionHeight, entryIndex, totalEntries) => {
  // セクション内でエントリを均等配置した場合の位置を計算
  // entryIndex + 0.5 は、エントリの中央位置を取得するため
  return sectionTop + (sectionHeight / totalEntries) * (entryIndex + 0.5);
};

/**
 * エントリをビューポート中央に表示するためのスクロール位置を計算
 * @param {number} entryPosition - エントリの画面上の位置
 * @param {number} containerHeight - コンテナの高さ
 * @returns {number} スクロール位置
 */
export const calculateScrollPositionToCenterEntry = (entryPosition, containerHeight) => {
  // エントリをビューポートの中央に配置するため、コンテナの高さの半分を引く
  return Math.max(0, entryPosition - containerHeight / 2);
};