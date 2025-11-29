// App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import GuestHomePage from "./user/GuestHomePage";
import UserHomePage from "./user/UserHomePage";




// Admin imports
import AdminPage from './admin/AdminPage';
import Rental from './admin/Rental';
import DryCleaning from './admin/drycleaning';
import Repair from './admin/repair';
import Post from './admin/PostRent';
import Inventory from './admin/Inventory';
import Customize from './admin/Customize';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<GuestHomePage setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/user/UserHomePage" element={
          isLoggedIn ? 
            <UserHomePage setIsLoggedIn={setIsLoggedIn} /> : 
            <Navigate to="/" replace />
        } />

        
        {/* Admin Routes */}
        <Route path="/admin/AdminPage" element={<AdminPage />} />
        <Route path="/admin/rental" element={<Rental />} />
        <Route path="/admin/drycleaning" element={<DryCleaning />} />
        <Route path="/admin/repair" element={<Repair />} />
        <Route path="/admin/post" element={<Post />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/customize" element={<Customize />} />
      </Routes>
    </>
  );
};

export default App;