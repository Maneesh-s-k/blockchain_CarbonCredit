const express = require('express');
const router = express.Router();
const blockchainService = require('../utils/blockchainService');

// Get blockchain status
router.get('/status', async (req, res) => {
  try {
    const ownerBalance = await blockchainService.getBalance('owner');
    const deviceBalance = await blockchainService.getBalance('device');
    const generalBalance = await blockchainService.getBalance('general');

    res.status(200).json({
      success: true,
      blockchain: {
        network: 'Sepolia',
        contractAddress: process.env.CONTRACT_ADDRESS,
        verifierContract: process.env.VERIFIER_CONTRACT_ADDRESS,
        wallets: {
          owner: { balance: ownerBalance },
          device: { balance: deviceBalance },
          general: { balance: generalBalance }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

// Get transaction details
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const transaction = await blockchainService.getTransaction(txHash);

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
      error: error.message
    });
  }
});

module.exports = router;
