import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/main.css';

// Initialize environment variables and polyfills
window.Buffer = Buffer || require('buffer').Buffer;
window.process = process || require('process/browser');

// Get Google Client ID from environment variables
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Create root once and reuse it
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
     <BrowserRouter> {/* ✅ Wrap everything with BrowserRouter */}
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
