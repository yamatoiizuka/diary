import React from 'react'

/**
 * デバッグ用の目盛りコンポーネント
 * 各月の写真のある日数分の目盛りを表示し、
 * 現在アクティブな日の目盛りを2倍の長さで表示する
 */
const DebugScale = ({ entries, currentDayIndex }) => {
  if (!entries || entries.length === 0) return null

  return (
    <div className="debug-scale">
      {entries.map((entry, index) => (
        <div
          key={`scale-${entry.day}`}
          className={`scale-tick ${index === currentDayIndex ? 'active-tick' : ''}`}
          title={`${entry.day}日`}
        />
      ))}
    </div>
  )
}

export default DebugScale