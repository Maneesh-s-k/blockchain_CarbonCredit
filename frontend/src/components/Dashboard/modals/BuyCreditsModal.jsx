import React, { useState } from "react";

export default function BuyCreditsModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("");

  const availableOffers = [
    { id: 1, seller: "GreenEnergy Co.", amount: "100 kWh", price: "$0.12/kWh", rating: 4.8 },
    { id: 2, seller: "SolarFarm Inc.", amount: "250 kWh", price: "$0.10/kWh", rating: 4.9 },
    { id: 3, seller: "WindPower Ltd.", amount: "500 kWh", price: "$0.11/kWh", rating: 4.7 },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Buying:", { amount, maxPrice, selectedSeller });
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-header">
        <h2>Buy Credits</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount Needed (kWh)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to buy"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Max Price per kWh ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Enter maximum price"
              required
            />
          </div>

          <div className="available-offers">
            <h3>Available Offers</h3>
            {availableOffers.map((offer) => (
              <div 
                key={offer.id} 
                className={`offer-item ${selectedSeller === offer.id ? 'selected' : ''}`}
                onClick={() => setSelectedSeller(offer.id)}
              >
                <div className="offer-info">
                  <h4>{offer.seller}</h4>
                  <p>{offer.amount} available at {offer.price}</p>
                  <div className="rating">
                    <span>⭐ {offer.rating}</span>
                  </div>
                </div>
                <div className="offer-select">
                  <input 
                    type="radio" 
                    name="seller" 
                    checked={selectedSeller === offer.id}
                    onChange={() => setSelectedSeller(offer.id)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm" disabled={!selectedSeller}>
              Buy Credits
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
