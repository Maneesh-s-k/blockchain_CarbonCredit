import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBar from "../Dashboard/SideNavBar.jsx";

export default function Payments() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("methods");

  const paymentMethods = [
    { id: 1, type: "Credit Card", last4: "1234", expiry: "12/25", isDefault: true },
    { id: 2, type: "Bank Account", last4: "5678", bank: "Chase Bank", isDefault: false },
  ];

  const transactions = [
    { id: 1, date: "2024-01-15", description: "Energy Sale", amount: "+$125.50", status: "Completed" },
    { id: 2, date: "2024-01-14", description: "Credit Purchase", amount: "-$89.20", status: "Completed" },
    { id: 3, date: "2024-01-13", description: "Device Registration Fee", amount: "-$25.00", status: "Pending" },
  ];

  return (
    <div className="dashboard-container">
      <SideNavBar />
      
      <div className="main-dashboard">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Payments</h1>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === "methods" ? "active" : ""}`}
            onClick={() => setActiveTab("methods")}
          >
            Payment Methods
          </button>
          <button 
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Transaction History
          </button>
        </div>

        <div className="page-content">
          {activeTab === "methods" && (
            <div className="card">
              <div className="card-header">
                <h3>Payment Methods</h3>
                <button className="btn-confirm">Add New Method</button>
              </div>
              <div className="payment-methods">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="payment-method-item">
                    <div className="method-info">
                      <h4>{method.type}</h4>
                      <p>****{method.last4}</p>
                      {method.expiry && <p>Expires: {method.expiry}</p>}
                      {method.bank && <p>{method.bank}</p>}
                      {method.isDefault && <span className="default-badge">Default</span>}
                    </div>
                    <div className="method-actions">
                      <button className="btn-small">Edit</button>
                      <button className="btn-small btn-danger">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="card">
              <h3>Transaction History</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.date}</td>
                        <td>{transaction.description}</td>
                        <td className={transaction.amount.startsWith('+') ? 'positive' : 'negative'}>
                          {transaction.amount}
                        </td>
                        <td>{transaction.status}</td>
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
