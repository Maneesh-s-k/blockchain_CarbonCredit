const { ethers } = require('ethers');
const { blockchainService } = require('../services/blockchainService');
const Device = require('../models/Device');
const EnergyListing = require('../models/EnergyListing');
const { generateCarbonCreditProof } = require('../utils/zkProofGenerator');

// Register new energy device on blockchain
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, capacity, deviceType, location } = req.body;
    
    // Register on blockchain
    const tx = await blockchainService.carbonCreditToken.registerDevice(
      deviceId,
      await blockchainService.signer.getAddress(),
      ethers.utils.parseUnits(capacity.toString(), 18), // Convert to wei
      deviceType,
      JSON.stringify(location)
    );
    
    await tx.wait();

    // Save to database
    const newDevice = new Device({
      ...req.body,
      owner: req.user.id,
      blockchainTx: tx.hash
    });
    
    await newDevice.save();

    res.status(201).json({
      success: true,
      message: 'Device registered on blockchain',
      txHash: tx.hash,
      device: newDevice
    });

  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({
      success: false,
      message: error.reason || 'Device registration failed'
    });
  }
};

// Submit energy production and mint carbon credits
exports.submitEnergyProduction = async (req, res) => {
  try {
    const { deviceId, energyAmount, timestamp } = req.body;
    
    // Generate ZK proof
    const { proof, publicSignals } = await generateCarbonCreditProof(
      energyAmount,
      deviceId,
      timestamp || Date.now()
    );

    // Mint carbon credits on blockchain
    const tx = await blockchainService.carbonCreditToken.mintCarbonCredit(
      await blockchainService.signer.getAddress(),
      ethers.utils.parseUnits(energyAmount.toString(), 18),
      deviceId,
      proof.a,
      proof.b,
      proof.c,
      publicSignals
    );

    await tx.wait();

    // Save energy production record
    const productionRecord = new EnergyListing({
      device: deviceId,
      energyAmount,
      timestamp,
      owner: req.user.id,
      blockchainTx: tx.hash
    });

    await productionRecord.save();

    res.status(201).json({
      success: true,
      message: 'Energy production recorded and carbon credits minted',
      txHash: tx.hash,
      creditsMinted: energyAmount
    });

  } catch (error) {
    console.error('Energy submission error:', error);
    res.status(500).json({
      success: false,
      message: error.reason || 'Energy submission failed'
    });
  }
};

// Get device energy data from blockchain
exports.getDeviceEnergyData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get on-chain data
    const [totalProduced, creditsMinted] = await Promise.all([
      blockchainService.carbonCreditToken.getTotalEnergyProduced(deviceId),
      blockchainService.carbonCreditToken.getTotalCreditsMinted(deviceId)
    ]);

    res.json({
      success: true,
      data: {
        totalEnergy: ethers.utils.formatUnits(totalProduced, 18),
        totalCredits: ethers.utils.formatUnits(creditsMinted, 18)
      }
    });

  } catch (error) {
    console.error('Energy data fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.reason || 'Failed to fetch energy data'
    });
  }
};

// Get all registered devices with blockchain data
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find({ owner: req.user.id })
      .populate('owner', 'username email')
      .lean();

    // Add blockchain data
    const devicesWithBlockchainData = await Promise.all(
      devices.map(async device => {
        const onChainData = await blockchainService.carbonCreditToken.getDeviceInfo(device.deviceId);
        return {
          ...device,
          blockchain: {
            registered: onChainData.registered,
            totalEnergy: ethers.utils.formatUnits(onChainData.totalEnergyProduced, 18),
            active: onChainData.isActive
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: devicesWithBlockchainData.length,
      devices: devicesWithBlockchainData
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: error.reason || 'Failed to get devices'
    });
  }
};
