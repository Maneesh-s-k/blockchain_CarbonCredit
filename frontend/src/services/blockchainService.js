import { ethers, formatEther, parseEther, BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

// Import ABIs (copy from your blockchain/artifacts)
import CarbonCreditTokenABI from '../abis/CarbonCreditToken.json';
import MarketplaceABI from '../abis/CarbonCreditMarketplace.json';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (window.ethereum) {
        // Ethers v6: Use BrowserProvider instead of Web3Provider
        this.provider = new BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.signer = await this.provider.getSigner();
        
        // Initialize contracts
        this.contracts.carbonCreditToken = new Contract(
          CONTRACT_ADDRESSES.carbonCreditToken,
          CarbonCreditTokenABI.abi,
          this.signer
        );
        
        this.contracts.marketplace = new Contract(
          CONTRACT_ADDRESSES.marketplace,
          MarketplaceABI.abi,
          this.signer
        );

        this.isInitialized = true;
        return await this.signer.getAddress();
      } else {
        throw new Error('MetaMask not found. Please install MetaMask to continue.');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Wallet and Network Methods
  async getAccount() {
    await this.ensureInitialized();
    return await this.signer.getAddress();
  }

  async getBalance(address) {
    await this.ensureInitialized();
    const balance = await this.provider.getBalance(address);
    // Ethers v6: Use formatEther directly instead of ethers.utils.formatEther
    return formatEther(balance);
  }

  async getNetwork() {
    await this.ensureInitialized();
    return await this.provider.getNetwork();
  }

  // Carbon Credit Token Methods
  async getCarbonBalance(address) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.getCarbonBalance(address);
  }

  async getTotalSupply() {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.totalSupply();
  }

  async getCreditDetails(tokenId) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.getCreditDetails(tokenId);
  }

  async getTokenOwner(tokenId) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.ownerOf(tokenId);
  }

  async getUserTokens(userAddress) {
    await this.ensureInitialized();
    const totalSupply = await this.getTotalSupply();
    const userTokens = [];

    for (let i = 0; i < Number(totalSupply); i++) {
      try {
        const owner = await this.getTokenOwner(i);
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          const details = await this.getCreditDetails(i);
          userTokens.push({
            tokenId: i,
            carbonAmount: details.carbonAmount.toString(),
            energyAmount: details.energyAmount.toString(),
            projectHash: details.projectHash,
            timestamp: details.timestamp.toString(),
            verified: details.verified,
            retired: details.retired,
            projectType: details.projectType,
            location: details.location,
            vintage: details.vintage.toString(),
          });
        }
      } catch (error) {
        // Token might not exist or be burned
        console.warn(`Token ${i} not accessible:`, error.message);
      }
    }
    return userTokens;
  }

  async approveToken(tokenId, spender = null) {
    await this.ensureInitialized();
    const approveAddress = spender || CONTRACT_ADDRESSES.marketplace;
    return await this.contracts.carbonCreditToken.approve(approveAddress, tokenId);
  }

  async transferToken(from, to, tokenId) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.transferFrom(from, to, tokenId);
  }

  async retireCredit(tokenId, reason = "Environmental offset") {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.retireCredit(tokenId, reason);
  }

  // Marketplace Methods
  async getMarketplaceStats() {
    await this.ensureInitialized();
    return await this.contracts.marketplace.getMarketStats();
  }

  async getListing(listingId) {
    await this.ensureInitialized();
    return await this.contracts.marketplace.listings(listingId);
  }

  async getAllListings() {
    await this.ensureInitialized();
    const stats = await this.getMarketplaceStats();
    const totalListings = Number(stats[0]);
    const listings = [];

    for (let i = 0; i < totalListings; i++) {
      try {
        const listing = await this.getListing(i);
        if (listing.active) {
          // Get token details
          const tokenDetails = await this.getCreditDetails(listing.tokenId);
          
          listings.push({
            id: i,
            tokenId: listing.tokenId.toString(),
            seller: listing.seller,
            // Ethers v6: Use formatEther directly
            pricePerCredit: formatEther(listing.pricePerCredit),
            amount: listing.amount.toString(),
            projectType: listing.projectType || tokenDetails.projectType,
            active: listing.active,
            // Token details
            carbonAmount: tokenDetails.carbonAmount.toString(),
            energyAmount: tokenDetails.energyAmount.toString(),
            location: tokenDetails.location,
            verified: tokenDetails.verified,
            vintage: tokenDetails.vintage.toString(),
          });
        }
      } catch (error) {
        console.warn(`Listing ${i} not accessible:`, error.message);
      }
    }
    return listings;
  }

  async createListing(tokenId, pricePerCredit, amount) {
    await this.ensureInitialized();
    
    // First approve marketplace to handle the token
    const approveTx = await this.approveToken(tokenId);
    await approveTx.wait();
    
    // Ethers v6: Use parseEther directly instead of ethers.utils.parseEther
    const priceInWei = parseEther(pricePerCredit.toString());
    
    // Create listing
    return await this.contracts.marketplace.createListing(tokenId, priceInWei, amount);
  }

  async purchaseCredits(listingId, amount, totalPriceInEth) {
    await this.ensureInitialized();
    // Ethers v6: Use parseEther directly
    const totalPriceInWei = parseEther(totalPriceInEth.toString());
    
    return await this.contracts.marketplace.purchaseCredits(listingId, amount, {
      value: totalPriceInWei
    });
  }

  async cancelListing(listingId) {
    await this.ensureInitialized();
    return await this.contracts.marketplace.cancelListing(listingId);
  }

  // ZK-SNARK Privacy Methods
  async registerCommitment(commitment) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.registerCommitment(commitment);
  }

  async isCommitmentValid(commitment) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.isCommitmentValid(commitment);
  }

  async isNullifierUsed(nullifier) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.isNullifierUsed(nullifier);
  }

  async privateTransferSimple(
    nullifierHash,
    senderCommitment,
    newSenderCommitment,
    receiverCommitment,
    merkleRoot,
    a,
    b,
    c,
    input
  ) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.privateTransferSimple(
      nullifierHash,
      senderCommitment,
      newSenderCommitment,
      receiverCommitment,
      merkleRoot,
      a,
      b,
      c,
      input
    );
  }

  async privateTransfer(
    nullifierHash,
    senderCommitment,
    newSenderCommitment,
    receiverCommitment,
    merkleRoot,
    proof
  ) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.privateTransfer(
      nullifierHash,
      senderCommitment,
      newSenderCommitment,
      receiverCommitment,
      merkleRoot,
      proof
    );
  }

  // Minting Methods (for authorized minters)
  async mintCarbonCreditSimple(
    to,
    carbonAmount,
    energyAmount,
    projectHash,
    projectType,
    location,
    vintage,
    uri,
    a,
    b,
    c,
    input
  ) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.mintCarbonCreditSimple(
      to,
      carbonAmount,
      energyAmount,
      projectHash,
      projectType,
      location,
      vintage,
      uri,
      a,
      b,
      c,
      input
    );
  }

  async mintCarbonCredit(params, proof) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.mintCarbonCredit(params, proof);
  }

  // Authorization Methods
  async isAuthorizedMinter(address) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.authorizedMinters(address);
  }

  // Utility Methods
  async waitForTransaction(txHash) {
    await this.ensureInitialized();
    return await this.provider.waitForTransaction(txHash);
  }

  async getTransactionReceipt(txHash) {
    await this.ensureInitialized();
    return await this.provider.getTransactionReceipt(txHash);
  }

  // Event Listeners
  async listenToEvents(eventName, callback) {
    await this.ensureInitialized();
    
    if (eventName === 'CreditMinted') {
      this.contracts.carbonCreditToken.on('CreditMinted', callback);
    } else if (eventName === 'CreditRetired') {
      this.contracts.carbonCreditToken.on('CreditRetired', callback);
    } else if (eventName === 'PrivateTransfer') {
      this.contracts.carbonCreditToken.on('PrivateTransfer', callback);
    } else if (eventName === 'ListingCreated') {
      this.contracts.marketplace.on('ListingCreated', callback);
    } else if (eventName === 'CreditsPurchased') {
      this.contracts.marketplace.on('CreditsPurchased', callback);
    }
  }

  async removeAllListeners() {
    if (this.contracts.carbonCreditToken) {
      this.contracts.carbonCreditToken.removeAllListeners();
    }
    if (this.contracts.marketplace) {
      this.contracts.marketplace.removeAllListeners();
    }
  }

  // Error Handling
  handleError(error) {
    console.error('Blockchain service error:', error);
    
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    } else if (error.code === -32603) {
      throw new Error('Internal JSON-RPC error');
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction');
    } else if (error.message.includes('user rejected')) {
      throw new Error('Transaction rejected by user');
    } else {
      throw new Error(error.message || 'Unknown blockchain error');
    }
  }
}

// Create singleton instance
export const blockchainService = new BlockchainService();

// Export class for testing
export default BlockchainService;
