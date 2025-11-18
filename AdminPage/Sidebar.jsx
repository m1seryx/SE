import React from 'react'
import { Link } from 'react-router-dom';
import "../Styles/appointments.css"

function Sidebar() {
  return (
    <aside id='sidebar'>
      <div className= 'sidebar-title'>
      <div className="p-8 flex items-center gap-4 border-b border-gray-100">
        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
          DT
        </div>
        <h3 className="text-sm font-semibold text-gray-800 leading-tight">
          D'jackman Tailor Deluxe
        </h3>
      </div>


      </div>
      <ul className= 'sidebar-list'>
        <li className= 'sidebar-list-item'>
            <Link to="/admin">
                Dashboard
            </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/Appointment">
                Appointment
            </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/admin/customization">
                Customization
            </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/drycleaning">
                 Dry Cleaning
            </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/rental">
                Rental
            </Link>
        </li>
        <li className='sidebar-list-item'>
            <Link to="/AddRent">
                Post rent
            </Link>
        </li>
        <li className='sidebar-list-item'>
            <Link to="/repairs">
                Repair
            </Link>
        </li>
        <li className='sidebar-list-item'>
            <Link to="/inventory">
                Inventory
            </Link>
        </li>
      </ul>
    </aside>
  );
}


export default Sidebar;