import React, { useState, useEffect, useRef } from "react";
import "./App.scss";
import {
  createCalendarMonth,
  getAllDiaryEntries,
  getAvailableMonths,
} from "./utils/calendar";
import { scrollToEntry } from "./utils/scrollHelpers";
import AllTextPreloader from "./components/AllTextPreloader";
import AboutModal from "./components/AboutModal";
import useImagePreloader from "./hooks/useImagePreloader";
import useAutoScroll from "./hooks/useAutoScroll";
import useScrollDetection from "./hooks/useScrollDetection";
import Typesetter from "palt-typesetting";
import "palt-typesetting/dist/typesetter.css";

// ビルド時のタイムスタンプを取得（開発時はDate.now()、本番時はビルドタイムスタンプ）
const BUILD_VERSION =
  typeof __BUILD_TIMESTAMP__ !== "undefined" ? __BUILD_TIMESTAMP__ : Date.now();

function App() {
  const typesetter = new Typesetter();
  const diaryEntries = getAllDiaryEntries();
  const [currentIndex, setCurrentIndex] = useState(diaryEntries.length - 1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showText, setShowText] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const containerRef = useRef(null);

  const activeEntry = diaryEntries[currentIndex] || {};

  // 画像のプリロード（最新から順番にバックグラウンドで読み込み）
  useImagePreloader(diaryEntries, currentIndex);

  // 自動スクロール機能
  useAutoScroll({
    isPlaying,
    currentIndex,
    diaryEntries,
    setCurrentIndex,
    containerRef,
  });

  // 手動スクロール検出
  useScrollDetection({
    containerRef,
    diaryEntries,
    setCurrentIndex,
  });

  // 初回マウント時のみ実行
  useEffect(() => {
    // DOM構築後にFONTPLUSをリロード
    if (window.FONTPLUS) {
      window.FONTPLUS.reload();
    }

    // 初回マウント時に最新エントリ（最下部）までスクロール
    if (activeEntry.date && containerRef.current) {
      scrollToEntry(activeEntry, containerRef.current, diaryEntries);
    }
  }, []);

  // アクティブなエントリの日付をtitleに設定
  useEffect(() => {
    if (activeEntry?.date) {
      document.title = activeEntry.date;
    }
  }, [activeEntry]);

  // データが存在する月のみカレンダーを生成
  const availableMonths = getAvailableMonths();
  const months = availableMonths.map(({ year, month }) =>
    createCalendarMonth(year, month)
  );

  return (
    <div className="container">
      <div className="content-container">
        {activeEntry.date && (
          <div className="image-container">
            <img
              src={`/images/${activeEntry.date}.webp?v=${BUILD_VERSION}`}
              alt={activeEntry.date}
              className="header-image"
              width={2000}
              height={1500}
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
      </div>

      <main className="calendar-container" ref={containerRef}>
        {months.map((month, monthIndex) => {
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
            </div>
          );
        })}
      </main>

      {/* Web フォント読み込みのため CSS で表示を切り替え */}
      <nav className="navigation">
        <div className="nav-item" onClick={() => setIsPlaying(!isPlaying)}>
          <span style={{ display: isPlaying ? "inline" : "none" }}>
            一時停止
          </span>
          <span style={{ display: !isPlaying ? "inline" : "none" }}>
            プレイ
          </span>
        </div>

        <div className="nav-item" onClick={() => setShowText(!showText)}>
          <span style={{ display: showText ? "inline" : "none" }}>
            画像のみ表示
          </span>
          <span style={{ display: !showText ? "inline" : "none" }}>
            テキスト表示
          </span>
        </div>

        <div className="nav-item" onClick={() => setIsAboutOpen(true)}>
          何
        </div>
      </nav>

      {/* Aboutモーダル */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* 全テキストコンテンツの事前レンダリング（非表示） */}
      <AllTextPreloader entries={diaryEntries} />
    </div>
  );
}

export default App;
