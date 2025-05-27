import React, { useState } from "react";

export default function SellCreditsModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Selling:", { amount, price });
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-header">
        <h2>Sell Credits</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (kWh)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to sell"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Price per kWh ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm">Sell Credits</button>
          </div>
        </form>
      </div>
    </div>
  );
}
