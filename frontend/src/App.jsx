import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MainContent from './components/Dashboard/MainContent';

// Auth pages - using aliases to avoid conflicts
import AuthLogin from './components/Pages/Auth/Login';
import AuthRegister from './components/Pages/Auth/Register';

// Other pages
import EnergyExchange from './components/Pages/EnergyExchange';
import History from './components/Pages/History';
import Payments from './components/Pages/Payments';
import RegisterDevice from './components/Pages/RegisterDevice';
import Settings from './components/Pages/Settings';

// Styles
import './styles/App.css';

import './styles/main.css';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<AuthRegister />} />

          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainContent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/energy-exchange" 
            element={
              <ProtectedRoute>
                <EnergyExchange />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/register-device" 
            element={
              <ProtectedRoute>
                <RegisterDevice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
