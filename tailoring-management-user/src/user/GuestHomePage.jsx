import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Guesthome.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import heroBg from "../assets/tailorbackground.jpg";
import appointmentBg from "../assets/background.jpg";
import rental1 from "../assets/background11.jpg";
import suitSample from "../assets/suits.png";
import customizeBg from "../assets/background.jpg";
import repairBg from "../assets/background.jpg";

const App = ({ setIsLoggedIn }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // New: Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Signup

  const rentalItems = [
    { name: 'Brown Suit', price: 'P 800', img: rental1 },
    { name: 'Brown Suit', price: 'P 800', img: rental1 },
    { name: 'Black Suit', price: 'P 800', img: rental1 },
  ];

  const openModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const navigate = useNavigate();
  const handleLogin = () => {
    setIsLoggedIn && setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    navigate('/user/UserHomePage', { replace: true });
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-img" />
          <span className="logo-text">D’jackman Tailor Deluxe</span>
        </div>
        <nav className="nav">
          <a href="#top">Home</a>
          <a href="#Appointment">Appointment</a>
          <a href="#Rentals">Rental</a>
          <a href="#Customize">Customize</a>
          <a href="#Repair">Repair</a>
          <a href="#About">About</a>
        </nav>
        <div className="profile">
          <img src={dp} alt="Profile" className="profile-img" />
        </div>
      </header>

      {/* Hero */}
      <section className="hero" id="top" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Welcome to Jackman <br />Tailor Deluxe!</h1>
          <p>Your Perfect Fit Awaits.</p>
        </div>
      </section>

      {/* Services */}
      <section className="services">
        <h2>Jackman's Services</h2>
        <div className="services-grid">
          {['Rental', 'Customize', 'Repair', 'Dry Cleaning'].map((service) => (
            <div key={service} className="service-card">
              <div className="service-img" style={{ backgroundImage: `url(${heroBg})` }}></div>
              <div className="service-footer">
                <h3>{service}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appointment */}
      <section className="appointment" id="Appointment">
        <h2>Appointment</h2>
        <div className="appointment-content">
          <img src={appointmentBg} alt="Tailor" className="appointment-img" />
          <div className="appointment-overlay">
            <p>Ready to experience our services?</p>
            <p>Book your appointment now!</p>
            <button className="btn-book" onClick={openAuthModal}>Book now</button>
          </div>
        </div>
      </section>

      {/* Rental Clothes */}
      <section className="rental" id="Rentals">
        <div className="section-header">
          <h2>Rental Clothes</h2>
          <a href="/rental" className="see-more">See more →</a>
        </div>
        <div className="rental-grid">
          {rentalItems.map((item, i) => (
            <div key={i} className="rental-card">
              <img src={item.img} alt={item.name} />
              <div className="rental-info">
                <h3>{item.name}</h3>
                <p className="price">{item.price}</p>
                <button onClick={() => openModal(item)} className="btn-view">View Info</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customization */}
      <section className="customization" id="Customize">
        <div className="custom-text">
          <h2>Customization</h2>
          <p>Got a style in mind?</p>
          <p>Personalize it and turn your vision into reality!</p>
        </div>
        <div className="custom-image" style={{ backgroundImage: `url(${customizeBg})` }}>
          <button className="btn-customize" onClick={openAuthModal}>Customize now!</button>
        </div>
      </section>

      {/* Repair Section */}
      <section className="repair" id="Repair">
        <h2>Repair Service</h2>
        <div className="repair-bg" style={{ backgroundImage: `url(${repairBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3>Need reliable repair services?</h3>
            <p>Get in touch with us today!</p>
            <button className="btn-book" onClick={openAuthModal}>Book Now!</button>
          </div>
        </div>
      </section>

      {/* Rental Item Modal */}
      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>×</span>
            <div className="modal-body">
              <img src={suitSample} alt="Suit" className="modal-img" />
              <div className="modal-details">
                <h2>{selectedItem?.name}</h2>
                <p><strong>Size:</strong> Medium</p>
                <p><strong>Price:</strong> ₱800/day</p>
                <p><strong>Description:</strong> Premium wool blend.</p>
                <label>Date</label>
                <input type="date" className="date-input" />
                <button className="btn-rent" onClick={openAuthModal}>RENT</button>
              </div>
            </div>
          </div>
        </div>
      )}

     {/* ===== FIXED & BEAUTIFUL LOGIN / SIGNUP MODAL ===== */}
{isAuthModalOpen && (
  <div className="auth-modal-overlay" onClick={closeAuthModal}>
    <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
      <button className="auth-close" onClick={closeAuthModal}>
        ×
      </button>

      <div className="auth-container">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Your Account'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to book appointments & rentals' 
              : 'Join the Jackman Tailor Deluxe family'}
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="auth-toggle">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="input-group">
              <input
                type="text"
                placeholder="Full Name"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <input
                type="password"
                placeholder="Confirm Password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          {isLogin && (
            <div className="auth-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="auth-submit" onClick={handleLogin}>
            {isLogin ? 'Login Now' : 'Create Account'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)} className="toggle-link">
              {isLogin ? 'Sign Up Now' : 'Login Here'}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
)}
      
    </>
  );
};

export default App;
