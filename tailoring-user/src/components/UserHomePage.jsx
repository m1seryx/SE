// UserHomePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserHomePage.css'; // we'll reuse most of App.css + add a few
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
  const [appointments, setAppointments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
    { name: 'Brown Suit', price: 'P 800', img: rental1 },
    { name: 'Navy Blazer Set', price: 'P 1,200', img: rental1 },
    { name: 'Black Tuxedo', price: 'P 1,500', img: rental1 },
  ];

  const openModal = (item) => {
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
          date: '',
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
    setCartOpen(true);
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
    const missingDates = cartItems.some((it) => !it.details.date);
    const missingCustomizeTime = cartItems.some((it) => it.type === 'Customize' && !it.details.time);
    if (missingDates || missingCustomizeTime) return;
    const groups = cartItems.reduce((acc, it) => {
      const d = it.details.date;
      if (!acc[d]) acc[d] = [];
      acc[d].push(it);
      return acc;
    }, {});
    try {
      setIsSubmitting(true);
      for (const [date, items] of Object.entries(groups)) {
        const payload = {
          services: items.map((it) => ({
            orderId: it.id,
            serviceType: it.type,
            details: { ...it.details },
          })),
          customer: { name: userName || user.name, email: user.email },
          date,
        };
        const res = await fetch(`${API_BASE}/api/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to submit');
        setAppointments((prev) => {
          const id = 'APT-' + String(prev.length + 1).padStart(4, '0');
          return [...prev, { id, status: 'pending', services: items, date }];
        });
      }
      setServiceModalOpen(false);
      setAppointmentModalOpen(false);
      setNotificationsOpen(true);
      setCartOpen(false);
      setCartItems([]);
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
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-2 9H8L6 6z" stroke="#8B4513" strokeWidth="2" fill="none"/><circle cx="9" cy="20" r="2" fill="#8B4513"/><circle cx="17" cy="20" r="2" fill="#8B4513"/></svg>
          {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
        </button>
        <button className="profile-trigger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#8B4513" strokeWidth="2"/></svg>
        </button>

        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-info">
            <span className="welcome-text">Welcome back,</span>
            <span className="user-name">{userName || user.name}</span>
          </div>
          <img src={user.avatar} alt="User" className="profile-img" />
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="profile-dropdown" onClick={() => setMenuOpen(false)}>
          <div className="pd-header">
            <span>Quick Menu</span>
          </div>
          <div className="pd-list" onClick={(e) => e.stopPropagation()}>
            <div className="pd-card">
              <div className="pd-title">Profile</div>
              <div className="pd-actions"><button className="btn-secondary" onClick={() => { setProfileOpen(true); setMenuOpen(false); }}>Open</button></div>
            </div>
            <div className="pd-card">
              <div className="pd-title">Notifications</div>
              <div className="pd-actions"><button className="btn-secondary" onClick={() => { setNotificationsOpen(true); setMenuOpen(false); }}>Open</button></div>
            </div>
            <div className="pd-card">
              <div className="pd-title">Order Tracking</div>
              <div className="pd-actions"><button className="btn-secondary" onClick={() => { setNotificationsOpen(true); setMenuOpen(false); }}>Open</button></div>
            </div>
          </div>
        </div>
      )}

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
            <button className="btn-book" onClick={() => setServiceModalOpen(true)}>Book Appointment</button>
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
                <button onClick={() => openModal(item)} className="btn-view">View & Rent</button>
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

      {/* Rental Modal - Same as before */}
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
                <p><strong>Description:</strong> Premium wool blend, perfect for events.</p>
                <label>Choose Rental Date</label>
                <input type="date" className="date-input" />
                <button className="btn-rent">Confirm Rental</button>
              </div>
            </div>
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

      {serviceModalOpen && (
        <div className="modal" onClick={() => setServiceModalOpen(false)}>
          <div className="modal-content service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-title">Book an Appointment</div>
            <div className="service-subtitle">Select Service Type</div>
            <div className="service-list">
              {serviceOptions.map((s) => (
                <button key={s.type} className={`service-item service-${s.type.replace(/\s/g,'').toLowerCase()}`} onClick={() => addServiceToCart(s.type)}>
                  <div className="service-name">{s.type} Service</div>
                  <div className="service-desc">{s.description}</div>
                </button>
              ))}
            </div>
            <div className="service-actions">
              <button className="service-cancel" onClick={() => setServiceModalOpen(false)}>Cancel</button>
              <button className="btn-primary" disabled={cartItems.length===0} onClick={()=>{ setCartOpen(true); setServiceModalOpen(false); }}>Go to Cart</button>
            </div>
          </div>
        </div>
      )}
      {appointmentModalOpen && (
        <div className="modal" onClick={() => setAppointmentModalOpen(false)}>
          <div className="modal-content appointments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-title">Review Appointment</div>
            <div className="appointments-list">
              {cartItems.length === 0 && <div className="cart-empty">No services selected</div>}
              {cartItems.map((it) => (
                <div key={it.id} className="appointment-card">
                  <div className="appointment-top">
                    <div className="apt-id">{it.id}</div>
                    <div className="apt-service-title">{it.type}</div>
                  </div>
                  <div className="cart-form">
                    <input type="date" value={it.details.date || ''} onChange={(e)=>updateItemDetails(it.id,{date:e.target.value})} />
                    <input value={it.details.brand} onChange={(e)=>updateItemDetails(it.id,{brand:e.target.value})} placeholder="Clothe Brand" />
                    <input value={it.details.size} onChange={(e)=>updateItemDetails(it.id,{size:e.target.value})} placeholder="Size" />
                    <input value={it.details.address} onChange={(e)=>updateItemDetails(it.id,{address:e.target.value})} placeholder="Pickup/Delivery Address" />
                    {it.type === 'Customize' && (
                      <input type="time" value={it.details.time || ''} onChange={(e)=>updateItemDetails(it.id,{time:e.target.value})} />
                    )}
                    <textarea value={it.details.notes} onChange={(e)=>updateItemDetails(it.id,{notes:e.target.value})} placeholder="Notes" />
                    {it.type === 'Customize' && (
                      <div className="upload-row">
                        <input type="file" accept="image/*" onChange={(e)=>handleImageUpload(it.id, e.target.files && e.target.files[0])} />
                        {it.details.image && <img src={it.details.image} alt="Preview" className="upload-preview" />}
                      </div>
                    )}
                  </div>
                  <div className="cart-actions">
                    <button onClick={()=>removeItem(it.id)} className="btn-danger">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="service-actions">
              <button className="service-cancel" onClick={() => setAppointmentModalOpen(false)}>Back</button>
              <button className="btn-primary" disabled={cartItems.length===0 || isSubmitting || cartItems.some(it=>!it.details.date) || cartItems.some(it=>it.type==='Customize' && !it.details.time)} onClick={submitAppointment}>{isSubmitting ? 'Submitting...' : 'Submit Appointment'}</button>
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
                    <div className="order-id">{it.id}</div>
                    <div className={`status-badge status-${it.status}`}>{it.status}</div>
                  </div>
                  <div className="cart-card-body">
                    <div className="cart-card-info">
                      <div className="cart-type">{it.type}</div>
                    </div>
                    <div className="cart-form">
                      <input type="date" value={it.details.date || ''} onChange={(e)=>updateItemDetails(it.id,{date:e.target.value})} />
                      <input value={it.details.brand} onChange={(e)=>updateItemDetails(it.id,{brand:e.target.value})} placeholder="Clothe Brand" />
                      <input value={it.details.size} onChange={(e)=>updateItemDetails(it.id,{size:e.target.value})} placeholder="Size" />
                      <input value={it.details.address} onChange={(e)=>updateItemDetails(it.id,{address:e.target.value})} placeholder="Pickup/Delivery Address" />
                      {it.type === 'Customize' && (
                        <input type="time" value={it.details.time || ''} onChange={(e)=>updateItemDetails(it.id,{time:e.target.value})} />
                      )}
                      <textarea value={it.details.notes} onChange={(e)=>updateItemDetails(it.id,{notes:e.target.value})} placeholder="Notes" />
                    </div>
                    <div className="cart-actions">
                      <button onClick={()=>removeItem(it.id)} className="btn-danger">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="service-actions" style={{ padding: '14px' }}>
              <button className="btn-secondary" onClick={()=>setServiceModalOpen(true)}>Add another service</button>
              <button className="btn-primary" disabled={cartItems.length===0 || isSubmitting || cartItems.some(it=>!it.details.date) || cartItems.some(it=>it.type==='Customize' && !it.details.time)} onClick={()=>{ setAppointmentModalOpen(true); }}>Review & Submit</button>
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="modal" onClick={() => setProfileOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="service-title">Profile</div>
            <div className="appointments-list">
              <div className="appointment-card">
                <div className="appointment-top">
                  <div className="apt-service-title">{userName || user.name}</div>
                </div>
                <div className="expand">
                  <div className="expand-row"><span>Email</span><span>{user.email}</span></div>
                </div>
              </div>
            </div>
            <div className="service-actions">
              <button className="service-cancel" onClick={() => setProfileOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserHomePage;
