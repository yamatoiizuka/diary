import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  createCalendarMonth,
  getAllDiaryEntries,
  getImagePath,
  getDefaultImagePath,
} from "./utils/calendar";
import DebugScale from "./components/DebugScale";

function App() {
  const initialDate = { month: 0, day: 3 };
  const [activeDate, setActiveDate] = useState(initialDate);
  const [currentImage, setCurrentImage] = useState(
    getImagePath(initialDate.month, initialDate.day)
  );
  const containerRef = useRef(null);
  const diaryEntries = getAllDiaryEntries();

  // デバッグ目盛りの表示/非表示
  const showDebugScale = false;

  // スクロールインタラクションの処理
  useEffect(() => {
    const container = containerRef.current;
    if (!container || diaryEntries.length === 0) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const monthSections = container.querySelectorAll(".month-section");
      const containerHeight = container.clientHeight;
      const viewportCenter = scrollTop + containerHeight / 2;

      // ビューポート中央に最も近い日記エントリを見つける
      let closestEntry = null;
      let minDistance = Infinity;

      monthSections.forEach((section, monthIndex) => {
        const monthEntries = diaryEntries.filter(
          (entry) => entry.month === monthIndex
        );
        if (monthEntries.length === 0) return;

        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        // 各エントリの位置を計算（セクション内で均等配置）
        monthEntries.forEach((entry, index) => {
          const entryPosition =
            sectionTop + (sectionHeight / monthEntries.length) * (index + 0.5);
          const distance = Math.abs(entryPosition - viewportCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestEntry = entry;
          }
        });
      });

      // 最も近いエントリをアクティブに設定
      if (closestEntry) {
        const newActiveDate = {
          month: closestEntry.month,
          day: closestEntry.day,
        };
        setActiveDate(newActiveDate);
        updateImage(newActiveDate.month, newActiveDate.day);
      }
    };

    container.addEventListener("scroll", handleScroll);
    // 初回実行
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 画像を更新（存在しない場合はデフォルトにフォールバック）
  const updateImage = (monthIndex, day) => {
    const imagePath = getImagePath(monthIndex, day);

    const testImage = new Image();
    testImage.onload = () => {
      setCurrentImage(imagePath);
    };
    testImage.onerror = () => {
      setCurrentImage(getDefaultImagePath());
    };
    testImage.src = imagePath;
  };

  // カレンダーの月を生成
  const months = [
    createCalendarMonth(2025, 0),
    createCalendarMonth(2025, 1),
    createCalendarMonth(2025, 2),
  ];

  return (
    <div className="container">
      <div className="image-container">
        <img src={currentImage} alt="Diary Image" className="header-image" />
      </div>

      <main className="calendar-container" ref={containerRef}>
        {months.map((month, monthIndex) => {
          // 該当月の写真のある日をフィルタリング
          const monthDiaryEntries = diaryEntries.filter(
            (entry) => entry.month === monthIndex
          );

          // 現在表示中の日のインデックスを取得
          const currentDayIndex =
            activeDate.month === monthIndex
              ? monthDiaryEntries.findIndex(
                  (entry) => entry.day === activeDate.day
                )
              : -1;

          return (
            <div
              key={monthIndex}
              className="month-section"
              data-month={monthIndex}
            >
              <h2 className="month-title">{month.name}</h2>
              <div className="calendar-grid">
                {month.days.map((day) => (
                  <div
                    key={day.key}
                    className={`calendar-day ${day.empty ? "other-month" : ""} ${day.hasDiary ? "has-diary" : ""} ${day.hasDiary && activeDate.month === day.month && activeDate.day === day.day ? "active" : ""}`}
                    data-day={day.day}
                  >
                    {!day.empty && (
                      <span className="day-number">{day.day}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* デバッグ用の目盛り */}
              {showDebugScale && (
                <DebugScale
                  entries={monthDiaryEntries}
                  currentDayIndex={currentDayIndex}
                />
              )}
            </div>
          );
        })}
      </main>

      <nav className="navigation">
        <div className="nav-item">再生速度</div>
        <div className="nav-item">プレイ</div>
        <div className="nav-item">シャッフル</div>
      </nav>
    </div>
  );
}

export default App;
