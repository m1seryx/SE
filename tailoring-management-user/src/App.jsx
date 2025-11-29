// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";


// Admin imports
import AdminPage from './admin/AdminPage';
import Rental from './admin/Rental';
import DryCleaning from './admin/drycleaning';
import Repair from './admin/repair';
import Post from './admin/PostRent';
import Inventory from './admin/Inventory';
import Customize from './admin/Customize';
import Billing from './admin/Billing';


const App = () => {
  return (
    <>
      <Routes>
        {/* Customer Routes */}



        {/* Admin Routes */}
        <Route path="/" element={<AdminPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/rental" element={<Rental />} />
        <Route path="/drycleaning" element={<DryCleaning />} />
        <Route path="/repair" element={<Repair />} />
        <Route path="/post" element={<Post />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/Billing" element={<Billing />} />

      </Routes>
    </>
  );
};

export default App;