import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { blockchainService } from '../../services/blockchainService';
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
  FiLoader,
  FiFileText,
  FiShield
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
  const [registrationStep, setRegistrationStep] = useState(1);
  const [blockchainTxHash, setBlockchainTxHash] = useState('');
  const [deviceId, setDeviceId] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const deviceTypes = [
    { value: 'solar', label: 'Solar Panel', icon: <FiSun />, emoji: '☀️' },
    { value: 'wind', label: 'Wind Turbine', icon: <FiWind />, emoji: '💨' },
    { value: 'hydro', label: 'Hydroelectric', icon: <FiDroplet />, emoji: '💧' },
    { value: 'geothermal', label: 'Geothermal', icon: <FiZap />, emoji: '🌋' },
    { value: 'biomass', label: 'Biomass', icon: <FiZap />, emoji: '🌿' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only PDF and image files are allowed' });
        return;
      }
      
      setFormData(prev => ({ ...prev, certificationFile: file }));
      setMessage({ type: '', text: '' });
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
      const file = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [file] } };
      handleFileUpload(fakeEvent);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.deviceName.trim()) {
      errors.deviceName = 'Device name is required';
    } else if (formData.deviceName.length > 100) {
      errors.deviceName = 'Device name cannot exceed 100 characters';
    }
    
    if (!formData.capacity || parseFloat(formData.capacity) < 0.1) {
      errors.capacity = 'Capacity must be at least 0.1 kW';
    } else if (parseFloat(formData.capacity) > 10000) {
      errors.capacity = 'Capacity cannot exceed 10,000 kW';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    } else if (formData.location.length > 200) {
      errors.location = 'Location cannot exceed 200 characters';
    }
    
    if (!formData.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required';
    }
    
    if (!formData.manufacturer.trim()) {
      errors.manufacturer = 'Manufacturer is required';
    }
    
    if (!formData.installationDate) {
      errors.installationDate = 'Installation date is required';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateMockProof = () => {
    // Generate mock ZK-SNARK proof for development
    return {
      a: [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
      ],
      b: [
        [
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          "0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba"
        ],
        [
          "0x1111111111111111111111111111111111111111111111111111111111111111",
          "0x2222222222222222222222222222222222222222222222222222222222222222"
        ]
      ],
      c: [
        "0x3333333333333333333333333333333333333333333333333333333333333333",
        "0x4444444444444444444444444444444444444444444444444444444444444444"
      ],
      input: [
        "0x5555555555555555555555555555555555555555555555555555555555555555"
      ]
    };
  };

  const generateProjectHash = () => {
    const dataString = JSON.stringify({
      deviceName: formData.deviceName,
      serialNumber: formData.serialNumber,
      location: formData.location,
      timestamp: Date.now()
    });
    
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the validation errors before submitting' });
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      setRegistrationStep(1);
      
      // Step 1: Register device with backend
      const deviceFormData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'certificationFile' && formData[key]) {
          deviceFormData.append('certificationFile', formData[key]);
        } else if (formData[key]) {
          deviceFormData.append(key, formData[key]);
        }
      });
      
      const response = await apiService.registerDevice(deviceFormData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to register device');
      }
      
      setDeviceId(response.device.id);
      setRegistrationStep(2);
      setMessage({ type: 'success', text: 'Device registered successfully! Now minting blockchain token...' });
      
      // Step 2: Mint blockchain token (if blockchain is available)
      try {
        const userAddress = await blockchainService.getAccount();
        
        if (userAddress) {
          const deviceData = {
            owner: userAddress,
            carbonAmount: Math.floor(parseFloat(formData.capacity) * 100), // Estimate carbon credits
            energyAmount: Math.floor(parseFloat(formData.capacity) * 1000), // Estimate energy amount
            projectHash: generateProjectHash(),
            projectType: formData.deviceType,
            location: formData.location,
            vintage: new Date(formData.installationDate).getFullYear(),
            uri: `ipfs://device-${formData.serialNumber}`
          };
          
          const proof = generateMockProof();
          
          const tx = await blockchainService.registerDevice(deviceData, proof);
          setBlockchainTxHash(tx.hash);
          setRegistrationStep(3);
          
          // Wait for transaction confirmation
          await tx.wait();
          setRegistrationStep(4);
          setMessage({ 
            type: 'success', 
            text: 'Device registered and blockchain token minted successfully! 🎉' 
          });
        } else {
          setRegistrationStep(4);
          setMessage({ 
            type: 'success', 
            text: 'Device registered successfully! Blockchain integration not available.' 
          });
        }
      } catch (blockchainError) {
        console.error('Blockchain registration failed:', blockchainError);
        setRegistrationStep(4);
        setMessage({ 
          type: 'success', 
          text: 'Device registered successfully! Blockchain integration failed but device is saved.' 
        });
      }
      
    } catch (error) {
      console.error('Device registration error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to register device' });
      setRegistrationStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setValidationErrors({});
    setMessage({ type: '', text: '' });
    setRegistrationStep(1);
    setBlockchainTxHash('');
    setDeviceId('');
  };

  const selectedDeviceType = deviceTypes.find(type => type.value === formData.deviceType);

  if (registrationStep === 4) {
    return (
      <div className="register-device-page">
        <div className="register-device-container">
          <div className="registration-form-card">
            <div className="success-content">
              <div className="success-icon">
                <FiCheck size={64} color="var(--success)" />
              </div>
              
              <h2>Device Registered Successfully! 🎉</h2>
              <p>Your renewable energy device has been registered and is pending verification.</p>
              
              <div className="success-details">
                <div className="detail-item">
                  <span>Device ID:</span>
                  <span>{deviceId}</span>
                </div>
                <div className="detail-item">
                  <span>Device Name:</span>
                  <span>{formData.deviceName}</span>
                </div>
                <div className="detail-item">
                  <span>Type:</span>
                  <span>{selectedDeviceType?.label}</span>
                </div>
                <div className="detail-item">
                  <span>Capacity:</span>
                  <span>{formData.capacity} kW</span>
                </div>
                {blockchainTxHash && (
                  <div className="detail-item">
                    <span>Blockchain TX:</span>
                    <span className="tx-hash">{blockchainTxHash}</span>
                  </div>
                )}
              </div>
              
              <div className="success-actions">
                <button 
                  onClick={() => navigate('/devices')} 
                  className="primary-btn"
                >
                  <FiZap />
                  View My Devices
                </button>
                <button 
                  onClick={resetForm} 
                  className="secondary-btn"
                >
                  Register Another Device
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-device-page">
      <div className="register-device-container">
        <div className="page-header">
          <div className="header-content">
            <h1>Register Renewable Energy Device</h1>
            <p>Add your renewable energy device to start trading energy credits</p>
          </div>
          {selectedDeviceType && (
            <div className="device-type-preview">
              <span className="device-emoji">{selectedDeviceType.emoji}</span>
              <span className="device-type-name">{selectedDeviceType.label}</span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        {isLoading && (
          <div className="progress-steps">
            <div className={`step ${registrationStep >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <label>Backend Registration</label>
            </div>
            <div className={`step ${registrationStep >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <label>Blockchain Minting</label>
            </div>
            <div className={`step ${registrationStep >= 3 ? 'active' : ''}`}>
              <span>3</span>
              <label>Transaction Confirmation</label>
            </div>
            <div className={`step ${registrationStep >= 4 ? 'active' : ''}`}>
              <span>4</span>
              <label>Complete</label>
            </div>
          </div>
        )}

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.type === 'error' ? <FiAlertTriangle /> : <FiCheck />}
            {message.text}
            <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        <div className="registration-form-card">
          <form onSubmit={handleSubmit} className="registration-form">
            {/* Basic Information */}
            <div className="form-section">
              <div className="section-title">
                <FiZap />
                Basic Information
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Device Name *</label>
                  <input
                    type="text"
                    value={formData.deviceName}
                    onChange={(e) => handleInputChange('deviceName', e.target.value)}
                    placeholder="e.g., Rooftop Solar Panel System"
                    className={validationErrors.deviceName ? 'error' : ''}
                    maxLength={100}
                  />
                  {validationErrors.deviceName && (
                    <span className="error-text">{validationErrors.deviceName}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Device Type *</label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => handleInputChange('deviceType', e.target.value)}
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
                  <label>Capacity (kW) *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="e.g., 10.5"
                    min="0.1"
                    max="10000"
                    step="0.1"
                    className={validationErrors.capacity ? 'error' : ''}
                  />
                  {validationErrors.capacity && (
                    <span className="error-text">{validationErrors.capacity}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Installation Date *</label>
                  <input
                    type="date"
                    value={formData.installationDate}
                    onChange={(e) => handleInputChange('installationDate', e.target.value)}
                    className={validationErrors.installationDate ? 'error' : ''}
                  />
                  {validationErrors.installationDate && (
                    <span className="error-text">{validationErrors.installationDate}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="form-section">
              <div className="section-title">
                <FiMapPin />
                Location Information
              </div>
              
              <div className="form-group">
                <label>Installation Address *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., 123 Green Street, San Francisco, CA 94102"
                  className={validationErrors.location ? 'error' : ''}
                  maxLength={200}
                />
                {validationErrors.location && (
                  <span className="error-text">{validationErrors.location}</span>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="form-section">
              <div className="section-title">
                <FiInfo />
                Technical Details
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Manufacturer *</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="e.g., Tesla, SunPower"
                    className={validationErrors.manufacturer ? 'error' : ''}
                    maxLength={100}
                  />
                  {validationErrors.manufacturer && (
                    <span className="error-text">{validationErrors.manufacturer}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., Model S Solar Roof"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="e.g., SN123456789"
                  className={validationErrors.serialNumber ? 'error' : ''}
                  maxLength={50}
                />
                {validationErrors.serialNumber && (
                  <span className="error-text">{validationErrors.serialNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional details about the device installation..."
                  rows="3"
                  maxLength={500}
                  className={validationErrors.description ? 'error' : ''}
                />
                <div className="char-count">
                  <span className={formData.description?.length > 450 ? 'warning' : ''}>
                    {formData.description?.length || 0}/500
                  </span>
                </div>
                {validationErrors.description && (
                  <span className="error-text">{validationErrors.description}</span>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="form-section">
              <div className="section-title">
                <FiUpload />
                Certification Document
              </div>
              
              <div 
                className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                />
                
                <div className="upload-icon">
                  {formData.certificationFile ? <FiFileText /> : <FiUpload />}
                </div>
                
                {formData.certificationFile ? (
                  <div>
                    <p><strong>{formData.certificationFile.name}</strong></p>
                    <p>Size: {(formData.certificationFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p>Drag and drop your certification file here, or click to browse</p>
                    <p><small>Supports PDF, JPG, PNG files up to 10MB</small></p>
                  </div>
                )}
                
                <div className="upload-button">
                  {formData.certificationFile ? 'Change File' : 'Choose File'}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  {registrationStep === 1 && 'Registering Device...'}
                  {registrationStep === 2 && 'Minting Blockchain Token...'}
                  {registrationStep === 3 && 'Confirming Transaction...'}
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
                <h5>Submit Registration</h5>
                <p>Fill out the device registration form with accurate information</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h5>Verification Review</h5>
                <p>Our team will verify your device specifications and documentation within 24-48 hours</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h5>Blockchain Integration</h5>
                <p>Once approved, your device will be registered on the blockchain for carbon credit generation</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h5>Start Trading</h5>
                <p>Begin generating and trading energy credits immediately after approval</p>
              </div>
            </div>
          </div>

          <div className="help-section">
            <h5>Need Help?</h5>
            <p>Contact our support team if you have questions about device registration or need assistance with the verification process.</p>
            <button className="help-button">
              <FiInfo />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
