import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import AdminHeader from "./admin/AdminHeader";
import Sidebar from "./admin/Sidebar";
import Header from "./components/Header";
import AuthOverlay from "./components/AuthOverlay";
import CustomerPage from "./pages/CustomerPage";
import AdminPage from './admin/AdminPage';
import Rental from './admin/Rental';
import DryCleaning from './admin/drycleaning';
import Repair from './admin/repair';
import Post from './admin/PostRent';
import Inventory from './admin/Inventory';
import Customize from './admin/Customize';

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/auth" element={<AuthOverlay />} />
        
        <Route path="/admin/admin" element={<AdminPage />} />
        <Route path="/admin/rental" element={<Rental />} />
        <Route path="/admin/drycleaning" element={<DryCleaning />} />
        <Route path="/admin/repair" element={<Repair />} />
        <Route path="/admin/Post" element={<Post />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/customize" element={<Customize />} />
      </Routes>
    </Router>
  );
};

export default App;