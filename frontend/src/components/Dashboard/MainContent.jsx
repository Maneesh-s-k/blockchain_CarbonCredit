import React, { useState } from "react";
import SideNavBar from "./SideNavBar";
import TopOptionsBar from "./TopOptionsBar";
import DashboardPage from "./DashboardPage";

export default function MainContent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSellClick = () => {
    console.log('Sell credits clicked');
  };

  const handleBuyClick = () => {
    console.log('Buy credits clicked');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar now handles its own hover state */}
      <SideNavBar />
      
      {/* Main content always has collapsed margin */}
      <div className="main-dashboard collapsed">
        <TopOptionsBar 
          onSellClick={handleSellClick}
          onBuyClick={handleBuyClick}
          setIsLoading={setIsLoading}
        />
        
        <DashboardPage setIsLoading={setIsLoading} />
        
        {isLoading && (
          <div className="loading-screen">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
