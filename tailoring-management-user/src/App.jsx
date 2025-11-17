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
  const [selectedRentalDate, setSelectedRentalDate] = useState("");

  const toggleMenu = () => {
    // Profile menu logic here if needed
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleRental = () => {
    if (selectedRentalDate) {
      alert(`Rental booked for ${selectedRentalDate}`);
      closeModal();
      setSelectedRentalDate("");
    } else {
      alert("Please select a date");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="logo">
          <img className="picture" src={logo} alt="logo" />
          <p className="logoname">D'Jackman Tailor Deluxe</p>
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
        <div className="info">
          <span className="welcome">Welcome to Jackman Tailor Deluxe!</span>
          <span className="text">Your Perfect Fit Awaits</span>
        </div>
      </div>

      {/* Services */}
      <div className="services">
        <p className="serv">Jackman's Premium Services</p>
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
        <h1 className="appointment-text">Book Your Appointment</h1>
        <div className="app-image">
          <img src={background} className="appointment-pic" alt="Appointment" />
          <div className="book">
            <p className="app-text">Ready to experience our premium services?</p>
            <p className="app-text">Book your appointment now and let us create the perfect look for you!</p>
            <div className="book-bar">
              <button className="text2">Book Now</button>
            </div>
          </div>
        </div>
      </div>

      {/* Rental */}
      <div className="rental" id="Rentals">
        <div className="div">
          <h1 className="rent-textt">Rental Clothes</h1>
          <div className="see-more-div">
            <a href="Rental.html" target="_blank" rel="noopener noreferrer" className="see-more">
              See more →
            </a>
          </div>
        </div>
        <section className="rent-container">
          {["Shirt", "Blazer", "Slacks"].map((item) => (
            <div className="rent-card" key={item}>
              <div className="rent-image">
                <img src={rentImage} alt={item} />
                <h2>{item}</h2>
                <h6>₱ 500</h6>
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
              ×
            </span>
            <div className="item-container">
              <div className="item-image">
                <img src={suitImage} alt="Men Suit All in Gray" />
              </div>
              <div className="item-details">
                <h2 className="item-title">Men Suit All in Gray</h2>
                <p><strong>Size:</strong> Medium</p>
                <p><strong>Price:</strong> ₱800/day</p>
                <p><strong>Description:</strong> Premium wool blend, elegant gray color, regular length. Perfect for formal occasions and business events.</p>
                <label htmlFor="date">Select Rental Date</label>
                <input 
                  type="date" 
                  id="date" 
                  className="calendar-input"
                  value={selectedRentalDate}
                  onChange={(e) => setSelectedRentalDate(e.target.value)}
                />
                <button className="rent-btn" onClick={handleRental}>RENT NOW</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize */}
      <div className="custom" id="Customize">
        <div className="custom-info">
          <h1 className="customize">Customization</h1>
          <p className="customize-p">Got a style in mind?</p>
          <p className="customize-p">Personalize it and turn your vision into reality!</p>
        </div>
        <div className="custom-pic">
          <div className="custom-image">
            <button className="custom-book" onClick={() => window.location.href='#customize'}>
              Customize Now!
            </button>
          </div>
        </div>
      </div>

      {/* Repair */}
      <div className="repair" id="Repair">
        <h1 className="repair-text">Professional Repair Service</h1>
        <div className="repair-container">
          <div className="repair-bg" style={{ backgroundImage: `url(${background})` }}>
            <div className="repair-info">
              <b className="repair-welcome">Need Reliable Repair Services?</b>
              <p className="repair-subtext">Get expert care for your precious garments!</p>
              <button className="book-button">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;