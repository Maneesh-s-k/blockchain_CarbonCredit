import React, { useState } from 'react';
import { groth16 } from 'snarkjs';
import { ethers } from 'ethers';

export default function ZKProofGenerator({ onProofGenerated, isLoading, setIsLoading }) {
  const [proofData, setProofData] = useState(null);
  const [error, setError] = useState('');

  const generateCarbonCreditProof = async (energyAmount, deviceId, timestamp) => {
    try {
      setIsLoading(true);
      setError('');

      // Prepare circuit inputs
      const input = {
        energyProduced: energyAmount.toString(),
        deviceHash: ethers.keccak256(ethers.toUtf8Bytes(deviceId)),
        timestamp: timestamp.toString(),
        carbonFactor: "400", // 0.4 kg CO2 per kWh (scaled by 1000)
        deviceSecret: Math.floor(Math.random() * 1000000).toString(),
        nonce: Math.floor(Math.random() * 1000000).toString(),
        minEnergyThreshold: "1", // Minimum 1 kWh
        maxTimestamp: Math.floor(Date.now() / 1000).toString()
      };

      console.log('Generating ZK proof with inputs:', input);

      // Generate proof using snarkjs
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "/circuits/carbonCredit.wasm",
        "/circuits/carbonCredit_final.zkey"
      );

      // Format proof for Solidity
      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        input: publicSignals
      };

      setProofData(solidityProof);
      
      if (onProofGenerated) {
        onProofGenerated(solidityProof);
      }

      return solidityProof;

    } catch (error) {
      console.error('Error generating ZK proof:', error);
      setError(`Failed to generate proof: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateTransferProof = async (senderBalance, transferAmount, senderSecret) => {
    try {
      setIsLoading(true);
      setError('');

      const input = {
        senderBalance: senderBalance.toString(),
        senderSecret: senderSecret.toString(),
        transferAmount: transferAmount.toString(),
        nonce: Math.floor(Math.random() * 1000000).toString(),
        senderCommitment: ethers.keccak256(ethers.toUtf8Bytes(`${senderBalance}-${senderSecret}`)),
        receiverCommitment: ethers.keccak256(ethers.toUtf8Bytes(`${transferAmount}-${Date.now()}`)),
        nullifierHash: ethers.keccak256(ethers.toUtf8Bytes(`${senderSecret}-${Date.now()}`))
      };

      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "/circuits/transfer.wasm",
        "/circuits/transfer_final.zkey"
      );

      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        c: [proof.pi_c[0], proof.pi_c[1]],
        input: publicSignals
      };

      setProofData(solidityProof);
      return solidityProof;

    } catch (error) {
      console.error('Error generating transfer proof:', error);
      setError(`Failed to generate transfer proof: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyProof = async (proof, publicSignals) => {
    try {
      // Verify proof locally before sending to blockchain
      const vKey = await fetch("/circuits/verification_key.json").then(res => res.json());
      const isValid = await groth16.verify(vKey, publicSignals, proof);
      
      console.log('Proof verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error verifying proof:', error);
      return false;
    }
  };

  return {
    generateCarbonCreditProof,
    generateTransferProof,
    verifyProof,
    proofData,
    error,
    isLoading
  };
}
