const WebSocket = require('ws');
const Device = require('../models/Device');
const Transaction = require('../models/Transaction');
const EnergyListing = require('../models/EnergyListing');
const analyticsService = require('./analyticsService');

class RealtimeService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.dataStreams = new Map();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws,
        userId: null,
        subscriptions: new Set()
      });

      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });
    });

    // Start real-time data streams
    this.startMarketDataStream();
    this.startEnergyProductionStream();
    this.startTradingStream();
  }

  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(clientId);
      
      if (!client) return;

      switch (data.type) {
        case 'auth':
          client.userId = data.userId;
          this.sendToClient(clientId, {
            type: 'auth_success',
            message: 'Authenticated successfully'
          });
          break;

        case 'subscribe':
          data.channels.forEach(channel => {
            client.subscriptions.add(channel);
          });
          this.sendToClient(clientId, {
            type: 'subscription_success',
            channels: data.channels
          });
          break;

        case 'unsubscribe':
          data.channels.forEach(channel => {
            client.subscriptions.delete(channel);
          });
          break;

        case 'request_data':
          this.handleDataRequest(clientId, data);
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  async handleDataRequest(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    try {
      let responseData = {};

      switch (data.request) {
        case 'dashboard_metrics':
          responseData = await this.getDashboardMetrics(client.userId);
          break;
        case 'market_data':
          responseData = await this.getMarketData();
          break;
        case 'device_status':
          responseData = await this.getDeviceStatus(client.userId);
          break;
      }

      this.sendToClient(clientId, {
        type: 'data_response',
        request: data.request,
        data: responseData
      });
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Failed to fetch requested data'
      });
    }
  }

  startMarketDataStream() {
    setInterval(async () => {
      try {
        const marketData = await this.generateMarketData();
        this.broadcast('market_data', marketData, 'market_stream');
      } catch (error) {
        console.error('Market data stream error:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  startEnergyProductionStream() {
    setInterval(async () => {
      try {
        const productionData = await this.generateEnergyProductionData();
        this.broadcast('energy_production', productionData, 'energy_stream');
      } catch (error) {
        console.error('Energy production stream error:', error);
      }
    }, 10000); // Update every 10 seconds
  }

  startTradingStream() {
    setInterval(async () => {
      try {
        const tradingData = await this.generateTradingData();
        this.broadcast('trading_update', tradingData, 'trading_stream');
      } catch (error) {
        console.error('Trading stream error:', error);
      }
    }, 3000); // Update every 3 seconds
  }

  async generateMarketData() {
    const [activeListings, recentTransactions] = await Promise.all([
      EnergyListing.countDocuments({ status: 'active' }),
      Transaction.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('energy.pricePerKwh energy.amount createdAt')
    ]);

    // Calculate current market price (simplified)
    const currentPrice = recentTransactions.length > 0 
      ? recentTransactions.reduce((sum, tx) => sum + tx.energy.pricePerKwh, 0) / recentTransactions.length
      : 0.15;

    return {
      timestamp: new Date(),
      currentPrice: Number(currentPrice.toFixed(4)),
      priceChange24h: (Math.random() - 0.5) * 0.02, // ±1% random change
      volume24h: Math.floor(Math.random() * 10000) + 5000,
      activeListings,
      marketTrend: Math.random() > 0.5 ? 'up' : 'down',
      topEnergyTypes: [
        { type: 'solar', percentage: 45.2 },
        { type: 'wind', percentage: 32.8 },
        { type: 'hydro', percentage: 15.6 },
        { type: 'geothermal', percentage: 6.4 }
      ]
    };
  }

  async generateEnergyProductionData() {
    const devices = await Device.find({ 
      isActive: true,
      'verification.status': 'approved'
    }).select('deviceType capacity energyProduction');

    const productionByType = devices.reduce((acc, device) => {
      if (!acc[device.deviceType]) {
        acc[device.deviceType] = { capacity: 0, production: 0, count: 0 };
      }
      acc[device.deviceType].capacity += device.capacity;
      acc[device.deviceType].production += device.energyProduction?.totalProduced || 0;
      acc[device.deviceType].count += 1;
      return acc;
    }, {});

    return {
      timestamp: new Date(),
      totalDevices: devices.length,
      totalCapacity: devices.reduce((sum, d) => sum + d.capacity, 0),
      currentProduction: Math.floor(Math.random() * 5000) + 2000, // Simulated current production
      productionByType,
      efficiency: 85 + Math.random() * 10, // 85-95% efficiency
      gridLoad: 70 + Math.random() * 20 // 70-90% grid load
    };
  }

  async generateTradingData() {
    const recentTransactions = await Transaction.find({
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).select('energy.amount energy.totalPrice createdAt');

    const volume24h = recentTransactions.reduce((sum, tx) => sum + tx.energy.amount, 0);
    const value24h = recentTransactions.reduce((sum, tx) => sum + tx.energy.totalPrice, 0);

    return {
      timestamp: new Date(),
      volume24h: Math.round(volume24h * 100) / 100,
      value24h: Math.round(value24h * 100) / 100,
      transactionCount24h: recentTransactions.length,
      averageTransactionSize: recentTransactions.length > 0 
        ? volume24h / recentTransactions.length : 0,
      priceVolatility: Math.random() * 0.1, // 0-10% volatility
      marketSentiment: Math.random() > 0.5 ? 'bullish' : 'bearish'
    };
  }

  broadcast(type, data, channel = null) {
    const message = JSON.stringify({ type, data, timestamp: new Date() });
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!channel || client.subscriptions.has(channel)) {
          client.ws.send(message);
        }
      }
    });
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  sendToUser(userId, data) {
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }

  generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9);
  }

  // Notify specific events
  notifyEnergyProduced(userId, deviceId, amount) {
    this.sendToUser(userId, {
      type: 'energy_produced',
      data: { deviceId, amount, timestamp: new Date() }
    });
  }

  notifyTradeCompleted(buyerId, sellerId, transactionData) {
    [buyerId, sellerId].forEach(userId => {
      this.sendToUser(userId, {
        type: 'trade_completed',
        data: transactionData
      });
    });
  }

  notifyPriceAlert(userId, alertData) {
    this.sendToUser(userId, {
      type: 'price_alert',
      data: alertData
    });
  }
}

module.exports = new RealtimeService();
