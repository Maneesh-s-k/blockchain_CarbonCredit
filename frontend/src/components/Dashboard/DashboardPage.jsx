import React, { useState } from "react";
import SideNavBar from "./SideNavBar.jsx";
import TopOptionsBar from "./TopOptionsBar.jsx";
import MainContent from "./MainContent.jsx";
import SellCreditsModal from "./modals/SellCreditsModal.jsx";
import BuyCreditsModal from "./modals/BuyCreditsModal.jsx";
import ModalOverlay from "./modals/ModalOverlay.jsx";

export default function DashboardPage({ setIsLoading }) {
  const [showSellModal, setShowSellModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  return (
    <>
      <SideNavBar />
      
      <div className="main-dashboard">
        <TopOptionsBar 
          onSellClick={() => setShowSellModal(true)}
          onBuyClick={() => setShowBuyModal(true)}
          setIsLoading={setIsLoading}
        />
        <MainContent />
      </div>

      {/* Modal System */}
      {(showSellModal || showBuyModal) && (
        <ModalOverlay onClose={() => {
          setShowSellModal(false);
          setShowBuyModal(false);
        }}>
          {showSellModal && <SellCreditsModal onClose={() => setShowSellModal(false)} />}
          {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}
        </ModalOverlay>
      )}
    </>
  );
}
