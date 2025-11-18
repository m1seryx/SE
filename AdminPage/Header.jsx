import React from 'react'
import "../Styles/appointments.css"

function Header() {
    return (
        <nav className="fixed top-0 left-[270px] right-0 h-[70px] bg-[#6A3C3E] shadow-md z-40 flex items-center justify-end px-10">
        <div className="text-white font-medium text-base tracking-wide">
          Welcome back, Admin!
        </div>
      </nav>
    );
  }
  
  
  export default Header;