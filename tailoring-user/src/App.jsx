import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GuestHome from "./components/GuestHomePage";
import UserHomePage from "./components/UserHomePage";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName] = useState("Alexander");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<GuestHome setIsLoggedIn={setIsLoggedIn} />} />
        <Route
          path="/home"
          element={
            isLoggedIn ? (
              <UserHomePage userName={userName} setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
