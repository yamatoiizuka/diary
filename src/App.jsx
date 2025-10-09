import React, { useState, useEffect, useRef } from "react";
import "./App.scss";
import {
  createCalendarMonth,
  getAllDiaryEntries,
  getAvailableMonths,
  getDefaultImagePath,
} from "./utils/calendar";
import DebugScale from "./components/DebugScale";

function App() {
  const diaryEntries = getAllDiaryEntries();
  const firstEntry = diaryEntries[0] || { date: "2025-01-03", image: "", text: "" };
  const [activeEntry, setActiveEntry] = useState(firstEntry);
  const [currentImage, setCurrentImage] = useState(firstEntry.image || getDefaultImagePath());
  const [currentTweet, setCurrentTweet] = useState(firstEntry.text || "");
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);
  const currentEntryIndexRef = useRef(0);
  const isAutoScrollingRef = useRef(false);
  const scrollDebounceRef = useRef(null);
  const isTemporarilyPausedRef = useRef(false);

  // 次の日付まで何秒かかるかの設定
  const secondsPerEntry = 2; // 各日付を2秒間表示

  // デバッグ目盛りの表示/非表示
  const showDebugScale = false;

  // FONTPLUSのフォント読み込み対応
  useEffect(() => {
    // DOM構築後にFONTPLUSをリロード
    if (window.FONTPLUS) {
      window.FONTPLUS.reload();
    }
  }, []); // 初回マウント時のみ実行

  // 各エントリのスクロール位置を計算する関数
  const calculateEntryScrollPositions = () => {
    const container = containerRef.current;
    if (!container) return [];

    const positions = [];
    const monthSections = container.querySelectorAll(".month-section");
    const containerHeight = container.clientHeight;

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
        // ビューポートの中央に来るように調整
        const scrollPosition = entryPosition - containerHeight / 2;
        positions.push({
          month: entry.month,
          day: entry.day,
          scrollPosition: Math.max(0, scrollPosition),
        });
      });
    });

    return positions;
  };

  // 現在のスクロール位置から最も近いエントリのインデックスを取得
  const findCurrentEntryIndex = (entryPositions) => {
    const container = containerRef.current;
    if (!container || entryPositions.length === 0) return 0;

    const currentScroll = container.scrollTop;
    const containerHeight = container.clientHeight;
    const viewportCenter = currentScroll + containerHeight / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    entryPositions.forEach((entry, index) => {
      // エントリの実際の画面上での位置を計算
      const entryViewportPosition = entry.scrollPosition + containerHeight / 2;
      const distance = Math.abs(entryViewportPosition - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  // 自動スクロール機能（時間ベース制御）
  useEffect(() => {
    const container = containerRef.current;
    if (!container || diaryEntries.length === 0) return;

    // 自動スクロールを開始する関数
    const startAutoScroll = () => {
      const entryPositions = calculateEntryScrollPositions();
      if (entryPositions.length === 0) return;

      // ユーザースクロールを検知した場合、現在位置から再計算
      if (!isAutoScrollingRef.current) {
        currentEntryIndexRef.current = findCurrentEntryIndex(entryPositions);
      }

      const scrollToNextEntry = () => {
        // 一時停止中はスキップ
        if (isTemporarilyPausedRef.current) return;

        if (currentEntryIndexRef.current < entryPositions.length) {
          const entry = entryPositions[currentEntryIndexRef.current];
          // 自動スクロール中フラグを立てる
          isAutoScrollingRef.current = true;
          // パッと切り替える（スムーズアニメーション無し）
          container.scrollTop = entry.scrollPosition;

          // 少し遅延してからフラグをリセット（スクロールイベントが完了するまで待つ）
          setTimeout(() => {
            isAutoScrollingRef.current = false;
          }, 100);

          currentEntryIndexRef.current++;

          // 最後のエントリに到達したら停止
          if (currentEntryIndexRef.current >= entryPositions.length) {
            setIsPlaying(false);
            currentEntryIndexRef.current = 0; // リセット
          }
        }
      };

      // 初回は即座に実行
      scrollToNextEntry();

      // その後は指定秒数ごとに実行
      if (currentEntryIndexRef.current < entryPositions.length) {
        timerRef.current = setInterval(
          scrollToNextEntry,
          secondsPerEntry * 1000
        );
      }
    };

    if (isPlaying && !isTemporarilyPausedRef.current) {
      startAutoScroll();
    } else {
      // 再生停止時はタイマーをクリア
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, diaryEntries.length]);

  // スクロールインタラクションの処理
  useEffect(() => {
    const container = containerRef.current;
    if (!container || diaryEntries.length === 0) return;

    const handleScroll = () => {
      // ユーザーによる手動スクロールを検知
      if (!isAutoScrollingRef.current && isPlaying) {
        // 一時停止フラグを立てる
        isTemporarilyPausedRef.current = true;

        // タイマーをクリア
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // スクロール終了を検知するためのdebounce処理
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }

        scrollDebounceRef.current = setTimeout(() => {
          // スクロールが終了したら再開
          if (isPlaying && isTemporarilyPausedRef.current) {
            isTemporarilyPausedRef.current = false;

            // 現在位置から再計算して再開
            const entryPositions = calculateEntryScrollPositions();
            currentEntryIndexRef.current =
              findCurrentEntryIndex(entryPositions);

            // 次のエントリへ移動する関数
            const scrollToNextEntry = () => {
              if (isTemporarilyPausedRef.current) return;

              if (currentEntryIndexRef.current < entryPositions.length) {
                const entry = entryPositions[currentEntryIndexRef.current];
                isAutoScrollingRef.current = true;
                container.scrollTop = entry.scrollPosition;

                setTimeout(() => {
                  isAutoScrollingRef.current = false;
                }, 100);

                currentEntryIndexRef.current++;

                if (currentEntryIndexRef.current >= entryPositions.length) {
                  setIsPlaying(false);
                  currentEntryIndexRef.current = 0;
                }
              }
            };

            // 次のエントリへ即座に移動
            scrollToNextEntry();

            // タイマーを再設定
            if (currentEntryIndexRef.current < entryPositions.length) {
              timerRef.current = setInterval(
                scrollToNextEntry,
                secondsPerEntry * 1000
              );
            }
          }
        }, 500); // スクロール終了後500ms待つ
      }

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
        setActiveEntry(closestEntry);
        updateImage(closestEntry);
        setCurrentTweet(closestEntry.text || "");
      }
    };

    container.addEventListener("scroll", handleScroll);
    // 初回実行
    handleScroll();
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [isPlaying, secondsPerEntry]);

  // 画像を更新（存在しない場合はデフォルトにフォールバック）
  const updateImage = (entry) => {
    if (!entry || !entry.image) {
      setCurrentImage(getDefaultImagePath());
      return;
    }

    const testImage = new Image();
    testImage.onload = () => {
      setCurrentImage(entry.image);
    };
    testImage.onerror = () => {
      setCurrentImage(getDefaultImagePath());
    };
    testImage.src = entry.image;
  };

  // データが存在する月のみカレンダーを生成
  const availableMonths = getAvailableMonths();
  const months = availableMonths.map(({ year, month }) =>
    createCalendarMonth(year, month)
  );

  return (
    <div className="container">
      <div className="image-container">
        <img src={currentImage} alt="Diary Image" className="header-image" />
      </div>

      <div className="text-container">
        <p dangerouslySetInnerHTML={{ __html: currentTweet.replace(/\n/g, '<br />') }} />
      </div>

      <main className="calendar-container" ref={containerRef}>
        {months.map((month, monthIndex) => {
          // 該当月の写真のある日をフィルタリング
          const monthDiaryEntries = diaryEntries.filter(
            (entry) => entry.month === monthIndex
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
              data-month={monthIndex}
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
        <div className="nav-item">再生速度</div>
        <div className="nav-item" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "一時停止" : "プレイ"}
        </div>
        <div className="nav-item">シャッフル</div>
      </nav>
    </div>
  );
}

export default App;
