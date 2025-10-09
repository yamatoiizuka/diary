import diaryData from '../data/diary-entries.json'

export const monthNames = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
]

// 日記データから月のリストを取得
export const getAvailableMonths = () => {
  const monthsSet = new Set()
  diaryData.forEach(entry => {
    const date = new Date(entry.date)
    const yearMonth = `${date.getFullYear()}-${date.getMonth()}`
    monthsSet.add(yearMonth)
  })

  return Array.from(monthsSet).map(yearMonth => {
    const [year, month] = yearMonth.split('-').map(Number)
    return { year, month }
  }).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
}

// 特定の月の日記エントリを取得
export const getEntriesForMonth = (year, month) => {
  return diaryData.filter(entry => {
    const date = new Date(entry.date)
    return date.getFullYear() === year && date.getMonth() === month
  })
}

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
  const monthEntries = getEntriesForMonth(year, month)

  // 月の開始前の空セル
  for (let i = 0; i < firstDay; i++) {
    days.push({
      key: `empty-before-${month}-${i}`,
      empty: true
    })
  }

  // 月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = monthEntries.find(e => e.date === dateStr)

    days.push({
      key: `day-${month}-${day}`,
      day,
      month,
      year,
      date: dateStr,
      hasDiary: !!entry,
      entry: entry || null
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
    month,
    year
  }
}

// すべての日記エントリを取得
export const getAllDiaryEntries = () => {
  return diaryData.map(entry => {
    const date = new Date(entry.date)
    return {
      ...entry,
      month: date.getMonth(),
      day: date.getDate(),
      year: date.getFullYear()
    }
  })
}

// 日付に対応するエントリを取得
export const getEntryForDate = (dateStr) => {
  return diaryData.find(entry => entry.date === dateStr)
}

// デフォルト画像パスを取得
export const getDefaultImagePath = () => {
  return '/src/image/default.jpeg'
}