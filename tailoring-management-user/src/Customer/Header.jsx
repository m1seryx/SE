import React from "react";
import "../styles/Header.css";
import logo from "../assets/logo.png";
import profile from "../assets/dp.png";

const Header = () => {
  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProfileClick = () => {
    // profile menu or future /profile route can go here
  };

  return (
    <header className="header">
      <div className="logo" onClick={handleLogoClick}>
        <img className="picture" src={logo} alt="logo" />
        <p className="logoname">D&apos;Jackman Tailor Deluxe</p>
      </div>

      <nav className="dashboard">
        <ul>
          <li>
            <a href="#top">Home</a>
          </li>
          <li>
            <a href="#Appointment">Appointment</a>
          </li>
          <li>
            <a href="#Rentals">Rental</a>
          </li>
          <li>
            <a href="#Customize">Customize</a>
          </li>
          <li>
            <a href="#Repair">Repair</a>
          </li>
        </ul>
      </nav>

      <div className="notif-profile">
        <img
          className="profile"
          src={profile}
          alt="profile"
          onClick={handleProfileClick}
        />
      </div>
    </header>
  );
};

export default Header;

