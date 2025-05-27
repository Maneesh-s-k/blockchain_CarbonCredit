import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardPage from "./components/Dashboard/DashboardPage.jsx";
import RegisterDevice from "./components/Pages/RegisterDevice.jsx";
import EnergyExchange from "./components/Pages/EnergyExchange.jsx";
import Payments from "./components/Pages/Payments.jsx";
import History from "./components/Pages/History.jsx";
import Settings from "./components/Pages/Settings.jsx";
import LoadingScreen from "./components/Shared/LoadingScreen.jsx";
import "./styles/main.css";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Router>
      {isLoading && <LoadingScreen />}
      <Routes>
        <Route path="/" element={<DashboardPage setIsLoading={setIsLoading} />} />
        <Route path="/register-device" element={<RegisterDevice setIsLoading={setIsLoading} />} />
        <Route path="/energy-exchange" element={<EnergyExchange />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
