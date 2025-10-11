import React, { useState, useEffect, useRef } from "react";
import "./App.scss";
import {
  createCalendarMonth,
  getAllDiaryEntries,
  getAvailableMonths,
} from "./utils/calendar";
import {
  calculateEntryPositionInSection,
  calculateScrollPositionToCenterEntry,
} from "./utils/scrollHelpers";
import DebugScale from "./components/DebugScale";
import useImagePreloader from "./hooks/useImagePreloader";
import Typesetter from "palt-typesetting";
import "palt-typesetting/dist/typesetter.css";

function App() {
  const typesetter = new Typesetter();
  const diaryEntries = getAllDiaryEntries();
  const firstEntry = diaryEntries[diaryEntries.length - 1] || {
    date: "2025-01-03",
    image: "",
    text: "",
  };
  const [activeEntry, setActiveEntry] = useState(firstEntry);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showText, setShowText] = useState(true);
  const timerRef = useRef(null);
  const currentIndexRef = useRef(diaryEntries.length - 1);

  // 次の日付まで何秒かかるかの設定
  const secondsPerEntry = 2; // 各日付を2秒間表示

  // デバッグ目盛りの表示/非表示
  const showDebugScale = false;

  // 画像のプリロード（次の3枚を先読み）
  useImagePreloader(diaryEntries, currentIndexRef.current, isPlaying, 3);

  // 初回マウント時のみ実行
  useEffect(() => {
    // DOM構築後にFONTPLUSをリロード
    if (window.FONTPLUS) {
      window.FONTPLUS.reload();
    }
    // 初回マウント時に最新エントリ（最下部）までスクロール
    if (firstEntry && containerRef.current) {
      scrollToEntry(firstEntry);
    }
  }, []);

  // 特定のエントリまでスクロールする関数
  const scrollToEntry = (entry) => {
    const container = containerRef.current;
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

          const entryPosition = calculateEntryPositionInSection(
            sectionTop,
            sectionHeight,
            entryIndex,
            monthEntries.length
          );

          const scrollPosition = calculateScrollPositionToCenterEntry(
            entryPosition,
            container.clientHeight
          );

          container.scrollTop = scrollPosition;
          break;
        }
      }
    }
  };

  // 自動スクロール機能
  useEffect(() => {
    if (!isPlaying || diaryEntries.length === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const scrollToNext = () => {
      currentIndexRef.current--;
      if (currentIndexRef.current < 0) {
        // 最上部に到達しても再生状態は維持（動きは停止）
        currentIndexRef.current = 0;
        return;
      }

      const entry = diaryEntries[currentIndexRef.current];
      scrollToEntry(entry);
      setActiveEntry(entry);
    };

    // タイマー設定
    timerRef.current = setInterval(scrollToNext, secondsPerEntry * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying]);

  // 手動スクロール時の処理
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

          const entryPosition = calculateEntryPositionInSection(
            sectionTop,
            sectionHeight,
            idx,
            monthEntries.length
          );

          const distance = Math.abs(entryPosition - viewportCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestEntry = entry;
            closestIndex = entryIndex;
          }
        });
      });

      if (closestEntry) {
        setActiveEntry(closestEntry);
        currentIndexRef.current = closestIndex;
      }
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // 初回実行

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []); // 依存配列を空にして初回のみイベントリスナーを設定

  // データが存在する月のみカレンダーを生成
  const availableMonths = getAvailableMonths();
  const months = availableMonths.map(({ year, month }) =>
    createCalendarMonth(year, month)
  );

  return (
    <div className="container">
      {activeEntry.image && (
        <div className="image-container">
          <img
            src={activeEntry.image}
            alt="Diary Image"
            className="header-image"
          />
        </div>
      )}

      {showText && activeEntry.text && (
        <div className="text-container">
          <p
            dangerouslySetInnerHTML={{
              __html: typesetter.render(
                activeEntry.text.replace(/\n/g, "<br />")
              ),
            }}
          />
        </div>
      )}

      <main className="calendar-container" ref={containerRef}>
        {months.map((month, monthIndex) => {
          // 該当月の写真のある日をフィルタリング
          const monthDiaryEntries = diaryEntries.filter(
            (entry) => entry.month === month.month
          );

          // 現在表示中の日のインデックスを取得
          const currentDayIndex =
            activeEntry && activeEntry.month === month.month
              ? monthDiaryEntries.findIndex(
                  (entry) => entry.day === activeEntry.day
                )
              : -1;

          return (
            <div
              key={monthIndex}
              className="month-section"
              data-month={month.month}
            >
              <h2 className="month-title">{month.name}</h2>
              <div className="calendar-grid">
                {month.days.map((day) => (
                  <div
                    key={day.key}
                    className={`calendar-day ${day.empty ? "other-month" : ""} ${day.hasDiary ? "has-diary" : ""} ${day.hasDiary && activeEntry && activeEntry.date === day.date ? "active" : ""}`}
                    data-day={day.day}
                  >
                    {!day.empty && day.hasDiary && (
                      <>
                        <span className="day-circle"></span>
                        {activeEntry && activeEntry.date === day.date && (
                          <span className="day-number">{day.day}</span>
                        )}
                      </>
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
        <div className="nav-item" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "一時停止" : "プレイ"}
        </div>
        <div className="nav-item" onClick={() => setShowText(!showText)}>
          {showText ? "画像のみ表示" : "テキスト表示"}
        </div>
      </nav>
    </div>
  );
}

export default App;
