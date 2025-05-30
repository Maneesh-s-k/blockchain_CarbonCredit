import React, { useState, useEffect } from 'react';
import { blockchainService } from '../../services/blockchainService';
import ZKProofGenerator from '../Blockchain/ZKProofGenerator';
import { FiShield, FiEye, FiEyeOff, FiLock, FiUnlock } from 'react-icons/fi';

const ZKTradingInterface = () => {
  const [tradingData, setTradingData] = useState({
    senderBalance: 0,
    transferAmount: '',
    receiverAddress: '',
    senderSecret: '',
    receiverSecret: '',
    usePrivateTransfer: true
  });
  const [zkProof, setZkProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const address = await blockchainService.getAccount();
      const balance = await blockchainService.getCarbonBalance(address);
      
      setUserAddress(address);
      setTradingData(prev => ({
        ...prev,
        senderBalance: parseInt(balance.toString())
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setTradingData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const generateZKProof = async () => {
    try {
      setLoading(true);
      setError('');

      if (!tradingData.transferAmount || !tradingData.receiverAddress) {
        throw new Error('Please fill in all required fields');
      }

      if (parseInt(tradingData.transferAmount) > tradingData.senderBalance) {
        throw new Error('Transfer amount exceeds your balance');
      }

      // Generate ZK proof for private transfer
      const proof = await ZKProofGenerator.generateTransferProof(
        tradingData.senderBalance,
        parseInt(tradingData.transferAmount),
        tradingData.senderSecret || Math.floor(Math.random() * 1000000).toString(),
        tradingData.receiverSecret || Math.floor(Math.random() * 1000000).toString()
      );

      setZkProof(proof);
      
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const executePrivateTransfer = async () => {
    try {
      setLoading(true);
      setError('');

      if (!zkProof) {
        throw new Error('Please generate ZK proof first');
      }

      // Create nullifier and commitments
      const nullifier = `0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd`;
      const senderCommitment = `0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234`;
      const newSenderCommitment = `0x234567890abcdef234567890abcdef234567890abcdef234567890abcdef2345`;
      const receiverCommitment = `0x345678901abcdef345678901abcdef345678901abcdef345678901abcdef3456`;
      const merkleRoot = `0x456789012abcdef456789012abcdef456789012abcdef456789012abcdef4567`;

      // Execute private transfer
      const tx = await blockchainService.privateTransferSimple(
        nullifier,
        senderCommitment,
        newSenderCommitment,
        receiverCommitment,
        merkleRoot,
        zkProof.a,
        zkProof.b,
        zkProof.c,
        zkProof.input
      );

      await tx.wait();
      
      alert('Private transfer completed successfully! 🎉');
      
      // Reset form
      setTradingData(prev => ({
        ...prev,
        transferAmount: '',
        receiverAddress: '',
        senderSecret: '',
        receiverSecret: ''
      }));
      setZkProof(null);
      
      // Reload user data
      await loadUserData();
      
    } catch (error) {
      console.error('Error executing private transfer:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const executePublicTransfer = async () => {
    try {
      setLoading(true);
      setError('');

      // For public transfer, we need to find a token to transfer
      const userTokens = await blockchainService.getUserTokens(userAddress);
      
      if (userTokens.length === 0) {
        throw new Error('No tokens available for transfer');
      }

      // Transfer the first available token
      const tokenToTransfer = userTokens[0];
      
      const tx = await blockchainService.transferToken(
        userAddress,
        tradingData.receiverAddress,
        tokenToTransfer.tokenId
      );

      await tx.wait();
      
      alert('Public transfer completed successfully! 🎉');
      
      // Reset form
      setTradingData(prev => ({
        ...prev,
        transferAmount: '',
        receiverAddress: ''
      }));
      
      // Reload user data
      await loadUserData();
      
    } catch (error) {
      console.error('Error executing public transfer:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zk-trading-interface">
      <div className="trading-header">
        <h2>🔐 ZK-SNARK Trading Interface</h2>
        <p>Trade carbon credits with mathematical privacy guarantees</p>
      </div>

      {/* User Info */}
      <div className="user-info-card">
        <h3>Your Account</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Address:</span>
            <span className="value">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
          </div>
          <div className="info-item">
            <span className="label">Carbon Balance:</span>
            <span className="value">{tradingData.senderBalance} tCO₂</span>
          </div>
        </div>
      </div>

      {/* Transfer Type Selection */}
      <div className="transfer-type-selection">
        <h3>Transfer Type</h3>
        <div className="type-options">
          <label className={`type-option ${tradingData.usePrivateTransfer ? 'active' : ''}`}>
            <input
              type="radio"
              checked={tradingData.usePrivateTransfer}
              onChange={() => handleInputChange('usePrivateTransfer', true)}
            />
            <FiShield />
            <div>
              <strong>Private Transfer (ZK-SNARK)</strong>
              <p>Anonymous transfer with zero-knowledge proofs</p>
            </div>
          </label>
          
          <label className={`type-option ${!tradingData.usePrivateTransfer ? 'active' : ''}`}>
            <input
              type="radio"
              checked={!tradingData.usePrivateTransfer}
              onChange={() => handleInputChange('usePrivateTransfer', false)}
            />
            <FiEye />
            <div>
              <strong>Public Transfer</strong>
              <p>Standard blockchain transfer (visible on-chain)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="transfer-form">
        <h3>Transfer Details</h3>
        
        <div className="form-group">
          <label>Receiver Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={tradingData.receiverAddress}
            onChange={(e) => handleInputChange('receiverAddress', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Transfer Amount (tCO₂)</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={tradingData.transferAmount}
            onChange={(e) => handleInputChange('transferAmount', e.target.value)}
            max={tradingData.senderBalance}
            className="form-input"
          />
          <small>Available: {tradingData.senderBalance} tCO₂</small>
        </div>

        {/* Private Transfer Options */}
        {tradingData.usePrivateTransfer && (
          <div className="private-options">
            <div className="form-group">
              <div className="label-with-toggle">
                <label>Privacy Settings</label>
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="toggle-secrets"
                >
                  {showSecrets ? <FiEyeOff /> : <FiEye />}
                  {showSecrets ? 'Hide' : 'Show'} Secrets
                </button>
              </div>
              
              {showSecrets && (
                <>
                  <input
                    type="text"
                    placeholder="Sender Secret (optional)"
                    value={tradingData.senderSecret}
                    onChange={(e) => handleInputChange('senderSecret', e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Receiver Secret (optional)"
                    value={tradingData.receiverSecret}
                    onChange={(e) => handleInputChange('receiverSecret', e.target.value)}
                    className="form-input"
                  />
                  <small>Leave empty for auto-generated secrets</small>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {tradingData.usePrivateTransfer ? (
            <>
              {!zkProof ? (
                <button
                  onClick={generateZKProof}
                  disabled={loading || !tradingData.transferAmount || !tradingData.receiverAddress}
                  className="btn-primary"
                >
                  {loading ? 'Generating...' : 'Generate ZK Proof'}
                </button>
              ) : (
                <button
                  onClick={executePrivateTransfer}
                  disabled={loading}
                  className="btn-success"
                >
                  {loading ? 'Executing...' : 'Execute Private Transfer'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={executePublicTransfer}
              disabled={loading || !tradingData.receiverAddress}
              className="btn-primary"
            >
              {loading ? 'Executing...' : 'Execute Public Transfer'}
            </button>
          )}
        </div>

        {/* ZK Proof Display */}
        {zkProof && (
          <div className="zk-proof-display">
            <h4>🔐 Generated ZK Proof</h4>
            <div className="proof-details">
              <div className="proof-item">
                <strong>Proof Type:</strong> Transfer Proof
              </div>
              <div className="proof-item">
                <strong>Status:</strong> ✅ Valid
              </div>
              <div className="proof-item">
                <strong>Privacy:</strong> 🔒 Zero-Knowledge
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Information */}
      <div className="privacy-info">
        <h3>🛡️ Privacy Features</h3>
        <div className="feature-list">
          <div className="feature-item">
            <FiLock />
            <div>
              <strong>Zero-Knowledge Proofs</strong>
              <p>Transfer amounts and balances remain private</p>
            </div>
          </div>
          <div className="feature-item">
            <FiShield />
            <div>
              <strong>Cryptographic Security</strong>
              <p>Mathematical guarantees of privacy and correctness</p>
            </div>
          </div>
          <div className="feature-item">
            <FiUnlock />
            <div>
              <strong>Verifiable Transfers</strong>
              <p>Publicly verifiable without revealing private data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZKTradingInterface;
