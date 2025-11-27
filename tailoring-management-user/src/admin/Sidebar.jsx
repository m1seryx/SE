import React from 'react'
import { NavLink } from 'react-router-dom';
import "../adminStyle/appointments.css"

function Sidebar() {
  return (
    <aside className='sidebar'> 
      <div className='profile'> 
        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
        </div>
        <h3>D'jackman Tailor Deluxe</h3>
      </div>

      <nav> 
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/Customize" className={({ isActive }) => isActive ? 'active' : ''}>
          Customization
        </NavLink>
        <NavLink to="/drycleaning" className={({ isActive }) => isActive ? 'active' : ''}>
          Dry Cleaning
        </NavLink>
        <NavLink to="/rental" className={({ isActive }) => isActive ? 'active' : ''}>
          Rental
        </NavLink>
        <NavLink to="/Post" className={({ isActive }) => isActive ? 'active' : ''}>
          Post rent
        </NavLink>
        <NavLink to="/Repair" className={({ isActive }) => isActive ? 'active' : ''}>
          Repair
        </NavLink>
        <NavLink to="/Inventory" className={({ isActive }) => isActive ? 'active' : ''}>
          Inventory
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;