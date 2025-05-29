import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FiZap, 
  FiMapPin, 
  FiInfo, 
  FiUpload,
  FiCheck,
  FiAlertTriangle,
  FiSun,
  FiWind,
  FiDroplet
} from 'react-icons/fi';

export default function RegisterDevice() {
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: 'solar',
    capacity: '',
    location: '',
    description: '',
    serialNumber: '',
    manufacturer: '',
    installationDate: '',
    certificationFile: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState(false);
  
  const { user } = useAuth();

  const deviceTypes = [
    { value: 'solar', label: 'Solar Panel', icon: <FiSun /> },
    { value: 'wind', label: 'Wind Turbine', icon: <FiWind /> },
    { value: 'hydro', label: 'Hydroelectric', icon: <FiDroplet /> },
    { value: 'geothermal', label: 'Geothermal', icon: <FiZap /> },
    { value: 'biomass', label: 'Biomass', icon: <FiZap /> }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (file) => {
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({
        ...prev,
        certificationFile: file
      }));
      setMessage({ type: 'success', text: 'Certification file uploaded successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Please upload a PDF file only.' });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch('http://localhost:3001/api/devices/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Device registered successfully! It will be reviewed within 24-48 hours.' });
        // Reset form
        setFormData({
          deviceName: '',
          deviceType: 'solar',
          capacity: '',
          location: '',
          description: '',
          serialNumber: '',
          manufacturer: '',
          installationDate: '',
          certificationFile: null
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to register device' });
      }
    } catch (error) {
      console.error('Device registration error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-device-page">
      <div className="register-device-container">
        {/* Header */}
        <div className="page-header">
          <h1>Register Energy Device</h1>
          <p>Add your renewable energy device to start trading energy credits</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.type === 'success' ? <FiCheck /> : <FiAlertTriangle />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        {/* Registration Form */}
        <div className="registration-form-card">
          <form onSubmit={handleSubmit} className="registration-form">
            {/* Device Basic Info */}
            <div className="form-section">
              <h3 className="section-title">
                <FiZap />
                Device Information
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deviceName">Device Name *</label>
                  <input
                    type="text"
                    id="deviceName"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleInputChange}
                    placeholder="My Solar Panel System"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="deviceType">Device Type *</label>
                  <select
                    id="deviceType"
                    name="deviceType"
                    value={formData.deviceType}
                    onChange={handleInputChange}
                    required
                  >
                    {deviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="capacity">Capacity (kW) *</label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="5.5"
                    step="0.1"
                    min="0.1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="manufacturer">Manufacturer</label>
                  <input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="Tesla, SunPower, etc."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="serialNumber">Serial Number</label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    placeholder="ABC123XYZ789"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="installationDate">Installation Date</label>
                  <input
                    type="date"
                    id="installationDate"
                    name="installationDate"
                    value={formData.installationDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="form-section">
              <h3 className="section-title">
                <FiMapPin />
                Location Details
              </h3>
              
              <div className="form-group">
                <label htmlFor="location">Installation Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State, ZIP"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-section">
              <h3 className="section-title">
                <FiInfo />
                Additional Information
              </h3>
              
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional details about your device setup, orientation, etc."
                  rows="4"
                  maxLength="500"
                />
                <small>{formData.description.length}/500 characters</small>
              </div>
            </div>

            {/* File Upload */}
            <div className="form-section">
              <h3 className="section-title">
                <FiUpload />
                Certification Documents
              </h3>
              
              <div 
                className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FiUpload className="upload-icon" />
                <p>
                  {formData.certificationFile 
                    ? `Selected: ${formData.certificationFile.name}`
                    : 'Drag and drop your certification PDF here, or click to browse'
                  }
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="upload-button">
                  Choose File
                </label>
              </div>
              <small>Upload installation certificates, warranties, or compliance documents (PDF only)</small>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Registering Device...
                </>
              ) : (
                <>
                  <FiCheck />
                  Register Device
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="info-panel">
          <h4>Registration Process</h4>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h5>Submit Application</h5>
                <p>Fill out the device registration form with accurate information</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h5>Verification</h5>
                <p>Our team will verify your device specifications and documentation</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h5>Approval</h5>
                <p>Once approved, you can start trading energy credits immediately</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
