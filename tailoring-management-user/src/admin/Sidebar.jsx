import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom';
import "../adminStyle/appointments.css"
import logo from '../assets/logo.png';


function Sidebar() {
  const location = useLocation();
  const isRentalActive = location.pathname === '/rental' || location.pathname === '/Post';
  const [rentalSubmenuOpen, setRentalSubmenuOpen] = useState(isRentalActive);

  useEffect(() => {
    if (isRentalActive) {
      setRentalSubmenuOpen(true);
    }
  }, [isRentalActive]);

  return (
    <aside className='sidebar'> 
      <div className='profile'> 
  <div className="profile-header">
    <img 
  src={logo} 
  alt="D'jackman Tailor Deluxe Logo" 
  className="profile-logo"
    />
    <h3 className="p" style={{ color: 'rgb(139, 69, 19)' }}>D'jackman Tailor Deluxe</h3>
  </div>
</div>

      <nav> 
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/customize" className={({ isActive }) => isActive ? 'active' : ''}>
          Customization
        </NavLink>
        <NavLink to="/drycleaning" className={({ isActive }) => isActive ? 'active' : ''}>
          Dry Cleaning
        </NavLink>
        <div className="menu-item-with-submenu">
          <div
            onClick={() => setRentalSubmenuOpen(!rentalSubmenuOpen)}
            className={isRentalActive ? 'menu-parent active' : 'menu-parent'}
          >
            <span>Rental</span>
            <span className="submenu-arrow">{rentalSubmenuOpen ? '▲' : '▼'}</span>
          </div>
          {rentalSubmenuOpen && (
            <div className="submenu-container">
              <NavLink 
                to="/rental" 
                className={({ isActive }) => isActive ? 'submenu-item active' : 'submenu-item'}
              >
                Rental
              </NavLink>
              <NavLink 
                to="/Post" 
                className={({ isActive }) => isActive ? 'submenu-item active' : 'submenu-item'}
              >
                Post rent
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/repair" className={({ isActive }) => isActive ? 'active' : ''}>
          Repair
        </NavLink>
        <NavLink to="/billing" className={({ isActive}) => isActive ? 'active' : ''}>
          Billing
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
          Inventory
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => isActive ? 'active' : ''}>
          Customer List
        </NavLink>
        <NavLink to="/shop-schedule" className={({ isActive }) => isActive ? 'active' : ''}>
          Shop Schedule
        </NavLink>
        <NavLink to="/walk-in-orders" className={({ isActive }) => isActive ? 'active' : ''}>
          Walk-In Orders
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;