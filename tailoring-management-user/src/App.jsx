import React, { useState } from "react";
import "./app.css";

// Import your images
import logo from "../src/assets/logo.png";
import profile from "../src/assets/dp.png";
import background from "../src/assets/background.jpg";
import tailorBackground from "../src/assets/tailorbackground.jpg";
import rentImage from "../src/assets/background11.jpg";
import suitImage from "../src/assets/suits.png";

const CustomerPage = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const toggleMenu = () => {
    // Profile menu logic here if needed
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <div>
      <div className="head"></div>

      {/* Header */}
      <div className="header">
        <div className="logo">
          <img className="picture" src={logo} alt="logo" />
          <p className="logoname">D’jackman Tailor Deluxe</p>
        </div>

        <div className="dashboard">
          <ul>
            <li><a href="#top">Home</a></li>
            <li><a href="#Appointment">Appointment</a></li>
            <li><a href="#Rentals">Rental</a></li>
            <li><a href="#Customize">Customize</a></li>
            <li><a href="#Repair">Repair</a></li>
            <li><a href="#About">About</a></li>
          </ul>
        </div>

        <div className="notif-profile">
          <img className="profile" src={profile} alt="profile" onClick={toggleMenu} />
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="bg"
        id="top"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="overlay"></div>
        <p className="info">
          <b className="welcome">Welcome to Jackman <br />Tailor Deluxe!</b><br />
          <span className="text">Your Perfect Fit Awaits.</span>
        </p>
        
      </div>

      {/* Services */}
      <div className="services">
        <p className="serv">Jackman's Services</p>
        <div className="serviceContainer">
          <section className="container">
            {["Rental", "Customize", "Repair"].map((service) => (
              <div className="card" key={service}>
                <div
                  className="card-image"
                  style={{ backgroundImage: `url(${tailorBackground})` }}
                ></div>
                <div className="footer">
                  <h5 className="service-type">{service}</h5>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Appointment */}
      <div className="appointment" id="Appointment">
        <h1 className="appointment-text">Appointment</h1>
        <div className="app-image">
          <img src={background} className="appointment-pic" alt="Appointment" />
          <div className="book">
            <p className="app-text">Ready to experience our services?</p><br />
            <p className="app-text">Book your appointment now!</p>
            <div className="book-bar">
              <button> <span className="text2">Book now</span></button>
            </div>
          </div>
        </div>
      </div>

      {/* Rental */}
      <div className="rental" id="Rentals">
        <div className="div">
          <h1 className="rent-textt">Rental Clothes</h1>
          <div className="see-more-div">
            <a href="Rental.html" target="_blank" className="see-more">
              See more &rarr;
            </a>
          </div>
        </div>
        <section className="rent-container">
          {["Shirt", "Blazer", "Slacks"].map((item) => (
            <div className="rent-card" key={item}>
              <div className="rent-image">
                <img src={rentImage} alt={item} />
                <h2>{item}</h2>
                <h6>P 500</h6>
                <button className="rent-book" onClick={openModal}>
                  View Info
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div id="itemModal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <div className="item-container">
              <div className="item-image">
                <img src={suitImage} alt="Men Suit All in Gray" />
              </div>
              <div className="item-details">
                <h2 className="item-title">Men Suit All in Gray</h2>
                <p><strong>Size:</strong> Medium</p>
                <p><strong>Price:</strong> ₱800/day</p>
                <p><strong>Description:</strong> Fabric type: Wool blend, color: gray, length: regular</p>
                <label htmlFor="date">Date</label><br />
                <input type="date" id="date" className="calendar-input" />
                <button className="rent-btn">RENT</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize */}
      <div className="custom" id="Customize">
        <div className="custom-info">
          <h1 className="customize">Customization</h1>
          <p className="customize-p">Got a style in mind?</p><br />
          <p className="customize-p">Personalize it and turn your vision into reality!</p>
        </div>
        <div className="custom-pic">
          <div className="custom-image">
            <button className="custom-book" onClick={() => window.location.href=''}>
              Customize now!
            </button>
          </div>
        </div>
      </div>

      {/* Repair */}
      <div className="repair" id="Repair">
        <h1 className="repair-text">Repair Service</h1>
        <div className="repair-container">
          <div className="repair-bg" style={{ backgroundImage: `url(${background})` }}>
            <div className="repair-overlay"></div>
            <div className="repair-info">
              <b className="repair-welcome">Need reliable repair services?</b><br />
              <p className="repair-subtext">Get in touch with us today!</p>
              <button className="book-button">Book Now!</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
