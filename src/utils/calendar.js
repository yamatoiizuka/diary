// 日記がある日付の定義
export const diaryDays = {
  0: [3, 5, 8, 11, 12, 14, 17, 18, 19, 20, 24, 25, 26, 28, 29, 31], // 1月
  1: [1, 2, 6, 9, 10, 12, 13, 15, 16, 21, 22, 23, 25, 26, 27, 28], // 2月
  2: Array.from({length: 31}, (_, i) => i + 1) // 3月（すべて日記あり）
}

export const monthNames = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
]

export const monthNamesShort = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]

// 月の日数を取得
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate()
}

// 月の最初の曜日を取得（0 = 日曜日）
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay()
}

// 月のカレンダーデータを作成
export const createCalendarMonth = (year, month) => {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days = []

  // 月の開始前の空セル
  for (let i = 0; i < firstDay; i++) {
    days.push({ 
      key: `empty-before-${month}-${i}`, 
      empty: true 
    })
  }

  // 月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    const hasDiary = diaryDays[month] && diaryDays[month].includes(day)
    days.push({
      key: `day-${month}-${day}`,
      day,
      month,
      hasDiary
    })
  }

  // グリッドを完成させるための空セル
  const totalCells = firstDay + daysInMonth
  const totalRows = Math.ceil(totalCells / 7)
  const cellsNeeded = totalRows * 7
  const remainingCells = cellsNeeded - totalCells
  
  for (let i = 0; i < remainingCells; i++) {
    days.push({ 
      key: `empty-after-${month}-${i}`, 
      empty: true 
    })
  }

  return {
    name: `${monthNames[month]}, ${year}`,
    days,
    month
  }
}

// すべての日記エントリを取得
export const getAllDiaryEntries = () => {
  const entries = []
  Object.keys(diaryDays).forEach(monthKey => {
    const month = parseInt(monthKey)
    diaryDays[month].forEach(day => {
      entries.push({ month, day })
    })
  })
  return entries
}

// 日付に対応する画像パスを取得
export const getImagePath = (month, day) => {
  return `/src/image/${day}-${monthNamesShort[month]}.jpeg`
}

// デフォルト画像パスを取得
export const getDefaultImagePath = () => {
  return '/src/image/default.jpeg'
}