import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBar from "../Dashboard/SideNavBar.jsx";

export default function EnergyExchange() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("market");

  const marketData = [
    { seller: "GreenEnergy Co.", amount: "100 kWh", price: "$0.12/kWh", location: "California" },
    { seller: "SolarFarm Inc.", amount: "250 kWh", price: "$0.10/kWh", location: "Texas" },
    { seller: "WindPower Ltd.", amount: "500 kWh", price: "$0.11/kWh", location: "Iowa" },
  ];

  const myOrders = [
    { id: 1, type: "Sell", amount: "50 kWh", price: "$0.13/kWh", status: "Active" },
    { id: 2, type: "Buy", amount: "100 kWh", price: "$0.11/kWh", status: "Pending" },
  ];

  return (
    <div className="dashboard-container">
      <SideNavBar />
      
      <div className="main-dashboard">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Energy Exchange</h1>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === "market" ? "active" : ""}`}
            onClick={() => setActiveTab("market")}
          >
            Market
          </button>
          <button 
            className={`tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            My Orders
          </button>
        </div>

        <div className="page-content">
          {activeTab === "market" && (
            <div className="card">
              <h3>Market Overview</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Seller</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Location</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.seller}</td>
                        <td>{item.amount}</td>
                        <td>{item.price}</td>
                        <td>{item.location}</td>
                        <td><button className="btn-small">Buy</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="card">
              <h3>Your Active Orders</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.type}</td>
                        <td>{order.amount}</td>
                        <td>{order.price}</td>
                        <td>{order.status}</td>
                        <td><button className="btn-small btn-danger">Cancel</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
