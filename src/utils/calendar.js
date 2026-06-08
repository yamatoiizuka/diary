import {
  getEntryMonthKey,
  getNormalizedDiaryEntries,
} from "./entries";

/**
 * 月名の配列（英語大文字）
 * @constant {string[]}
 */
export const monthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/**
 * 日記データから利用可能な月のリストを取得する
 * @returns {Array<{year: number, month: number}>} 年と月のオブジェクトの配列（昇順）
 */
export const getAvailableMonths = () => {
  const monthsSet = new Set();
  getNormalizedDiaryEntries().forEach((entry) => {
    monthsSet.add(getEntryMonthKey(entry));
  });

  return Array.from(monthsSet)
    .map((yearMonth) => {
      const [year, month] = yearMonth.split("-").map(Number);
      return { year, month: month - 1 };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
};

/**
 * 特定の月の日記エントリを取得する
 * @param {number} year - 年
 * @param {number} month - 月（0-11）
 * @returns {Array<Object>} 該当月の日記エントリの配列
 */
export const getEntriesForMonth = (year, month) => {
  return getNormalizedDiaryEntries().filter(
    (entry) => entry.year === year && entry.month === month
  );
};

/**
 * 指定された月の日数を取得する
 * @param {number} year - 年
 * @param {number} month - 月（0-11）
 * @returns {number} 月の日数
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * 月の最初の日の曜日を取得する
 * @param {number} year - 年
 * @param {number} month - 月（0-11）
 * @returns {number} 曜日（0=日曜日, 1=月曜日, ..., 6=土曜日）
 */
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

/**
 * 月のカレンダーデータを作成する
 * カレンダーグリッドに必要な空セルを含めた日付データを生成する
 * @param {number} year - 年
 * @param {number} month - 月（0-11）
 * @returns {{name: string, days: Array<Object>, month: number, year: number}} カレンダーデータ
 */
export const createCalendarMonth = (year, month) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];
  const monthEntries = getEntriesForMonth(year, month);

  // 月の開始前の空セル
  for (let i = 0; i < firstDay; i++) {
    days.push({
      key: `empty-before-${month}-${i}`,
      empty: true,
    });
  }

  // 月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const dayEntries = monthEntries.filter((entry) => entry.date === dateStr);

    days.push({
      key: `day-${year}-${month}-${day}`,
      day,
      month,
      year,
      date: dateStr,
      hasDiary: dayEntries.length > 0,
      entry: dayEntries[0] || null,
      entries: dayEntries,
    });
  }

  // グリッドを完成させるための空セル
  const totalCells = firstDay + daysInMonth;
  const totalRows = Math.ceil(totalCells / 7);
  const cellsNeeded = totalRows * 7;
  const remainingCells = cellsNeeded - totalCells;

  for (let i = 0; i < remainingCells; i++) {
    days.push({
      key: `empty-after-${month}-${i}`,
      empty: true,
    });
  }

  return {
    name: `${monthNames[month]}, ${year}`,
    days,
    month,
    year,
  };
};

/**
 * すべての日記エントリを取得し、年月日の情報を追加する
 * 日付順（昇順）でソートされる
 * @returns {Array<Object>} 年月日情報が追加された日記エントリの配列（日付昇順）
 */
export const getAllDiaryEntries = () => {
  return getNormalizedDiaryEntries();
};
