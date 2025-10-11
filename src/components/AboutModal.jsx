import React from "react";
import "./AboutModal.scss";

const AboutModal = ({ isOpen, onClose }) => {
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
          <p>
            <a target="_blank" href="https://yamatoiizuka.com">
              飯塚大和↑
            </a>
            の日記です
          </p>
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
