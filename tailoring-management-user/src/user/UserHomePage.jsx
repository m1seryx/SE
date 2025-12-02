import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import appointmentBg from "../assets/background.jpg";
import heroBg from "../assets/tailorbackground.jpg";
import suitSample from "../assets/suits.png";
import customizeBg from "../assets/background.jpg";
import repairBg from "../assets/repair.png";
import brown from "../assets/brown.png";
import full from "../assets/full.png";
import tuxedo from "../assets/tuxedo.png";
import dryCleanBg from "../assets/dryclean.png";
import { getUser, logoutUser } from '../api/AuthApi';
import RentalClothes from './components/RentalClothes';
import Cart from './components/Cart';
import RepairFormModal from './components/RepairFormModal';
import DryCleaningFormModal from './components/DryCleaningFormModal';


const UserHomePage = ({ userName, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [repairFormModalOpen, setRepairFormModalOpen] = useState(false);
  const [dryCleaningFormModalOpen, setDryCleaningFormModalOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointments, setAppointments] = useState(() => {
    try {
      const s = typeof window !== 'undefined' && localStorage.getItem('appointments');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const serviceOptions = [
    { type: 'Repair', description: 'Fix and enhance your clothes' },
    { type: 'Customize', description: 'Personalize and customize' },
    { type: 'Dry Cleaning', description: 'Impeccable clean on your suit' },
  ];

  const user = getUser() || {
    name: userName || 'User',
    email: '',
    avatar: dp,
  };


  const handleLogout = () => {
    logoutUser();
    if (typeof setIsLoggedIn === 'function') {
      setIsLoggedIn(false);
    }
    navigate('/', { replace: true });
  };

  const handleCartUpdate = () => {
    console.log('Cart was updated from repair modal!');
   
  };

  const addServiceToCart = (type) => {
    if (type === 'Repair') {
     
      setServiceModalOpen(false);
      setRepairFormModalOpen(true);
      return;
    }
    
    if (type === 'Dry Cleaning') {
   
      setServiceModalOpen(false);
      setDryCleaningFormModalOpen(true);
      return;
    }
    
  
    setCartItems((prev) => {
      const id = 'ORD-' + String(prev.length + 1).padStart(4, '0');
      const newItem = {
        id,
        type,
        details: { brand: '', size: '', notes: '', repair: '', datetime: '' },
        status: 'pending',
        toPay: true,
        expanded: false,
      };
      return [...prev, newItem];
    });
    setServiceModalOpen(false);
    setCartOpen(true);
  };

  const updateItemDetails = (id, patch) => {
    setCartItems((prev) => prev.map((it) => (it.id === id ? { ...it, details: { ...it.details, ...patch } } : it)));
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const submitAppointment = async () => {
    if (cartItems.length === 0 || !appointmentDate) return;
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const payload = {
      services: cartItems.map((it) => ({ orderId: it.id, serviceType: it.type, details: { ...it.details, date: appointmentDate } })),
      customer: { name: user.name, email: user.email },
      date: appointmentDate,
    };
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to submit');
      setAppointments((prev) => {
        const id = 'APT-' + String(prev.length + 1).padStart(4, '0');
        const next = [...prev, { id, status: 'pending', services: cartItems, date: appointmentDate }];
        try { localStorage.setItem('appointments', JSON.stringify(next)); } catch (e) { void e }
        return next;
      });
      setSummaryModalOpen(false);
      setCartItems([]);
      setAppointmentDate('');
    } catch {
      setSummaryModalOpen(false);
    } finally {
      setIsSubmitting(false);
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
        <a href="#About">About</a>
        <button className="notif-button" onClick={() => setNotificationsOpen(true)} aria-label="Notifications">
          <svg width="24" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" stroke="#8B4513" strokeWidth="2" fill="none"/><circle cx="12" cy="20" r="2" fill="#8B4513"/></svg>
          {appointments.length > 0 && <span className="notif-badge">{appointments.length}</span>}
        </button>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6h14l-2 9H8L6 6z" stroke="#8B4513" strokeWidth="2" fill="none"/><circle cx="9" cy="20" r="2" fill="#8B4513"/><circle cx="17" cy="20" r="2" fill="#8B4513"/></svg>
          {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
        </button>
        <div className="user-info">
          <span className="welcome-text">Welcome back,</span>
          <span className="user-name">{user.name}</span>
        </div>
        <div className="profile-dropdown">
          <img
            src={user.avatar}
            alt="User"
            className="profile-img clickable"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          />
          {profileDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => {
                setProfileDropdownOpen(false);
                setServiceModalOpen(true);
              }}>
                📅 Book Services
              </button>
              <button className="dropdown-item" onClick={() => {
                setProfileDropdownOpen(false);
                navigate('/profile');
              }}>
                👤 My Profile
              </button>
              <button className="dropdown-item logout-item" onClick={() => {
                setProfileDropdownOpen(false);
                handleLogout();
              }}>
                🚪 Logout
              </button>
            </div>
          )}
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

      <section className="appointment" id="Appointment">
        <h2>Book a Service</h2>
        <div className="appointment-content">
          <img src={appointmentBg} alt="Tailor" className="appointment-img" />
          <div className="appointment-overlay">
            <p>Ready for a fitting or consultation?</p>
            <p>We’re excited to serve you again!</p>
            <button className="btn-book" onClick={() => setServiceModalOpen(true)}>Book Service</button>
          </div>
        </div>
      </section>

      {/* Rental Clothes */}
      <RentalClothes openAuthModal={() => setServiceModalOpen(true)} />

      <section className="customization" id="Customize">
        <div className="custom-text">
          <h2>Bespoke Customization</h2>
          <p>Design your dream suit from scratch</p>
          <p>Premium fabrics • Perfect fit • Your vision</p>
        </div>
        <div className="custom-image" style={{ backgroundImage: `url('/src/assets/background11.jpg'), url(${customizeBg})` }}>
          <button className="btn-customize">Start Customizing</button>
        </div>
      </section>

      <section className="repair" id="Repair">
        <h2>Repair Service</h2>
        <div className="repair-bg" style={{ backgroundImage: `url('/src/assets/repair.png'), url(${repairBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3>Bring your garments back to life</h3>
            <p>Expert alterations • Invisible mending • Fast service</p>
            <button className="btn-book">Book Repair</button>
          </div>
        </div>
      </section>

      <section className="repair" id="DryCleaning">
        <h2>Dry Cleaning Service</h2>
        <div className="repair-bg" style={{ backgroundImage: `url('/src/assets/dryclean.png'), url(${dryCleanBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3>Keep your garments fresh and spotless</h3>
            <p>Premium care for suits, gowns, and more</p>
            <button className="btn-book" onClick={() => setServiceModalOpen(true)}>Book Dry Cleaning</button>
          </div>
        </div>
      </section>


      {serviceModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setServiceModalOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-container">
              <div className="auth-header">
                <h2>Select Service</h2>
                <p className="auth-subtitle">Choose the service you want to book</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {serviceOptions.map((s) => (
                  <button key={s.type} className="auth-submit" onClick={() => addServiceToCart(s.type)}>{s.type}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {notificationsOpen && (
        <div className="auth-modal-overlay" onClick={() => setNotificationsOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-container">
              <div className="auth-header">
                <h2>Notifications</h2>
                <p className="auth-subtitle">Recent appointments and updates</p>
              </div>
              <div style={{ padding: '14px', display: 'grid', gap: '10px' }}>
                {appointments.length === 0 && <div>No notifications</div>}
                {appointments.map((apt) => (
                  <div key={apt.id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600 }}>Appointment {apt.id}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{apt.date || '-'}</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{(apt.services||[]).length} services</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    {cartOpen && (
  <div className="cart-drawer" onClick={() => setCartOpen(false)}>
    <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
      <div className="cart-header">
        <div className="cart-title">Cart ({cartItems.length})</div>
        <button className="cart-close" onClick={() => setCartOpen(false)}>×</button>
      </div>
      <div className="cart-items">
        {cartItems.length === 0 && <div className="cart-empty">No services selected</div>}
        {cartItems.map((it) => (
          <div key={it.id} className="cart-card">
            <div className="cart-card-top">
              <div className="cart-id">{it.id}</div>
              <div className="cart-type">{it.type}</div>
            </div>
            <div className="cart-card-body">
              <div className="cart-form">
                {serviceForms[it.type]?.map((field) => (
                  <div key={field.name} className="form-group">
                    <label>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={it.details[field.name] || ""}
                        onChange={(e) =>
                          updateItemDetails(it.id, { [field.name]: e.target.value })
                        }
                      />
                    ) : field.type === "file" ? (
                      <input
                        type="file"
                        onChange={(e) =>
                          updateItemDetails(it.id, { [field.name]: e.target.files[0] })
                        }
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={it.details[field.name] || ""}
                        onChange={(e) =>
                          updateItemDetails(it.id, { [field.name]: e.target.value })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="cart-actions">
                <button className="btn-danger" onClick={() => removeItem(it.id)}>Remove</button>
              </div>
            </div> {/* End of cart-card-body */}
          </div> // End of cart-card
        ))}
      </div> {/* End of cart-items */}
      <div className="cart-footer">
        <button className="btn-primary" disabled={cartItems.length === 0} onClick={() => { setCartOpen(false); setSummaryModalOpen(true); }}>Proceed to booking</button>
      </div>
    </div>
  </div>
)}


     {summaryModalOpen && (
  <div className="auth-modal-overlay" onClick={() => setSummaryModalOpen(false)}>
    <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
      <div className="auth-container">
        <div className="auth-header">
          <h2>Finalize Appointment</h2>
          <p className="auth-subtitle">Review your services and select appointment date</p>
        </div>
        <div style={{ padding: '16px 18px', maxHeight: '400px', overflowY: 'auto' }}>
          {cartItems.map((it) => (
            <div key={it.id} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px', color: '#8B4513' }}>
                {it.type} • {it.id}
              </div>
              {serviceForms[it.type]?.map((field) => {
                const value = it.details[field.name];
                let displayValue = value || '-';
                
                // Special handling for file inputs
                if (field.type === 'file' && value) {
                  displayValue = value.name || 'File uploaded';
                }
                
                return (
                  <div key={field.name} style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    <strong>{field.label}:</strong> {displayValue}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 18px', borderTop: '1px solid #eee' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
            Select Appointment Date:
          </label>
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 14px', 
              marginBottom: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '10px',
              fontSize: '14px'
            }}
            min={new Date().toISOString().split('T')[0]}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setSummaryModalOpen(false)} className="btn-secondary">
              Back
            </button>
            <button 
              onClick={submitAppointment} 
              className="btn-primary" 
              disabled={!appointmentDate || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {/* Cart Component */}
      <Cart 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)}
        onCartUpdate={handleCartUpdate}
      />

      {/* Repair Form Modal Component */}
      <RepairFormModal 
        isOpen={repairFormModalOpen} 
        onClose={() => setRepairFormModalOpen(false)}
        onCartUpdate={handleCartUpdate}
      />

      {/* Dry Cleaning Form Modal Component */}
      <DryCleaningFormModal 
        isOpen={dryCleaningFormModalOpen} 
        onClose={() => setDryCleaningFormModalOpen(false)}
        onCartUpdate={handleCartUpdate}
      />

    </>
  );
};

export default UserHomePage;