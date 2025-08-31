import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { 
  createCalendarMonth, 
  getAllDiaryEntries, 
  getImagePath, 
  getDefaultImagePath 
} from './utils/calendar'

function App() {
  const [activeDate, setActiveDate] = useState({ month: 0, day: 3 })
  const [currentImage, setCurrentImage] = useState(getDefaultImagePath())
  const containerRef = useRef(null)
  const [diaryEntries, setDiaryEntries] = useState([])
  const isInitialized = useRef(false)

  // 日記エントリを初回のみ初期化
  useEffect(() => {
    if (!isInitialized.current) {
      setDiaryEntries(getAllDiaryEntries())
      isInitialized.current = true
    }
  }, [])

  // アクティブな日付が変更されたら画像を更新
  useEffect(() => {
    updateImage(activeDate.month, activeDate.day)
  }, [activeDate])

  // スクロールインタラクションの処理
  useEffect(() => {
    const container = containerRef.current
    if (!container || diaryEntries.length === 0) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const monthSections = container.querySelectorAll('.month-section')
      
      // 現在の月を検索
      let currentMonthIndex = 0
      for (let i = 0; i < monthSections.length; i++) {
        if (scrollTop >= monthSections[i].offsetTop - 360) {
          currentMonthIndex = i
        }
      }
      
      // 現在の月の日記エントリを取得
      const currentMonthEntries = diaryEntries.filter(
        entry => entry.month === currentMonthIndex
      )
      if (currentMonthEntries.length === 0) return
      
      // スクロール進行度に基づいてアクティブなインデックスを計算
      const monthSection = monthSections[currentMonthIndex]
      const monthTop = monthSection.offsetTop - 360
      const monthHeight = monthSection.offsetHeight
      const scrollInMonth = Math.max(0, scrollTop - monthTop)
      const scrollProgress = Math.min(1, scrollInMonth / monthHeight)
      
      const activeIndex = Math.min(
        currentMonthEntries.length - 1,
        Math.floor(scrollProgress * currentMonthEntries.length)
      )
      
      setActiveDate({
        month: currentMonthEntries[activeIndex].month,
        day: currentMonthEntries[activeIndex].day
      })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [diaryEntries])

  // 画像を更新（存在しない場合はデフォルトにフォールバック）
  const updateImage = (monthIndex, day) => {
    const imagePath = getImagePath(monthIndex, day)
    
    const testImage = new Image()
    testImage.onload = () => {
      setCurrentImage(imagePath)
    }
    testImage.onerror = () => {
      setCurrentImage(getDefaultImagePath())
    }
    testImage.src = imagePath
  }

  // カレンダーの月を生成
  const months = [
    createCalendarMonth(2025, 0),
    createCalendarMonth(2025, 1),
    createCalendarMonth(2025, 2)
  ]

  return (
    <div className="container">
      <div className="image-container">
        <img src={currentImage} alt="Diary Image" className="header-image" />
      </div>
      
      <main className="calendar-container" ref={containerRef}>
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="month-section" data-month={monthIndex}>
            <h2 className="month-title">{month.name}</h2>
            <div className="calendar-grid">
              {month.days.map(day => (
                <div
                  key={day.key}
                  className={`calendar-day ${day.empty ? 'other-month' : ''} ${day.hasDiary ? 'has-diary' : ''} ${day.hasDiary && activeDate.month === day.month && activeDate.day === day.day ? 'active' : ''}`}
                  data-day={day.day}
                >
                  {!day.empty && <span className="day-number">{day.day}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
      
      <nav className="navigation">
        <div className="nav-item">再生速度</div>
        <div className="nav-item">プレイ</div>
        <div className="nav-item">シャッフル</div>
      </nav>
    </div>
  )
}

export default App