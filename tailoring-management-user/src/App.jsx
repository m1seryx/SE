import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import AuthOverlay from "./components/AuthOverlay";
import CustomerPage from "./pages/CustomerPage";

const App = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/auth" element={<AuthOverlay />} />
      </Routes>
    </>
  );
};

export default App;