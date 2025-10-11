import React from "react";
import Typesetter from "palt-typesetting";
import "./AboutModal.scss";

const AboutModal = ({ isOpen, onClose }) => {
  const typesetter = new Typesetter({
    kerningRules: [{ between: ["す", "。"], value: -140 }],
  });
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
                GitHubで<a target="_blank" href="https://github.com/yamatoiizuka/yi-diary">ソースコード</a>を公開しています。
                文字組に<a target="_blank" href="https://palt.typesetting.jp/">palt-typesetting</a>を使っています。
              `),
            }}
          />
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
