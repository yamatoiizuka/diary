import React from "react";
import Typesetter from "palt-typesetting";
import { createCalendarMonth } from "../utils/calendar";
import "./AboutModal.scss";

const AboutModal = ({ isOpen, onClose }) => {
  const typesetter = new Typesetter({
    kerningRules: [
      { between: ["す", "。"], value: -120 },
      { between: ["2", "0"], value: 100 },
      { between: ["日", "、"], value: -120 },
    ],
  });

  // 2025年9月のカレンダーを生成（month: 8 = September）
  const septemberCalendar = createCalendarMonth(2025, 8);

  return (
    <div className={`about-modal ${isOpen ? "open" : ""}`}>
      <div className="content-container">
        <div className="image-container">
          <img
            src="profile.webp"
            alt="Profile"
            className="header-image"
            width={2000}
            height={1500}
          />
        </div>

        <div className="text-container">
          <p
            dangerouslySetInnerHTML={{
              __html: typesetter.render(`
                <a target="_blank" href="https://yamatoiizuka.com">
                  飯塚大和↑
                </a>
                の日記です。
                <br />
                <br />
                誕生日は5月4日、結婚記念日は8月20日です。このあたりはよく美味しいものを食べています。
                <br />
                <br />
                この Web サイトで採用している<a target="_blank" href="https://zenn.dev/yamatoiizuka/articles/79ad1b2099b966">CMS についての記事</a>を書いています。
                文字組に<a target="_blank" href="https://palt.typesetting.jp/">palt-typesetting</a>を使っています。
              `),
            }}
          />
        </div>
      </div>

      <div className="calendar-container calendar-overlay">
        <div className="month-section">
          <h2 className="month-title">{septemberCalendar.name}</h2>
          <div className="calendar-grid">
            {septemberCalendar.days.map((day) => (
              <div
                key={day.key}
                className={`calendar-day ${day.empty ? "other-month" : ""} ${!day.empty && day.day === 9 ? "active" : ""}`}
              >
                {!day.empty && day.day === 9 && (
                  <>
                    <span className="day-circle"></span>
                    <span className="day-number">{day.day}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <nav className="about-navigation navigation">
        <div className="nav-item" onClick={onClose}>
          もどる
        </div>
      </nav>
    </div>
  );
};

export default AboutModal;
