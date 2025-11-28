  import React, { useState } from "react";
  import "../styles/landingpage.css";
  import background from "../assets/background.jpg";
  import rentImage from "../assets/background11.jpg";
  import suitImage from "../assets/suits.png";
  import { useNavigate } from "react-router-dom";
  import tailorBackground from "../assets/tailorbackground.jpg";

  const LandingPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRentalDate, setSelectedRentalDate] = useState("");
    const navigate = useNavigate();

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

    const goToAuth = () => {
      navigate("/auth");
    };

    return (
      <div>
        {/* Hero Section */}
        <div
          className="bg"
          id="top"
          style={{ backgroundImage: `url(${background})` }}
        >
          <div className="info">
            <span className="welcome">Welcome to Jackman Tailor Deluxe!</span>
            <span className="text">Your Perfect Fit Awaits.</span>
          </div>
        </div>

        {/* Jackman's Services */}
        <div className="services">
          <p className="serv">Jackman&apos;s Services</p>
          <div className="serviceContainer">
            <section className="container">
              {["Rental", "Customize", "Repair", "Dry Cleaning"].map((service) => (
                <div className="card" key={service}>
                  <div
                    className="card-image"
                    style={{ backgroundImage: `url(${tailorBackground})` }}
                  />
                  <div className="footer">
                    <h5 className="service-type">{service}</h5>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* Appointment section */}
        <div className="appointment" id="Appointment">
          <h1 className="appointment-text">Appointment</h1>
          <div className="app-image">
            <img src={background} className="appointment-pic" alt="Appointment" />
            <div className="book">
              <p className="app-text">Ready to experience our services?</p>
              <p className="app-text">
                Book your appointment now and let us create the perfect fit.
              </p>
              <div className="book-bar">
                <button className="text2" onClick={goToAuth}>
                  Book now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rental Clothes */}
        <div className="rental" id="Rentals">
          <div className="div">
            <h1 className="rent-textt">Rental Clothes</h1>
            <div className="see-more-div">
              <button
                type="button"
                className="see-more"
                onClick={goToAuth}
              >
                See more →
              </button>
            </div>
          </div>
          <section className="rent-container">
            {["Brown Suit", "Brown Suit", "Brown Suit"].map((item, index) => (
              <div className="rent-card" key={`${item}-${index}`}>
                <div className="rent-image">
                  <img src={rentImage} alt={item} />
                  <h2>{item}</h2>
                  <h6>₱ 800 / Day</h6>
                  <button className="rent-book" onClick={openModal}>
                    View Info
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Rental Info Modal */}
        {modalOpen && (
          <div id="itemModal" className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeModal}>
                ×
              </span>
              <div className="item-container">
                <div className="item-image">
                  <img src={suitImage} alt="Brown Suit" />
                </div>
                <div className="item-details">
                  <h2 className="item-title">Brown Suit</h2>
                  <p>
                    <strong>Size:</strong> Medium
                  </p>
                  <p>
                    <strong>Price:</strong> ₱800/day
                  </p>
                  <p>
                    <strong>Description:</strong> Premium wool blend, warm brown
                    tone, regular length. Perfect for formal occasions and
                    business events.
                  </p>
                  <label htmlFor="date">Select Rental Date</label>
                  <input
                    type="date"
                    id="date"
                    className="calendar-input"
                    value={selectedRentalDate}
                    onChange={(e) => setSelectedRentalDate(e.target.value)}
                  />
                  <button className="rent-btn" onClick={handleRental}>
                    RENT NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customization */}
        <div className="custom" id="Customize">
          <div className="custom-info">
            <h1 className="customize">Customization</h1>
            <p className="customize-p">Need a design made just for you?</p>
            <p className="customize-p">
              Create your own look and make every detail truly yours.
            </p>
          </div>
          <div className="custom-pic">
            <div className="custom-image">
              <button className="custom-book" onClick={goToAuth}>
                Customize now!
              </button>
            </div>
          </div>
        </div>

        {/* Repair Service */}
        <div className="repair" id="Repair">
          <h1 className="repair-text">Repair Service</h1>
          <div className="repair-container">
            <div
              className="repair-bg"
              style={{ backgroundImage: `url(${background})` }}
            >
              <div className="repair-info">
                <b className="repair-welcome">Need reliable repair services?</b>
                <p className="repair-subtext">
                  Get in touch with us today and give your garments a second life.
                </p>
                <button className="book-button" onClick={goToAuth}>
                  Book now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default LandingPage;

