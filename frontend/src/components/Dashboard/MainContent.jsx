import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import SideNavBar from './SideNavBar';
import TopOptionsBar from './TopOptionsBar';
import DashboardPage from './DashboardPage';
import DeviceDashboard from '../Pages/DeviceDashboard';
import RegisterDevice from '../Pages/RegisterDevice';
import EnergyExchange from '../Pages/EnergyExchange';
import History from '../Pages/History';
import Payments from '../Pages/Payments';
import Settings from '../Pages/Settings';
import Profile from '../Pages/Auth/Profile';

export default function MainContent() {
  const [isLoading, setIsLoading] = useState(false);

  // Force initial layout
  useEffect(() => {
    const forceLayout = () => {
      const sidebar = document.querySelector('.side-navbar');
      const mainWrapper = document.querySelector('.main-content-wrapper');
      const topBar = document.querySelector('.top-options-container');
      
      if (sidebar && mainWrapper && topBar) {
        const sidebarWidth = 80;
        mainWrapper.style.marginLeft = `${sidebarWidth}px`;
        mainWrapper.style.width = `calc(100vw - ${sidebarWidth}px)`;
        topBar.style.left = `${sidebarWidth}px`;
      }
    };

    setTimeout(forceLayout, 100);
  }, []);

  // Handle sidebar state changes
  useEffect(() => {
    const handleSidebarToggle = () => {
      const sidebar = document.querySelector('.side-navbar');
      if (sidebar) {
        const isExpanded = sidebar.classList.contains('expanded');
        
        const mainWrapper = document.querySelector('.main-content-wrapper');
        const topBar = document.querySelector('.top-options-container');
        
        if (mainWrapper) {
          const sidebarWidth = isExpanded ? 280 : 80;
          mainWrapper.style.marginLeft = `${sidebarWidth}px`;
          mainWrapper.style.width = `calc(100vw - ${sidebarWidth}px)`;
        }
        
        if (topBar) {
          const sidebarWidth = isExpanded ? 280 : 80;
          topBar.style.left = `${sidebarWidth}px`;
        }
      }
    };

    const sidebar = document.querySelector('.side-navbar');
    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleSidebarToggle);
      sidebar.addEventListener('mouseleave', handleSidebarToggle);
      
      const observer = new MutationObserver(handleSidebarToggle);
      observer.observe(sidebar, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
      
      return () => {
        sidebar.removeEventListener('mouseenter', handleSidebarToggle);
        sidebar.removeEventListener('mouseleave', handleSidebarToggle);
        observer.disconnect();
      };
    }
  }, []);

  return (
    <div className="dashboard-container">
      <SideNavBar />
      
      <div className="main-content-wrapper">
        <TopOptionsBar setIsLoading={setIsLoading} />
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        )}
        
        <div className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage setIsLoading={setIsLoading} />} />
            <Route path="/dashboard" element={<DashboardPage setIsLoading={setIsLoading} />} />
            <Route path="/devices" element={<DeviceDashboard />} />
            <Route path="/register-device" element={<RegisterDevice />} />
            <Route path="/energy-exchange" element={<EnergyExchange />} />
            <Route path="/history" element={<History />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
