const { ethers } = require('ethers');
const { groth16 } = require('snarkjs');

// Carbon Credit Smart Contract ABI
const CARBON_CREDIT_ABI = [
  "function mintCarbonCredit(address to, uint256 amount, bytes32 projectHash, uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[] memory input) public",
  "function transferCredit(address to, uint256 amount, uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[] memory input) public",
  "function verifyCredit(uint256 creditId) public view returns (bool)",
  "function getCreditBalance(address owner) public view returns (uint256)",
  "function getCreditDetails(uint256 creditId) public view returns (tuple(uint256 amount, bytes32 projectHash, uint256 timestamp, bool verified))",
  "event CreditMinted(address indexed to, uint256 amount, uint256 creditId)",
  "event CreditTransferred(address indexed from, address indexed to, uint256 amount)",
  "event CreditVerified(uint256 indexed creditId, bool verified)"
];

class CarbonCreditBlockchain {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.CARBON_CREDIT_CONTRACT_ADDRESS,
      CARBON_CREDIT_ABI,
      this.wallet
    );
  }

  // Generate ZK proof for carbon credit verification
  async generateCarbonCreditProof(energyAmount, deviceId, timestamp) {
    try {
      // Input for ZK circuit
      const input = {
        energyProduced: energyAmount,
        deviceHash: ethers.keccak256(ethers.toUtf8Bytes(deviceId)),
        timestamp: timestamp,
        carbonFactor: 0.4, // kg CO2 per kWh (example)
        secret: Math.floor(Math.random() * 1000000) // Private witness
      };

      // Generate proof using snarkjs
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "./circuits/carbonCredit.wasm",
        "./circuits/carbonCredit_final.zkey"
      );

      return {
        proof: {
          a: [proof.pi_a[0], proof.pi_a[1]],
          b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
          c: [proof.pi_c[0], proof.pi_c[1]]
        },
        publicSignals
      };
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      throw error;
    }
  }

  // Mint carbon credits with ZK proof
  async mintCarbonCredit(userAddress, energyAmount, deviceId) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const { proof, publicSignals } = await this.generateCarbonCreditProof(
        energyAmount, 
        deviceId, 
        timestamp
      );

      const projectHash = ethers.keccak256(ethers.toUtf8Bytes(`${deviceId}-${timestamp}`));
      const carbonAmount = Math.floor(energyAmount * 0.4); // Convert kWh to kg CO2

      const tx = await this.contract.mintCarbonCredit(
        userAddress,
        carbonAmount,
        projectHash,
        proof.a,
        proof.b,
        proof.c,
        publicSignals
      );

      await tx.wait();
      return {
        success: true,
        transactionHash: tx.hash,
        carbonCredits: carbonAmount,
        energyAmount
      };
    } catch (error) {
      console.error('Error minting carbon credit:', error);
      throw error;
    }
  }

  // Transfer carbon credits with privacy
  async transferCarbonCredit(fromAddress, toAddress, amount) {
    try {
      const { proof, publicSignals } = await this.generateTransferProof(
        fromAddress,
        toAddress,
        amount
      );

      const tx = await this.contract.transferCredit(
        toAddress,
        amount,
        proof.a,
        proof.b,
        proof.c,
        publicSignals
      );

      await tx.wait();
      return {
        success: true,
        transactionHash: tx.hash,
        amount
      };
    } catch (error) {
      console.error('Error transferring carbon credit:', error);
      throw error;
    }
  }

  // Get carbon credit balance
  async getCarbonCreditBalance(userAddress) {
    try {
      const balance = await this.contract.getCreditBalance(userAddress);
      return ethers.formatUnits(balance, 0);
    } catch (error) {
      console.error('Error getting carbon credit balance:', error);
      throw error;
    }
  }

  // Verify carbon credit authenticity
  async verifyCarbonCredit(creditId) {
    try {
      const isVerified = await this.contract.verifyCredit(creditId);
      const details = await this.contract.getCreditDetails(creditId);
      
      return {
        verified: isVerified,
        amount: ethers.formatUnits(details.amount, 0),
        projectHash: details.projectHash,
        timestamp: Number(details.timestamp),
        blockchainVerified: details.verified
      };
    } catch (error) {
      console.error('Error verifying carbon credit:', error);
      throw error;
    }
  }

  // Generate ZK proof for private transfer
  async generateTransferProof(fromAddress, toAddress, amount) {
    try {
      const input = {
        fromBalance: await this.getCarbonCreditBalance(fromAddress),
        transferAmount: amount,
        fromAddressHash: ethers.keccak256(fromAddress),
        toAddressHash: ethers.keccak256(toAddress),
        nonce: Math.floor(Math.random() * 1000000)
      };

      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "./circuits/transfer.wasm",
        "./circuits/transfer_final.zkey"
      );

      return {
        proof: {
          a: [proof.pi_a[0], proof.pi_a[1]],
          b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
          c: [proof.pi_c[0], proof.pi_c[1]]
        },
        publicSignals
      };
    } catch (error) {
      console.error('Error generating transfer proof:', error);
      throw error;
    }
  }
}

module.exports = CarbonCreditBlockchain;
