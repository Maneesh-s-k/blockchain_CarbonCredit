import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import ProtectedRoute from './components/Pages/Auth/ProtectedRoute';
import Login from './components/Pages/Auth/Login';
import Register from './components/Pages/Auth/Register';
import MainContent from './components/Dashboard/MainContent';
import ForgotPassword from './components/Pages/Auth/ForgotPassword';
import ResetPassword from './components/Pages/Auth/ResetPassword';
import ApiTest from './components/Test/ApiTest';
import VerifyEmail from './components/Pages/Auth/VerifyEmail';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import './styles/main.css';

function App() {
  return (
    
      <AuthProvider>
        <WalletProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/test" element={<ApiTest />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
               <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
             
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
        </WalletProvider>
      </AuthProvider>
 
  );
}

export default App;
