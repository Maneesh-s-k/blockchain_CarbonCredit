const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    // Initialize provider using your Infura project
    this.provider = new ethers.JsonRpcProvider(
      `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    );
    
    // Initialize wallets with your private keys
    this.ownerWallet = new ethers.Wallet(process.env.OWNER_PVT_KEY, this.provider);
    this.deviceWallet = new ethers.Wallet(process.env.DEVICE_PVT_KEY, this.provider);
    this.generalWallet = new ethers.Wallet(process.env.GENERAL_ACCOUNT_PVT_KEY, this.provider);
    
    // Contract addresses
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.verifierContractAddress = process.env.VERIFIER_CONTRACT_ADDRESS;
  }

  // Get account balance
  async getBalance(walletType) {
    try {
      let wallet;
      switch(walletType) {
        case 'owner':
          wallet = this.ownerWallet;
          break;
        case 'device':
          wallet = this.deviceWallet;
          break;
        case 'general':
          wallet = this.generalWallet;
          break;
        default:
          wallet = this.ownerWallet;
      }
      
      const balance = await this.provider.getBalance(wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`Failed to get balance for ${walletType}:`, error);
      return "0.0";
    }
  }

  // Get transaction details
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error(`Failed to get transaction ${txHash}:`, error);
      return { hash: txHash, status: 'not found' };
    }
  }

  // Register energy device on blockchain (placeholder)
  async registerDevice(deviceData) {
    try {
      console.log('Registering device on blockchain:', deviceData);
      
      // Placeholder for actual contract interaction
      const tx = {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: '21000'
      };
      
      return tx;
    } catch (error) {
      throw new Error(`Blockchain device registration failed: ${error.message}`);
    }
  }

  // Submit energy production to blockchain (placeholder)
  async submitEnergyProduction(deviceId, energyAmount, timestamp) {
    try {
      console.log('Submitting energy production to blockchain:', {
        deviceId,
        energyAmount,
        timestamp
      });
      
      // Placeholder for actual contract interaction
      const tx = {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: '45000'
      };
      
      return tx;
    } catch (error) {
      throw new Error(`Blockchain energy submission failed: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService();
