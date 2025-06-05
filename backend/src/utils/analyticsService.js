const Device = require('../models/Device');
const Transaction = require('../models/Transaction');
const EnergyListing = require('../models/EnergyListing');
const CarbonCredit = require('../models/CarbonCredit');
const Analytics = require('../models/Analytics');
const blockchainService = require('./blockchainService');

class AnalyticsService {
  constructor() {
    this.isProcessing = false;
  }

  // Real-time data processing
  async processRealTimeData(userId, eventType, eventData) {
    try {
      switch (eventType) {
        case 'energy_produced':
          await this.updateEnergyMetrics(userId, eventData);
          break;
        case 'transaction_completed':
          await this.updateTradingMetrics(userId, eventData);
          break;
        case 'carbon_credit_earned':
          await this.updateCarbonMetrics(userId, eventData);
          break;
        case 'device_status_changed':
          await this.updateDeviceMetrics(userId, eventData);
          break;
      }
    } catch (error) {
      console.error('Real-time data processing error:', error);
    }
  }

  // Blockchain integration for analytics
  async syncBlockchainData(userId) {
    try {
      // Get user's blockchain transactions
      const userDevices = await Device.find({ owner: userId, isActive: true });
      
      for (const device of userDevices) {
        // Simulate blockchain data sync
        const blockchainData = await blockchainService.getDeviceData(device._id);
        
        if (blockchainData) {
          await this.updateEnergyMetrics(userId, {
            deviceId: device._id,
            energyAmount: blockchainData.energyProduced,
            timestamp: blockchainData.timestamp
          });
        }
      }
    } catch (error) {
      console.error('Blockchain sync error:', error);
    }
  }

  // Generate periodic analytics reports
  async generatePeriodicReports() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const users = await this.getActiveUsers();
      
      for (const user of users) {
        await this.generateUserReport(user._id, 'daily');
        
        // Generate weekly reports on Sundays
        if (new Date().getDay() === 0) {
          await this.generateUserReport(user._id, 'weekly');
        }
        
        // Generate monthly reports on the 1st
        if (new Date().getDate() === 1) {
          await this.generateUserReport(user._id, 'monthly');
        }
      }
    } catch (error) {
      console.error('Periodic report generation error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async generateUserReport(userId, type) {
    const period = this.getPeriodForType(type);
    
    const [energyMetrics, tradingMetrics, carbonMetrics, deviceMetrics] = await Promise.all([
      this.calculateEnergyMetrics(userId, period),
      this.calculateTradingMetrics(userId, period),
      this.calculateCarbonMetrics(userId, period),
      this.calculateDeviceMetrics(userId, period)
    ]);

    const analytics = new Analytics({
      user: userId,
      type,
      period,
      energyMetrics,
      tradingMetrics,
      carbonMetrics,
      deviceMetrics,
      trends: await this.calculateTrends(userId, period)
    });

    await analytics.save();
    return analytics;
  }

  // Helper methods
  getPeriodForType(type) {
    const end = new Date();
    const start = new Date();

    switch (type) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  async calculateEnergyMetrics(userId, period) {
    const devices = await Device.find({ 
      owner: userId, 
      isActive: true,
      createdAt: { $lte: period.end }
    });

    const totalProduced = devices.reduce((sum, device) => 
      sum + (device.energyProduction?.totalProduced || 0), 0);

    return {
      totalProduced,
      totalConsumed: 0, // Would be calculated from consumption data
      netProduction: totalProduced,
      efficiency: this.calculateAverageEfficiency(devices)
    };
  }

  async calculateTradingMetrics(userId, period) {
    const transactions = await Transaction.find({
      $or: [{ buyer: userId }, { seller: userId }],
      status: 'completed',
      createdAt: { $gte: period.start, $lte: period.end }
    });

    const sales = transactions.filter(tx => tx.seller.toString() === userId);
    const purchases = transactions.filter(tx => tx.buyer.toString() === userId);

    const revenue = sales.reduce((sum, tx) => sum + tx.energy.totalPrice, 0);
    const expenses = purchases.reduce((sum, tx) => sum + tx.energy.totalPrice, 0);

    return {
      totalSales: sales.reduce((sum, tx) => sum + tx.energy.amount, 0),
      totalPurchases: purchases.reduce((sum, tx) => sum + tx.energy.amount, 0),
      revenue,
      expenses,
      profit: revenue - expenses,
      averageSellingPrice: sales.length > 0 ? revenue / sales.length : 0,
      averageBuyingPrice: purchases.length > 0 ? expenses / purchases.length : 0,
      transactionCount: transactions.length
    };
  }

  async calculateCarbonMetrics(userId, period) {
    const credits = await CarbonCredit.find({
      owner: userId,
      createdAt: { $gte: period.start, $lte: period.end }
    });

    const totalCO2Offset = credits.reduce((sum, credit) => sum + credit.carbonAmount, 0);

    return {
      creditsEarned: credits.length,
      creditsTraded: credits.filter(c => c.trading.totalTraded > 0).length,
      co2Offset: totalCO2Offset,
      environmentalImpact: {
        treesEquivalent: Math.round(totalCO2Offset / 21.77),
        carsOffRoad: Math.round(totalCO2Offset / 4600)
      }
    };
  }

  async calculateDeviceMetrics(userId, period) {
    const devices = await Device.find({ 
      owner: userId, 
      isActive: true,
      createdAt: { $lte: period.end }
    });

    return {
      activeDevices: devices.filter(d => d.verification.status === 'approved').length,
      totalCapacity: devices.reduce((sum, d) => sum + d.capacity, 0),
      utilizationRate: this.calculateUtilizationRate(devices),
      maintenanceAlerts: devices.reduce((sum, d) => 
        sum + d.maintenance.maintenanceAlerts.filter(a => !a.resolved).length, 0)
    };
  }

  calculateAverageEfficiency(devices) {
    if (devices.length === 0) return 0;
    const totalEfficiency = devices.reduce((sum, device) => 
      sum + (device.energyEfficiency || 0), 0);
    return totalEfficiency / devices.length;
  }

  calculateUtilizationRate(devices) {
    if (devices.length === 0) return 0;
    // Simplified calculation - in reality, this would be more complex
    const activeDevices = devices.filter(d => d.monitoring?.isOnline).length;
    return (activeDevices / devices.length) * 100;
  }

  async getActiveUsers() {
    // Get users who have been active in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Device.distinct('owner', {
      isActive: true,
      updatedAt: { $gte: thirtyDaysAgo }
    });
  }
}

module.exports = new AnalyticsService();
