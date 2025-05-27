
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBar from "../Dashboard/SideNavBar.jsx";

export default function History() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const historyData = [
    { id: 1, date: "2024-01-15", type: "Energy Sale", amount: "50 kWh", price: "$125.50", status: "Completed" },
    { id: 2, date: "2024-01-14", type: "Credit Purchase", amount: "10 Credits", price: "$89.20", status: "Completed" },
    { id: 3, date: "2024-01-13", type: "Device Registration", device: "Solar Panel #3", fee: "$25.00", status: "Completed" },
    { id: 4, date: "2024-01-12", type: "Energy Sale", amount: "75 kWh", price: "$180.75", status: "Completed" },
  ];

  const filteredData = filter === "all" ? historyData : historyData.filter(item => 
    item.type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <SideNavBar />
      
      <div className="main-dashboard">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>History</h1>
        </div>

        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Activities</option>
            <option value="energy">Energy Trades</option>
            <option value="credit">Credit Purchases</option>
            <option value="device">Device Activities</option>
          </select>
        </div>

        <div className="page-content">
          <div className="card">
            <h3>Activity History</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Amount/Fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.type}</td>
                      <td>
                        {item.amount && <span>{item.amount}</span>}
                        {item.device && <span>{item.device}</span>}
                      </td>
                      <td>
                        {item.price && <span className="positive">{item.price}</span>}
                        {item.fee && <span className="negative">{item.fee}</span>}
                      </td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

