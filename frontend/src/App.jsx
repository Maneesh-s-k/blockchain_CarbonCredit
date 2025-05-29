import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/Pages/Auth/Login';
import Register from './components/Pages/Auth/Register';
import MainContent from './components/Dashboard/MainContent';
import './styles/main.css';

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Dashboard Routes */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <MainContent />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
