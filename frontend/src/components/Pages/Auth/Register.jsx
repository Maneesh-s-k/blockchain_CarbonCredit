import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import apiClient from '../../../services/apiService';
import { 
  FiZap, 
  FiMapPin, 
  FiInfo, 
  FiUpload,
  FiCheck,
  FiAlertTriangle,
  FiSun,
  FiWind,
  FiDroplet,
  FiLoader
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
    model: '',
    installationDate: '',
    certificationFile: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const deviceTypes = [
    { value: 'solar', label: 'Solar Panel', icon: <FiSun />, emoji: '☀️' },
    { value: 'wind', label: 'Wind Turbine', icon: <FiWind />, emoji: '💨' },
    { value: 'hydro', label: 'Hydroelectric', icon: <FiDroplet />, emoji: '💧' },
    { value: 'geothermal', label: 'Geothermal', icon: <FiZap />, emoji: '🌋' },
    { value: 'biomass', label: 'Biomass', icon: <FiZap />, emoji: '🌱' }
  ];

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'deviceName':
        if (!value.trim()) {
          errors.deviceName = 'Device name is required';
        } else if (value.length > 100) {
          errors.deviceName = 'Device name cannot exceed 100 characters';
        } else {
          delete errors.deviceName;
        }
        break;

      case 'capacity':
        const capacityNum = parseFloat(value);
        if (!value) {
          errors.capacity = 'Capacity is required';
        } else if (isNaN(capacityNum)) {
          errors.capacity = 'Capacity must be a number';
        } else if (capacityNum < 0.1) {
          errors.capacity = 'Minimum capacity is 0.1 kW';
        } else if (capacityNum > 10000) {
          errors.capacity = 'Maximum capacity is 10,000 kW';
        } else {
          delete errors.capacity;
        }
        break;

      case 'location':
        if (!value.trim()) {
          errors.location = 'Location is required';
        } else if (value.length > 200) {
          errors.location = 'Location cannot exceed 200 characters';
        } else {
          delete errors.location;
        }
        break;

      case 'description':
        if (value && value.length > 500) {
          errors.description = 'Description cannot exceed 500 characters';
        } else {
          delete errors.description;
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }

    // Real-time validation
    validateField(name, value);
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF and image files are allowed.' });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size cannot exceed 10MB.' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      certificationFile: file
    }));
    setMessage({ type: 'success', text: `File "${file.name}" uploaded successfully!` });
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
    
    // Validate all required fields
    const requiredFields = ['deviceName', 'deviceType', 'capacity', 'location'];
    let hasErrors = false;

    requiredFields.forEach(field => {
      if (!formData[field]) {
        validateField(field, formData[field]);
        hasErrors = true;
      }
    });

    if (hasErrors || Object.keys(validationErrors).length > 0) {
      setMessage({ type: 'error', text: 'Please fix all validation errors before submitting.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare form data for API
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      const response = await apiClient.registerDevice(submitData);

      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: 'Device registered successfully! It will be reviewed within 24-48 hours.' 
        });
        
        // Reset form after successful submission
        setTimeout(() => {
          navigate('/devices');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to register device' });
      }
    } catch (error) {
      console.error('Device registration error:', error);
      setMessage({ type: 'error', text: error.message || 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDeviceType = deviceTypes.find(type => type.value === formData.deviceType);

  return (
    <div className="register-device-page">
      <div className="register-device-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Register Energy Device</h1>
            <p>Add your renewable energy device to start trading energy credits</p>
          </div>
          <div className="device-type-preview">
            <span className="device-emoji">{selectedDeviceType?.emoji}</span>
            <span className="device-type-name">{selectedDeviceType?.label}</span>
          </div>
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
                    className={validationErrors.deviceName ? 'error' : ''}
                    required
                  />
                  {validationErrors.deviceName && (
                    <span className="error-text">{validationErrors.deviceName}</span>
                  )}
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
                        {type.emoji} {type.label}
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
                    max="10000"
                    className={validationErrors.capacity ? 'error' : ''}
                    required
                  />
                  {validationErrors.capacity && (
                    <span className="error-text">{validationErrors.capacity}</span>
                  )}
                  <small>Enter the maximum power output in kilowatts</small>
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
                  <label htmlFor="model">Model</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="Model number or name"
                  />
                </div>
                
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
              </div>

              <div className="form-group">
                <label htmlFor="installationDate">Installation Date</label>
                <input
                  type="date"
                  id="installationDate"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                />
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
                  className={validationErrors.location ? 'error' : ''}
                  required
                />
                {validationErrors.location && (
                  <span className="error-text">{validationErrors.location}</span>
                )}
                <small>Provide the complete address where the device is installed</small>
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
                  placeholder="Additional details about your device setup, orientation, special features, etc."
                  rows="4"
                  maxLength="500"
                  className={validationErrors.description ? 'error' : ''}
                />
                <div className="char-count">
                  <span className={formData.description.length > 450 ? 'warning' : ''}>
                    {formData.description.length}/500 characters
                  </span>
                </div>
                {validationErrors.description && (
                  <span className="error-text">{validationErrors.description}</span>
                )}
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
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="upload-button">
                  Choose File
                </label>
              </div>
              <small>Upload installation certificates, warranties, or compliance documents (PDF, JPG, PNG - Max 10MB)</small>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? (
                <>
                  <FiLoader className="spinning" />
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
                <p>Our team will verify your device specifications and documentation within 24-48 hours</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h5>Approval & Trading</h5>
                <p>Once approved, you can start trading energy credits immediately</p>
              </div>
            </div>
          </div>

          <div className="help-section">
            <h5>Need Help?</h5>
            <p>
              Contact our support team if you have questions about device registration
              or need assistance with the verification process.
            </p>
            <button className="help-button">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
