import { ethers, formatEther, parseEther, BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../config/contracts';

// Import ABIs (copy from your blockchain/artifacts)
import CarbonCreditTokenABI from '../abis/CarbonCreditToken.json';
import MarketplaceABI from '../abis/CarbonCreditMarketplace.json';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
    this.carbonToken = null;
    this.marketplace = null;
  }

  async initialize() {
    try {
      if (window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.signer = await this.provider.getSigner();
        
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

        this.carbonToken = this.contracts.carbonCreditToken;
        this.marketplace = this.contracts.marketplace;

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

  async getAccount() {
    await this.ensureInitialized();
    return await this.signer.getAddress();
  }

  async getBalance(address) {
    await this.ensureInitialized();
    const balance = await this.provider.getBalance(address);
    return formatEther(balance);
  }

  async getNetwork() {
    await this.ensureInitialized();
    return await this.provider.getNetwork();
  }

  async getCarbonBalance(address) {
    try {
      await this.ensureInitialized();
      const balance = await this.contracts.carbonCreditToken.getCarbonBalance(address);
      return balance.toString();
    } catch (error) {
      console.error('Error getting carbon balance:', error);
      return '0';
    }
  }

  async getTotalSupply() {
    try {
      await this.ensureInitialized();
      return await this.contracts.carbonCreditToken.totalSupply();
    } catch (error) {
      console.error('Error getting total supply:', error);
      return 0;
    }
  }

  async getCreditDetails(tokenId) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.getCreditDetails(tokenId);
  }

  async getTokenOwner(tokenId) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.ownerOf(tokenId);
  }

  // COMPLETELY NEW APPROACH: Get all Transfer events to track existing tokens
  async getExistingTokens() {
    try {
      await this.ensureInitialized();
      
      // Get all Transfer events from the contract
      const transferFilter = this.contracts.carbonCreditToken.filters.Transfer();
      const events = await this.contracts.carbonCreditToken.queryFilter(transferFilter, 0, 'latest');
      
      const existingTokens = new Set();
      const burnedTokens = new Set();
      
      // Process all transfer events
      for (const event of events) {
        const { from, to, tokenId } = event.args;
        const tokenIdNum = Number(tokenId);
        
        // If from is zero address, it's a mint
        if (from === '0x0000000000000000000000000000000000000000') {
          existingTokens.add(tokenIdNum);
        }
        
        // If to is zero address, it's a burn/retirement
        if (to === '0x0000000000000000000000000000000000000000') {
          burnedTokens.add(tokenIdNum);
          existingTokens.delete(tokenIdNum);
        }
      }
      
      return Array.from(existingTokens);
    } catch (error) {
      console.error('Error getting existing tokens:', error);
      return [];
    }
  }

  // FIXED: getUserTokens method using event-based approach
  async getUserTokens(userAddress) {
    try {
      await this.ensureInitialized();
      const userTokens = [];
      
      // Get all existing tokens without calling ownerOf on burned tokens
      const existingTokens = await this.getExistingTokens();
      
      if (existingTokens.length === 0) {
        console.log('No tokens exist');
        return [];
      }

      console.log(`Checking ${existingTokens.length} existing tokens for user ${userAddress}`);
      
      // Only check tokens that we know exist
      for (const tokenId of existingTokens) {
        try {
          const owner = await this.getTokenOwner(tokenId);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const details = await this.getCreditDetails(tokenId);
            userTokens.push({
              tokenId: tokenId,
              carbonAmount: details.carbonAmount.toString(),
              energyAmount: details.energyAmount.toString(),
              projectHash: details.projectHash,
              timestamp: details.timestamp.toString(),
              verified: details.verified,
              retired: details.retired,
              projectType: details.projectType,
              location: details.location,
              vintage: details.vintage.toString(),
              isListed: false
            });
          }
        } catch (error) {
          console.warn(`Error checking token ${tokenId}:`, error.message);
          continue;
        }
      }
      
      console.log(`Found ${userTokens.length} tokens for user ${userAddress}`);
      return userTokens;
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
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

  async getMarketplaceStats() {
    try {
      await this.ensureInitialized();
      const stats = await this.contracts.marketplace.getMarketStats();
      return [
        stats[0].toString(),
        stats[1].toString(),
        formatEther(stats[2])
      ];
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      return ['0', '0', '0'];
    }
  }

  async getListing(listingId) {
    await this.ensureInitialized();
    return await this.contracts.marketplace.listings(listingId);
  }

  async getAllListings() {
    try {
      await this.ensureInitialized();
      const stats = await this.getMarketplaceStats();
      const totalListings = Number(stats[0]);
      const listings = [];

      if (totalListings === 0) {
        return [];
      }

      // Get existing tokens to avoid checking burned tokens
      const existingTokens = await this.getExistingTokens();
      const existingTokensSet = new Set(existingTokens);

      for (let i = 0; i < totalListings; i++) {
        try {
          const listing = await this.getListing(i);
          if (listing.active) {
            const tokenId = Number(listing.tokenId);
            
            // Only process listings for tokens that still exist
            if (!existingTokensSet.has(tokenId)) {
              console.log(`Listing ${i} references non-existent token ${tokenId}`);
              continue;
            }

            const tokenDetails = await this.getCreditDetails(listing.tokenId);
            
            listings.push({
              id: i,
              tokenId: listing.tokenId.toString(),
              seller: listing.seller,
              pricePerCredit: formatEther(listing.pricePerCredit),
              amount: listing.amount.toString(),
              projectType: listing.projectType || tokenDetails.projectType,
              active: listing.active,
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
    } catch (error) {
      console.error('Error getting all listings:', error);
      return [];
    }
  }

  async getMarketplaceListings() {
    try {
      const listings = await this.getAllListings();
      return listings.map(listing => ({
        tokenId: listing.tokenId,
        price: listing.pricePerCredit,
        energyAmount: listing.energyAmount,
        carbonAmount: listing.carbonAmount,
        energyType: listing.projectType,
        location: listing.location,
        verifier: 'GreenCert',
        seller: listing.seller,
        isActive: listing.active,
        timestamp: Math.floor(Date.now() / 1000).toString()
      }));
    } catch (error) {
      console.error('Error getting marketplace listings:', error);
      return [];
    }
  }

  async purchaseCredit(tokenId, price) {
    try {
      await this.ensureInitialized();
      
      const listings = await this.getAllListings();
      const listing = listings.find(l => l.tokenId === tokenId.toString());
      
      if (!listing) {
        throw new Error('Listing not found');
      }
      
      const priceInWei = parseEther(price.toString());
      
      const tx = await this.contracts.marketplace.purchaseCredits(listing.id, 1, {
        value: priceInWei,
        gasLimit: 300000
      });
      
      return tx;
    } catch (error) {
      console.error('Error purchasing credit:', error);
      throw this.handleError(error);
    }
  }

  async listCreditForSale(tokenId, price) {
    try {
      await this.ensureInitialized();
      
      const priceInWei = parseEther(price.toString());
      
      const approveTx = await this.approveToken(tokenId);
      await approveTx.wait();
      
      const tx = await this.contracts.marketplace.createListing(tokenId, priceInWei, 1, {
        gasLimit: 300000
      });
      
      return tx;
    } catch (error) {
      console.error('Error listing credit:', error);
      throw this.handleError(error);
    }
  }

  async cancelListing(tokenId) {
    try {
      await this.ensureInitialized();
      
      const listings = await this.getAllListings();
      const listing = listings.find(l => l.tokenId === tokenId.toString());
      
      if (!listing) {
        throw new Error('Listing not found');
      }
      
      const tx = await this.contracts.marketplace.cancelListing(listing.id, {
        gasLimit: 200000
      });
      
      return tx;
    } catch (error) {
      console.error('Error cancelling listing:', error);
      throw this.handleError(error);
    }
  }

  async createListing(tokenId, pricePerCredit, amount) {
    await this.ensureInitialized();
    
    const approveTx = await this.approveToken(tokenId);
    await approveTx.wait();
    
    const priceInWei = parseEther(pricePerCredit.toString());
    
    return await this.contracts.marketplace.createListing(tokenId, priceInWei, amount);
  }

  async purchaseCredits(listingId, amount, totalPriceInEth) {
    await this.ensureInitialized();
    const totalPriceInWei = parseEther(totalPriceInEth.toString());
    
    return await this.contracts.marketplace.purchaseCredits(listingId, amount, {
      value: totalPriceInWei
    });
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

  // Minting Methods
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

  async isAuthorizedMinter(address) {
    await this.ensureInitialized();
    return await this.contracts.carbonCreditToken.authorizedMinters(address);
  }

  async waitForTransaction(txHash) {
    await this.ensureInitialized();
    return await this.provider.waitForTransaction(txHash);
  }

  async getTransactionReceipt(txHash) {
    await this.ensureInitialized();
    return await this.provider.getTransactionReceipt(txHash);
  }

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

  async registerDevice(deviceData, proof) {
    try {
      await this.ensureInitialized();
      
      const tx = await this.mintCarbonCreditSimple(
        deviceData.owner,
        deviceData.carbonAmount,
        deviceData.energyAmount,
        deviceData.projectHash,
        deviceData.projectType,
        deviceData.location,
        deviceData.vintage,
        deviceData.uri,
        proof.a,
        proof.b,
        proof.c,
        proof.input
      );
      
      return tx;
    } catch (error) {
      console.error('Error registering device:', error);
      throw this.handleError(error);
    }
  }

  async createEnergyListing(energyData) {
    try {
      await this.ensureInitialized();
      
      const priceInWei = parseEther(energyData.price.toString());
      
      const tx = await this.contracts.marketplace.createListing(
        energyData.tokenId,
        priceInWei,
        energyData.amount,
        {
          gasLimit: 300000
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Error creating energy listing:', error);
      throw this.handleError(error);
    }
  }

  async purchaseEnergy(listingId, amount, totalPrice) {
    try {
      await this.ensureInitialized();
      
      const priceInWei = parseEther(totalPrice.toString());
      
      const tx = await this.contracts.marketplace.purchaseCredits(listingId, amount, {
        value: priceInWei,
        gasLimit: 300000
      });
      
      return tx;
    } catch (error) {
      console.error('Error purchasing energy:', error);
      throw this.handleError(error);
    }
  }

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
    } else if (error.message.includes('Contract not deployed')) {
      throw new Error('Contract not deployed. Please start Hardhat node and deploy contracts.');
    } else if (error.message.includes('Wrong network')) {
      throw new Error('Wrong network. Please switch to Hardhat local network.');
    } else {
      throw new Error(error.message || 'Unknown blockchain error');
    }
  }

  async switchToCorrectNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
            chainName: NETWORK_CONFIG.name,
            rpcUrls: [NETWORK_CONFIG.rpcUrl],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
          }],
        });
      } else {
        throw error;
      }
    }
  }

  async estimateGas(method, params) {
    try {
      await this.ensureInitialized();
      return await method.estimateGas(...params);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return 300000;
    }
  }

  async getTransactionStatus(txHash) {
    try {
      await this.ensureInitialized();
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (receipt) {
        return {
          status: receipt.status === 1 ? 'success' : 'failed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          transactionHash: receipt.transactionHash
        };
      } else {
        return { status: 'pending' };
      }
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return { status: 'error', error: error.message };
    }
  }
}

export const blockchainService = new BlockchainService();
export default BlockchainService;
