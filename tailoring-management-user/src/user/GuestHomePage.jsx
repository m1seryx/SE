import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Guesthome.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import dryCleanBg from "../assets/dryclean.png";
import heroBg from "../assets/tailorbackground.jpg";
import appointmentBg from "../assets/background.jpg";
import suitSample from "../assets/suits.png";
import customizeBg from "../assets/background.jpg";
import repairBg from "../assets/repair.png";
import brown from "../assets/brown.png";
import full from "../assets/full.png";
import tuxedo from "../assets/tuxedo.png";
import { loginUser, registerUser } from '../api/AuthApi';


const App = ({ setIsLoggedIn }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  // New: Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  

  const rentalItems = [
    { name: 'Brown Suit', price: 'P 800', img: brown },
    { name: 'Full Suit', price: 'P 800', img: full },
    { name: 'Tuxedo', price: 'P 800', img: tuxedo },
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
  const handleLogin = async () => {
    setAuthError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle login - backend expects username and password
        const result = await loginUser({
          username: loginUsername,
          password: loginPassword
        });
        
        if (result.message === 'Login successful' || result.message === 'Admin login successful') {
          if (typeof setIsLoggedIn === 'function') {
            setIsLoggedIn(true);
          }
          setIsAuthModalOpen(false);
          navigate('/user-home', { replace: true });
        } else {
          setAuthError(result.message || 'Login failed');
        }
      } else {
        // Handle signup - backend expects first_name, last_name, username, email, password, phone_number
        if (signupPassword !== signupConfirmPassword) {
          setAuthError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        const result = await registerUser({
          first_name: signupFirstName,
          last_name: signupLastName,
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
          phone_number: signupPhone || ''
        });
        
        if (result.success) {
          // Auto-login after successful registration
          if (typeof setIsLoggedIn === 'function') {
            setIsLoggedIn(true);
          }
          setIsAuthModalOpen(false);
          navigate('/user-home', { replace: true });
        } else {
          setAuthError(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const services = [
    { name: 'Rental', img: heroBg },
    { name: 'Customize', img: customizeBg },
    { name: 'Repair', img: repairBg },
    { name: 'Dry Cleaning', img: dryCleanBg },
  ];

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
          <a href="#DryCleaning">Dry Cleaning</a>
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

       <section className="services">
        <h2>Jackman's Services</h2>
        <div className="services-grid">
          {services.map(({ name, img }) => (
            <div key={name} className="service-card">
              <div
                className="service-img"
                style={{ backgroundImage: `url(${img})` }}
              ></div>
              <div className="service-footer">
                <h3>{name}</h3>
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
            <button className="btn-book" onClick={() => setServiceModalOpen(true)}>Book now</button>
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
        <div className="custom-image" style={{ backgroundImage: `url('/src/assets/background.jpg'), url(${customizeBg})` }}>
          <button className="btn-customize" onClick={openAuthModal}>Customize now!</button>
        </div>
      </section>

      {/* Repair Section */}
      <section className="repair" id="Repair">
        <h2>Repair Service</h2>
        <div className="repair-bg" style={{ backgroundImage: `url('/src/assets/repair.png'), url(${repairBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3>Need reliable repair services?</h3>
            <p>Get in touch with us today!</p>
            <button className="btn-book" onClick={openAuthModal}>Book Now!</button>
          </div>
        </div>
      </section>

      {/* Dry Cleaning Section */}
      <section className="repair" id="DryCleaning">
        <h2>Dry Cleaning Service</h2>
        <div className="repair-bg" style={{ backgroundImage: `url('/src/assets/dryclean.png'), url(${dryCleanBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3>Keep your garments fresh and spotless</h3>
            <p>Premium care for suits, gowns, and more</p>
            <button className="btn-book" onClick={openAuthModal}>Book Dry Cleaning</button>
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

      {serviceModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setServiceModalOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-container">
              <div className="auth-header">
                <h2>Select Service</h2>
                <p className="auth-subtitle">Choose the service you want to book</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {services.map((s) => (
                  <button key={s.name} className="auth-submit" onClick={openAuthModal}>{s.name}</button>
                ))}
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
            <>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  autoComplete="given-name"
                  value={signupFirstName}
                  onChange={(e) => setSignupFirstName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  autoComplete="family-name"
                  value={signupLastName}
                  onChange={(e) => setSignupLastName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Username"
                  required
                  autoComplete="username"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <input
              type={isLogin ? "text" : "email"}
              placeholder={isLogin ? "Username" : "Email Address"}
              required
              autoComplete={isLogin ? "username" : "email"}
              value={isLogin ? loginUsername : signupEmail}
              onChange={(e) => (isLogin ? setLoginUsername(e.target.value) : setSignupEmail(e.target.value))}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={isLogin ? loginPassword : signupPassword}
              onChange={(e) => isLogin ? setLoginPassword(e.target.value) : setSignupPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  autoComplete="new-password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  autoComplete="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                />
              </div>
            </>
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

          {/* Error Message */}
          {authError && (
            <div className="auth-error" style={{ color: '#dc3545', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
              {authError}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="auth-submit" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Login Now' : 'Create Account')}
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
