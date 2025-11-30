// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

// Customer / User imports
import GuestHomePage from "./user/GuestHomePage";
import UserHomePage from "./user/UserHomePage";
import Profile from "./user/Profile";
import RentalPage from "./user/RentalPage";

// Admin imports
import AdminPage from "./admin/AdminPage";
import Rental from "./admin/Rental";
import DryCleaning from "./admin/drycleaning";
import Repair from "./admin/repair";
import Post from "./admin/PostRent";
import Inventory from "./admin/Inventory";
import Customize from "./admin/Customize";
import Billing from "./admin/Billing";

const App = () => {
  return (
    <>
      <Routes>

        {/* ===== CUSTOMER ROUTES ===== */}
        <Route path="/" element={<GuestHomePage />} />
        <Route path="/user-home" element={<UserHomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rentals" element={<RentalPage />} />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/rental" element={<Rental />} />
        <Route path="/drycleaning" element={<DryCleaning />} />
        <Route path="/repair" element={<Repair />} />
        <Route path="/post" element={<Post />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/billing" element={<Billing />} />

      </Routes>
    </>
  );
};

export default App;
