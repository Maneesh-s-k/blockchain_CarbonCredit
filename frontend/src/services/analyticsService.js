import { apiService } from './apiService';

class AnalyticsService {
  constructor() {
    this.wsConnection = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Dashboard Analytics
  async getDashboardAnalytics(timeframe = '30d') {
    try {
      const response = await apiService.get(`/analytics/dashboard?timeframe=${timeframe}`);
      return response;
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return {
        success: false,
        error: error.message,
        data: this.getFallbackDashboardData()
      };
    }
  }

  // Trading Analytics
  async getTradingAnalytics(timeframe = '30d') {
    try {
      const response = await apiService.get(`/analytics/trading?timeframe=${timeframe}`);
      return response;
    } catch (error) {
      console.error('Trading analytics error:', error);
      return {
        success: false,
        error: error.message,
        data: this.getFallbackTradingData()
      };
    }
  }

  // Device Analytics
  async getDeviceAnalytics(deviceId = null, timeframe = '30d') {
    try {
      const endpoint = deviceId 
        ? `/analytics/devices/${deviceId}?timeframe=${timeframe}`
        : `/analytics/devices?timeframe=${timeframe}`;
      
      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Device analytics error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Carbon Credit Analytics
  async getCarbonCreditAnalytics(timeframe = '30d') {
    try {
      const response = await apiService.get(`/analytics/carbon-credits?timeframe=${timeframe}`);
      return response;
    } catch (error) {
      console.error('Carbon credit analytics error:', error);
      return {
        success: false,
        error: error.message,
        data: this.getFallbackCarbonData()
      };
    }
  }

  // Real-time Market Data
  async getMarketData() {
    try {
      const response = await apiService.get('/analytics/market');
      return response;
    } catch (error) {
      console.error('Market data error:', error);
      return {
        success: false,
        error: error.message,
        data: this.getFallbackMarketData()
      };
    }
  }

  // WebSocket Connection for Real-time Updates
  connectWebSocket(userId) {
    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Authenticate
        this.sendMessage({
          type: 'auth',
          userId: userId
        });

        // Subscribe to channels
        this.sendMessage({
          type: 'subscribe',
          channels: ['market_stream', 'energy_stream', 'trading_stream']
        });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.handleReconnection();
      };

      this.wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  handleWebSocketMessage(data) {
    const { type, data: messageData } = data;
    
    // Notify subscribers
    if (this.subscribers.has(type)) {
      this.subscribers.get(type).forEach(callback => {
        try {
          callback(messageData);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }

    // Handle specific message types
    switch (type) {
      case 'market_data':
        this.handleMarketUpdate(messageData);
        break;
      case 'energy_production':
        this.handleEnergyUpdate(messageData);
        break;
      case 'trading_update':
        this.handleTradingUpdate(messageData);
        break;
      case 'user_notification':
        this.handleUserNotification(messageData);
        break;
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  sendMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
    }
  }

  // Subscribe to real-time updates
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.subscribers.has(eventType)) {
        this.subscribers.get(eventType).delete(callback);
      }
    };
  }

  // Handle specific update types
  handleMarketUpdate(data) {
    // Broadcast to all market data subscribers
    this.notifySubscribers('market_update', data);
  }

  handleEnergyUpdate(data) {
    // Broadcast to all energy subscribers
    this.notifySubscribers('energy_update', data);
  }

  handleTradingUpdate(data) {
    // Broadcast to all trading subscribers
    this.notifySubscribers('trading_update', data);
  }

  handleUserNotification(data) {
    // Show user notifications
    this.notifySubscribers('notification', data);
  }

  notifySubscribers(eventType, data) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.get(eventType).forEach(callback => {
        callback(data);
      });
    }
  }

  // Fallback data for offline mode
  getFallbackDashboardData() {
    return {
      metrics: {
        totalEnergyProduced: 2450,
        totalRevenue: 8420,
        activeTrades: 12,
        carbonCredits: 18,
        devicesConnected: 4,
        monthlyGrowth: 23.5
      },
      chartData: {
        energyProduction: this.generateFallbackChartData('energy'),
        tradingVolume: this.generateFallbackChartData('trading'),
        carbonCreditsEarned: this.generateFallbackChartData('carbon'),
        revenueFlow: this.generateFallbackChartData('revenue')
      },
      recentActivities: this.generateFallbackActivities(),
      marketStats: this.getFallbackMarketData()
    };
  }

  getFallbackTradingData() {
    return {
      overview: {
        totalTransactions: 45,
        totalVolume: 2450,
        totalValue: 8420,
        averagePrice: 0.15
      },
      priceAnalysis: {
        averagePrice: 0.15,
        priceVolatility: 0.08,
        priceRange: { min: 0.12, max: 0.18 }
      },
      performanceMetrics: {
        profitMargin: 15.2,
        roi: 23.5,
        marketShare: 2.1
      }
    };
  }

  getFallbackMarketData() {
    return {
      currentPrice: 0.15,
      priceChange24h: 0.02,
      volume24h: 15420,
      activeListings: 156,
      marketTrend: 'up'
    };
  }

  getFallbackCarbonData() {
    return {
      portfolio: {
        totalCredits: 18,
        verifiedCredits: 15,
        totalValue: 2700,
        averagePrice: 150
      },
      environmentalImpact: {
        co2Offset: 1250,
        treesEquivalent: 57,
        carsOffRoad: 0.27
      }
    };
  }

  generateFallbackChartData(type) {
    const data = [];
    const days = 30;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      let value;
      switch (type) {
        case 'energy':
          value = 80 + Math.random() * 40;
          break;
        case 'trading':
          value = 200 + Math.random() * 100;
          break;
        case 'carbon':
          value = Math.floor(Math.random() * 3);
          break;
        case 'revenue':
          value = 150 + Math.random() * 100;
          break;
        default:
          value = Math.random() * 100;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100
      });
    }
    
    return data;
  }

  generateFallbackActivities() {
    return [
      {
        id: 1,
        type: 'energy_sale',
        title: 'Energy Sold',
        description: '180 kWh to grid',
        amount: '$54.00',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'completed',
        icon: 'energy'
      },
      {
        id: 2,
        type: 'carbon_credit_earned',
        title: 'Carbon Credits Earned',
        description: '3 credits from solar production',
        amount: '+3 credits',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'completed',
        icon: 'carbon'
      },
      {
        id: 3,
        type: 'device_registered',
        title: 'Device Added',
        description: 'Solar Panel Array #4',
        amount: '',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'approved',
        icon: 'device'
      }
    ];
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.subscribers.clear();
  }
}

export const analyticsService = new AnalyticsService();
