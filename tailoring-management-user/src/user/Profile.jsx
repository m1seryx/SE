import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserHomePage.css';
import '../styles/Profile.css';
import logo from "../assets/logo.png";
import dp from "../assets/dp.png";

const Profile = () => {
  const navigate = useNavigate();

  const user = {
    name: (typeof window !== 'undefined' && localStorage.getItem('userName')) || 'Guest',
    email: (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'guest@example.com',
  };

  return (
    <div className="profile-page">

      {/* 🔹 Back Button ABOVE the header */}
      <div className="top-btn-wrapper">
        <button
          className="btn-secondary"
          onClick={() => navigate('/user-home')}
        >
          Back to Home
        </button>
      </div>

      {/* 🔹 Header */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-img" />
          <span className="logo-text">D’jackman Tailor Deluxe</span>
        </div>

        <div className="user-info">
          <img src={dp} alt="User" className="profile-img" />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="profile-main">
        <h2 className="section-title">User Information</h2>

        <div className="user-info-card">
          <div className="user-card-row">
            <img src={dp} alt="User" className="user-avatar" />
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        </div>

        <h2 className="section-title">Order Tracking (Sample)</h2>

        <div className="order-section">
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Service</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Last Update</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>ORD-1001</td>
                <td>Repair</td>
                <td><span className="status-badge in-progress">In Progress</span></td>
                <td>2025-11-10</td>
                <td>2025-11-12</td>
              </tr>

              <tr>
                <td>ORD-1002</td>
                <td>Customize</td>
                <td><span className="status-badge design">Design</span></td>
                <td>2025-11-08</td>
                <td>2025-11-11</td>
              </tr>

              <tr>
                <td>ORD-1003</td>
                <td>Dry Cleaning</td>
                <td><span className="status-badge cleaning">Cleaning</span></td>
                <td>2025-11-09</td>
                <td>2025-11-10</td>
              </tr>

              <tr>
                <td>ORD-1004</td>
                <td>Rental</td>
                <td><span className="status-badge active">Active</span></td>
                <td>2025-11-07</td>
                <td>2025-11-13</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Profile;
