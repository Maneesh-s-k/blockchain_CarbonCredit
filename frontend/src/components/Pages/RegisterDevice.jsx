import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavBar from "../Dashboard/SideNavBar.jsx";

export default function RegisterDevice({ setIsLoading }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceName: "",
    deviceType: "",
    capacity: "",
    location: "",
    serialNumber: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/");
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="dashboard-container">
      <SideNavBar />
      
      <div className="main-dashboard">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Dashboard
          </button>
          <h1>Register New Device</h1>
        </div>

        <div className="register-form-container">
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Device Information</h3>
              
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={handleChange}
                  placeholder="Enter device name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Device Type</label>
                <select
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select device type</option>
                  <option value="solar">Solar Panel</option>
                  <option value="wind">Wind Turbine</option>
                  <option value="hydro">Hydro Generator</option>
                  <option value="battery">Battery Storage</option>
                </select>
              </div>

              <div className="form-group">
                <label>Capacity (kW)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Enter capacity in kW"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter installation location"
                  required
                />
              </div>

              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Enter device serial number"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate("/")}>
                Cancel
              </button>
              <button type="submit" className="btn-confirm">
                Register Device
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
