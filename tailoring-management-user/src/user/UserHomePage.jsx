// UserHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";
import heroBg from "../assets/tailorbackground.jpg";
import appointmentBg from "../assets/background.jpg";
import rental1 from "../assets/background11.jpg";
import suitSample from "../assets/suits.png";
import customizeBg from "../assets/background.jpg";
import repairBg from "../assets/background.jpg";

const UserHomePage = ({ userName, setIsLoggedIn }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentalDate, setRentalDate] = useState('');
  const [isRented, setIsRented] = useState(false);

  // Close dropdown when clicking outside
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
  const trackingFlows = {
    Repair: ['Pending', 'In Progress', 'To pick up', 'Completed'],
    Customize: ['Pending', 'Design', 'Fitting', 'Completed'],
    'Dry Cleaning': ['Pending', 'Cleaning', 'Ready', 'Completed'],
    Rental: ['Pending', 'To pick up', 'Active', 'Returned'],
  };

  // Mock logged-in user (replace with real auth later)
  const user = {
    name: "Alexander",
    email: "alex@example.com",
    avatar: dp
  };

  const rentalItems = [
    { 
      name: 'Brown Suit', 
      price: 'P 800', 
      img: rental1,
      description: {
        size: 'Medium',
        color: 'Brown',
        length: 'Regular',
        material: 'Wool Blend',
        fit: 'Slim Fit'
      }
    },
    { 
      name: 'Navy Blazer Set', 
      price: 'P 1,200', 
      img: rental1,
      description: {
        size: 'Large',
        color: 'Navy Blue',
        length: 'Long',
        material: 'Cotton Blend',
        fit: 'Regular Fit'
      }
    },
    { 
      name: 'Black Tuxedo', 
      price: 'P 1,500', 
      img: rental1,
      description: {
        size: 'Medium',
        color: 'Black',
        length: 'Regular',
        material: 'Premium Wool',
        fit: 'Classic Fit'
      }
    },
  ];

  const openModal = (item) => {
    console.log('Opening modal for:', item);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleLogout = () => {
    alert("Logged out successfully!");
    setIsLoggedIn && setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  const addServiceToCart = (type) => {
    setCartItems((prev) => {
      const id = 'ORD-' + String(prev.length + 1).padStart(4, '0');
      const newItem = {
        id,
        type,
        details: {
          brand: '',
          size: '',
          notes: '',
          address: '',
          datetime: '',
        },
        status: 'pending',
        progress: 0,
        alert: '',
        toPay: true,
        expanded: false,
      };
      return [...prev, newItem];
    });
    setServiceModalOpen(false);
    setAppointmentModalOpen(true);
  };

  const updateItemDetails = (id, patch) => {
    setCartItems((prev) => prev.map((it) => (it.id === id ? { ...it, details: { ...it.details, ...patch } } : it)));
  };


  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const submitAppointment = async () => {
    if (cartItems.length === 0) return;
    if (!appointmentDate) return;
    const missingCustomizeTime = cartItems.some((it) => it.type === 'Customize' && !it.details.time);
    if (missingCustomizeTime) return;
    const payload = {
      services: cartItems.map((it) => ({
        orderId: it.id,
        serviceType: it.type,
        details: { ...it.details, date: appointmentDate },
      })),
      customer: { name: userName || user.name, email: user.email },
      date: appointmentDate,
    };
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setAppointments((prev) => {
        const id = 'APT-' + String(prev.length + 1).padStart(4, '0');
        return [...prev, { id, status: 'pending', services: cartItems }];
      });
      setAppointmentModalOpen(false);
      setServiceModalOpen(false);
      setNotificationsOpen(true);
      setCartItems([]);
      setAppointmentDate('');
    } catch {
      setAppointmentModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateItemDetails(id, { image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Header - Now with User Greeting */}
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
        <button className="notif-button" onClick={() => setNotificationsOpen(true)} aria-label="Notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" stroke="#8B4513" strokeWidth="2" fill="none"/><circle cx="12" cy="20" r="2" fill="#8B4513"/></svg>
          {appointments.length > 0 && <span className="notif-badge">{appointments.length}</span>}
        </button>

        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-info">
            <span className="welcome-text">Welcome back,</span>
            <span className="user-name">{userName || user.name}</span>
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
                  // Navigate to profile page (mock functionality)
                  alert('My Profile - Feature coming soon!');
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
        </div>
      </header>

      {/* Hero - Personalized */}
      <section className="hero user-hero" id="top" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Hello, {userName || user.name}!<br />Ready for your next perfect fit?</h1>
          <p>Your style journey continues here.</p>
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
        <h2>Book an Appointment</h2>
        <div className="appointment-content">
          <img src={appointmentBg} alt="Tailor" className="appointment-img" />
          <div className="appointment-overlay">
            <p>Ready for a fitting or consultation?</p>
            <p>We’re excited to serve you again!</p>
            <button className="btn-book" onClick={() => {
    console.log('Book Appointment clicked');
    setServiceModalOpen(true);
    console.log('serviceModalOpen set to true');
  }}>Book Appointment</button>
          </div>
        </div>
      </section>

      {/* Rental Clothes */}
      <section className="rental" id="Rentals">
        <div className="section-header">
          <h2>Available for Rental</h2>
          <a href="/rental" className="see-more">See All →</a>
        </div>
        <div className="rental-grid">
          {rentalItems.map((item, i) => (
            <div key={i} className="rental-card">
              <img src={item.img} alt={item.name} />
              <div className="rental-info">
                <h3>{item.name}</h3>
                <p className="price">{item.price}/day</p>
                <button onClick={() => openModal(item)} className="btn-view">View</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customization */}
      <section className="customization" id="Customize">
        <div className="custom-text">
          <h2>Bespoke Customization</h2>
          <p>Design your dream suit from scratch</p>
          <p>Premium fabrics • Perfect fit • Your vision</p>
        </div>
        <div className="custom-image" style={{ backgroundImage: `url(${customizeBg})` }}>
          <button className="btn-customize">Start Customizing</button>
        </div>
      </section>

      {/* Repair */}
      <section className="repair" id="Repair">
        <h2>Repair Service</h2>
        <div className="repair-bg" style={{ backgroundImage: `url(${repairBg})` }}>
          <div className="repair-overlay"></div>
          <div className="repair-content">
            <h3>Bring your garments back to life</h3>
            <p>Expert alterations • Invisible mending • Fast service</p>
            <button className="btn-book">Book Repair</button>
          </div>
        </div>
      </section>

      {/* Rental Modal - Debug Version */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={closeModal}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2>{selectedItem?.name || 'No item selected'}</h2>
            <p>Price: {selectedItem?.price || 'N/A'}</p>
            <p>Size: {selectedItem?.description?.size || 'N/A'}</p>
            <p>Color: {selectedItem?.description?.color || 'N/A'}</p>
            <p>Length: {selectedItem?.description?.length || 'N/A'}</p>
            <p>Material: {selectedItem?.description?.material || 'N/A'}</p>
            <p>Fit: {selectedItem?.description?.fit || 'N/A'}</p>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      {notificationsOpen && (
        <div className="modal" onClick={() => setNotificationsOpen(false)}>
          <div className="modal-content appointments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-title">Booked Services</div>
            <div className="appointments-list">
              {appointments.length === 0 && <div className="cart-empty">No appointments yet</div>}
              {appointments.map((apt) => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-top">
                    <div className="apt-id">{apt.id}</div>
                    <div className={`status-badge status-${apt.status}`}>{apt.status}</div>
                  </div>
                  {apt.date && (
                    <div className="expand-row"><span>Date</span><span>{apt.date}</span></div>
                  )}
                  <div className="appointment-services">
                    {apt.services.map((it) => {
                      const flow = trackingFlows[it.type] || trackingFlows.Repair;
                      const order = ['pending','in_progress','to_receive','delivered'];
                      const sIndex = order.indexOf(it.status);
                      const idx = sIndex === -1 ? 0 : (sIndex === 2 ? Math.max(0, flow.length - 2) : (sIndex === 3 ? flow.length - 1 : sIndex));
                      return (
                        <div key={it.id} className="apt-service-row">
                          <div className="apt-service-title">{it.type}</div>
                          <div className="pd-steps">
                            {flow.map((step, i) => (
                              <>
                                <div key={step} className={`pd-step ${idx>=i?'active':''}`}>{step}</div>
                                {i < flow.length-1 && <div className="pd-arrow" />}
                              </>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Modal - Professional UI */}
      {serviceModalOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setServiceModalOpen(false)}>
          <div style={{
            background: 'white',
            padding: '0',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'modalSlideIn 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
              padding: '24px 32px',
              color: 'white',
              position: 'relative'
            }}>
              <button 
                onClick={() => setServiceModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
              <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '600' }}>Book an Appointment</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>Select Service Type</p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px' }}>
              <p style={{ 
                margin: '0 0 24px 0', 
                fontSize: '16px', 
                color: '#666',
                textAlign: 'center'
              }}>
                Choose the service you want to book:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {serviceOptions.map((s) => (
                  <button 
                    key={s.type} 
                    style={{
                      padding: '20px 24px',
                      border: '2px solid #e5e5e5',
                      borderRadius: '12px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = '#8B4513';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 24px rgba(139, 69, 19, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = '#e5e5e5';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      console.log('Service selected:', s.type);
                      setServiceModalOpen(false);
                      setAppointmentModalOpen(true);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}>
                        {s.type.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '18px', 
                          color: '#333',
                          marginBottom: '4px'
                        }}>
                          {s.type} Service
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#666',
                          lineHeight: '1.4'
                        }}>
                          {s.description}
                        </div>
                      </div>
                      <div style={{
                        color: '#8B4513',
                        fontSize: '20px',
                        transition: 'transform 0.3s'
                      }}>
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Cancel Button */}
              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <button 
                  onClick={() => setServiceModalOpen(false)} 
                  style={{
                    padding: '12px 32px',
                    background: 'transparent',
                    border: '2px solid #ddd',
                    borderRadius: '25px',
                    color: '#666',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = '#8B4513';
                    e.target.style.color = '#8B4513';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#ddd';
                    e.target.style.color = '#666';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {appointmentModalOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setAppointmentModalOpen(false)}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2>Book Appointment</h2>
            <p>Select your preferred date for the appointment</p>
            <input 
              type="date" 
              value={appointmentDate} 
              onChange={(e)=>setAppointmentDate(e.target.value)}
              style={{ width: '100%', padding: '8px', margin: '10px 0', border: '1px solid #ccc' }}
              min={new Date().toISOString().split('T')[0]}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setAppointmentModalOpen(false)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button 
                onClick={submitAppointment}
                disabled={!appointmentDate || isSubmitting}
                style={{ 
                  padding: '8px 16px', 
                  background: appointmentDate && !isSubmitting ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  cursor: appointmentDate && !isSubmitting ? 'pointer' : 'not-allowed'
                }}
              >
                {isSubmitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserHomePage;
