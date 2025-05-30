import React, { useState, useCallback } from 'react';
import { groth16 } from 'snarkjs';
import { ethers } from 'ethers';

const ZKProofGenerator = ({ onProofGenerated, isLoading, setIsLoading }) => {
  const [proofData, setProofData] = useState(null);
  const [error, setError] = useState('');
  const [proofType, setProofType] = useState('carbonCredit');
  const [verificationResult, setVerificationResult] = useState(null);

  // Clear error when starting new operations
  const clearError = useCallback(() => {
    setError('');
    setVerificationResult(null);
  }, []);

  const generateCarbonCreditProof = async (energyAmount, deviceId, timestamp) => {
    try {
      setIsLoading(true);
      clearError();

      // Validate inputs
      if (!energyAmount || energyAmount <= 0) {
        throw new Error('Energy amount must be greater than 0');
      }
      if (!deviceId) {
        throw new Error('Device ID is required');
      }

      // Prepare circuit inputs matching your carbonCreditWorking circuit
      const input = {
        energyProduced: energyAmount.toString(),
        deviceSecret: Math.floor(Math.random() * 1000000).toString(),
        timestamp: (timestamp || Math.floor(Date.now() / 1000)).toString(),
        nonce: Math.floor(Math.random() * 1000000).toString(),
        minEnergyThreshold: "100", // Minimum 100 kWh
        maxTimestamp: Math.floor(Date.now() / 1000 + 3600).toString(), // 1 hour from now
        carbonFactor: "400" // 0.4 kg CO2 per kWh (scaled by 1000)
      };

      console.log('Generating ZK proof with inputs:', input);

      // Generate proof using snarkjs with your actual circuit files
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "/circuits/carbonCreditWorking_js/carbonCreditWorking.wasm",
        "/circuits/carbonCreditWorking_final.zkey"
      );

      // Format proof for Solidity
      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        input: publicSignals
      };

      setProofData(solidityProof);
      setProofType('carbonCredit');
      
      if (onProofGenerated) {
        onProofGenerated(solidityProof, 'carbonCredit');
      }

      console.log('✅ Carbon credit proof generated successfully');
      return solidityProof;

    } catch (error) {
      console.error('Error generating ZK proof:', error);
      const errorMessage = error.message.includes('fetch') 
        ? 'Circuit files not found. Make sure circuit files are in public/circuits/ directory.'
        : `Failed to generate proof: ${error.message}`;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateTransferProof = async (senderBalance, transferAmount, senderSecret, receiverSecret) => {
    try {
      setIsLoading(true);
      clearError();

      // Validate inputs
      if (!senderBalance || senderBalance <= 0) {
        throw new Error('Sender balance must be greater than 0');
      }
      if (!transferAmount || transferAmount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }
      if (transferAmount > senderBalance) {
        throw new Error('Transfer amount cannot exceed sender balance');
      }

      const nonce = Math.floor(Math.random() * 1000000);
      
      // Prepare circuit inputs matching your transfer circuit
      const input = {
        senderBalance: senderBalance.toString(),
        senderSecret: (senderSecret || Math.floor(Math.random() * 1000000)).toString(),
        transferAmount: transferAmount.toString(),
        receiverSecret: (receiverSecret || Math.floor(Math.random() * 1000000)).toString(),
        nonce: nonce.toString(),
        nullifierHash: "0", // Will be calculated in circuit
        senderCommitment: "0", // Will be calculated in circuit
        newSenderCommitment: "0", // Will be calculated in circuit
        receiverCommitment: "0", // Will be calculated in circuit
        merkleRoot: "0" // Placeholder for merkle root
      };

      console.log('Generating transfer proof with inputs:', input);

      // Generate proof using your transfer circuit
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "/circuits/transfer_js/transfer.wasm",
        "/circuits/transfer_final.zkey"
      );

      // Format proof for Solidity
      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        input: publicSignals
      };

      setProofData(solidityProof);
      setProofType('transfer');

      if (onProofGenerated) {
        onProofGenerated(solidityProof, 'transfer');
      }

      console.log('✅ Transfer proof generated successfully');
      return solidityProof;

    } catch (error) {
      console.error('Error generating transfer proof:', error);
      const errorMessage = error.message.includes('fetch') 
        ? 'Transfer circuit files not found. Make sure transfer circuit files are in public/circuits/ directory.'
        : `Failed to generate transfer proof: ${error.message}`;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockProof = (type = 'carbonCredit') => {
    const mockProof = {
      a: ["1", "2"],
      b: [["1", "2"], ["3", "4"]],
      c: ["5", "6"],
      input: type === 'carbonCredit' ? ["1000", "1"] : ["1", "0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd"]
    };

    setProofData(mockProof);
    setProofType(type);
    
    if (onProofGenerated) {
      onProofGenerated(mockProof, type);
    }

    return mockProof;
  };

  const verifyProof = async (proof, publicSignals, circuitType = 'carbonCredit') => {
    try {
      clearError();
      
      // Load verification key based on circuit type
      const vKeyPath = circuitType === 'carbonCredit' 
        ? "/circuits/carbonCreditWorking_verification_key.json"
        : "/circuits/transfer_verification_key.json";
        
      const vKey = await fetch(vKeyPath).then(res => {
        if (!res.ok) {
          throw new Error(`Verification key not found: ${vKeyPath}`);
        }
        return res.json();
      });
      
      const isValid = await groth16.verify(vKey, publicSignals, proof);
      
      setVerificationResult(isValid);
      console.log(`Proof verification result (${circuitType}):`, isValid);
      return isValid;
      
    } catch (error) {
      console.error('Error verifying proof:', error);
      setError(`Verification failed: ${error.message}`);
      setVerificationResult(false);
      return false;
    }
  };

  const formatProofForDisplay = (proof) => {
    if (!proof) return null;
    
    return {
      a: `[${proof.a[0].slice(0, 10)}..., ${proof.a[1].slice(0, 10)}...]`,
      b: `[[${proof.b[0][0].slice(0, 8)}..., ${proof.b[0][1].slice(0, 8)}...], [${proof.b[1][0].slice(0, 8)}..., ${proof.b[1][1].slice(0, 8)}...]]`,
      c: `[${proof.c[0].slice(0, 10)}..., ${proof.c[1].slice(0, 10)}...]`,
      publicSignals: proof.input ? proof.input.join(', ') : 'N/A'
    };
  };

  // Component UI
  return (
    <div className="zk-proof-generator">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔐 ZK-SNARK Proof Generator
        </h3>

        {/* Status Display */}
        <div className="mb-4">
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Generating ZK proof...
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {verificationResult !== null && (
            <div className={`border rounded-md p-3 ${
              verificationResult 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <strong>Verification:</strong> {verificationResult ? '✅ Valid' : '❌ Invalid'}
            </div>
          )}
        </div>

        {/* Proof Data Display */}
        {proofData && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Generated Proof ({proofType}):
            </h4>
            <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
              <div className="space-y-1">
                <div><strong>a:</strong> {formatProofForDisplay(proofData).a}</div>
                <div><strong>b:</strong> {formatProofForDisplay(proofData).b}</div>
                <div><strong>c:</strong> {formatProofForDisplay(proofData).c}</div>
                <div><strong>Public Signals:</strong> {formatProofForDisplay(proofData).publicSignals}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => generateMockProof('carbonCredit')}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Generate Mock Carbon Proof
          </button>
          
          <button
            onClick={() => generateMockProof('transfer')}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Generate Mock Transfer Proof
          </button>
          
          {proofData && (
            <button
              onClick={() => verifyProof(
                { pi_a: proofData.a, pi_b: proofData.b, pi_c: proofData.c },
                proofData.input,
                proofType
              )}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Verify Proof
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Note:</strong> For real ZK proof generation, ensure circuit files are available in the public/circuits/ directory:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>carbonCreditWorking_js/carbonCreditWorking.wasm</li>
            <li>carbonCreditWorking_final.zkey</li>
            <li>carbonCreditWorking_verification_key.json</li>
            <li>transfer_js/transfer.wasm</li>
            <li>transfer_final.zkey</li>
            <li>transfer_verification_key.json</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Hook version for use in other components
export const useZKProofGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const zkProofGenerator = ZKProofGenerator({ 
    isLoading, 
    setIsLoading 
  });

  return {
    ...zkProofGenerator,
    isLoading,
    setIsLoading
  };
};

export default ZKProofGenerator;
