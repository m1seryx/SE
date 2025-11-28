// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import AuthOverlay from "./components/AuthOverlay";
import CustomerPage from "./pages/CustomerPage";



// Admin imports
import AdminPage from './admin/AdminPage';
import Rental from './admin/Rental';
import DryCleaning from './admin/drycleaning';
import Repair from './admin/repair';
import Post from './admin/PostRent';
import Inventory from './admin/Inventory';
import Customize from './admin/Customize';

const App = () => {
  return (
    <>
      <Header />
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<CustomerPage />} />
        <Route path="/auth" element={<AuthOverlay />} />

        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminPage />} />
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