const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Import all models to ensure they're registered
require('./models/User');
require('./models/Device');
require('./models/EnergyListing');
require('./models/Transaction');
require('./models/PaymentMethod');
require('./models/WalletTransaction');
require('./models/CarbonCredit');

// Import routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const tradingRoutes = require('./routes/trading');
const energyRoutes = require('./routes/energy');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const blockchainRoutes = require('./routes/blockchain');

// Import analytics routes
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

// Import services
const realtimeService = require('./utils/realtimeService');
const analyticsService = require('./utils/analyticsService');
const blockchainService = require('./utils/blockchainService');

const app = express();
const server = http.createServer(app);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ]
}));

// Body parsing middleware with increased limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`${timestamp} - ${method} ${url} - IP: ${ip}`);
    
    // Log request body for POST/PUT requests (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      const sanitizedBody = { ...req.body };
      // Remove sensitive fields from logs
      delete sanitizedBody.password;
      delete sanitizedBody.privateKey;
      delete sanitizedBody.secret;
      
      if (Object.keys(sanitizedBody).length > 0) {
        console.log(`Request Body:`, JSON.stringify(sanitizedBody, null, 2));
      }
    }
    
    next();
  });
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
});

// Rate limiting middleware for production
if (process.env.NODE_ENV === 'production') {
  const rateLimit = require('express-rate-limit');
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', limiter);
}

// Health check endpoint with detailed system information
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get system uptime
    const uptime = process.uptime();
    
    // Check environment variables
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'NODE_ENV'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown'
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      services: {
        webSocket: realtimeService ? 'available' : 'unavailable',
        analytics: analyticsService ? 'available' : 'unavailable',
        blockchain: blockchainService ? 'available' : 'unavailable'
      }
    };
    
    // Add warnings for missing environment variables
    if (missingEnvVars.length > 0) {
      healthData.warnings = {
        missingEnvVars: missingEnvVars
      };
    }
    
    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API status endpoint with comprehensive endpoint documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Energy Trading Platform API',
    version: '1.0.0',
    documentation: {
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      authentication: 'Bearer token required for protected endpoints',
      rateLimit: process.env.NODE_ENV === 'production' ? '100 requests per 15 minutes' : 'unlimited'
    },
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /logout - User logout',
          'POST /forgot-password - Request password reset',
          'POST /reset-password - Reset password',
          'GET /verify-email/:token - Verify email address'
        ]
      },
      devices: {
        base: '/api/devices',
        endpoints: [
          'GET / - Get user devices',
          'POST /register - Register new device',
          'GET /:deviceId - Get device details',
          'PUT /:deviceId - Update device',
          'DELETE /:deviceId - Delete device',
          'POST /:deviceId/energy - Update energy production',
          'GET /:deviceId/analytics - Get device analytics'
        ]
      },
      trading: {
        base: '/api/trading',
        endpoints: [
          'GET /marketplace - Get marketplace listings',
          'POST /listings - Create energy listing',
          'GET /listings - Get user listings',
          'PUT /listings/:listingId - Update listing',
          'DELETE /listings/:listingId - Cancel listing',
          'POST /purchase - Purchase energy',
          'GET /transactions - Get user transactions',
          'GET /analytics - Get trading analytics'
        ]
      },
      energy: {
        base: '/api/energy',
        endpoints: [
          'POST /production/:deviceId - Record energy production',
          'GET /production/:deviceId - Get production data',
          'POST /consumption - Record energy consumption',
          'GET /analytics - Get energy analytics'
        ]
      },
      analytics: {
        base: '/api/analytics',
        endpoints: [
          'GET /dashboard - Get dashboard analytics',
          'GET /trading - Get trading analytics',
          'GET /devices - Get device analytics',
          'GET /devices/:deviceId - Get specific device analytics',
          'GET /carbon-credits - Get carbon credit analytics',
          'GET /market - Get real-time market data'
        ]
      },
      blockchain: {
        base: '/api/blockchain',
        endpoints: [
          'GET /balance/:walletType - Get wallet balance',
          'GET /transaction/:txHash - Get transaction details',
          'POST /register-device - Register device on blockchain',
          'POST /submit-energy - Submit energy production to blockchain'
        ]
      },
      payments: {
        base: '/api/payments',
        endpoints: [
          'GET / - Get payment methods',
          'POST / - Add payment method',
          'PUT /:paymentId - Update payment method',
          'DELETE /:paymentId - Delete payment method'
        ]
      },
      users: {
        base: '/api/users',
        endpoints: [
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
          'GET /statistics - Get user statistics'
        ]
      },
      profile: {
        base: '/api/profile',
        endpoints: [
          'GET / - Get user profile',
          'PUT / - Update user profile',
          'POST /avatar - Upload avatar',
          'POST /change-password - Change password'
        ]
      }
    },
    websocket: {
      url: `ws://${req.get('host')}`,
      channels: [
        'market_stream - Real-time market data',
        'energy_stream - Energy production updates',
        'trading_stream - Trading activity updates',
        'user_notifications - User-specific notifications'
      ]
    }
  });
});

// API Routes with enhanced error handling
app.use('/api/auth', authRoutes);
app.use('/api/devices', authenticate, deviceRoutes);
app.use('/api/trading', authenticate, tradingRoutes);
app.use('/api/energy', authenticate, energyRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/blockchain', authenticate, blockchainRoutes);

// Analytics routes (protected)
app.use('/api/analytics', authenticate, analyticsRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: '/api',
    documentation: `${req.protocol}://${req.get('host')}/api`
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    suggestion: 'Check the API documentation at /api'
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      details: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      details: 'A record with this information already exists'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection with enhanced retry logic and monitoring
const connectDB = async (retries = 5) => {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    };

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-trading';
    
    await mongoose.connect(mongoUri, mongoOptions);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Initialize analytics service after database connection
    console.log('🔄 Initializing analytics service...');
    
    // Start periodic analytics generation (every hour)
    setInterval(async () => {
      try {
        await analyticsService.generatePeriodicReports();
        console.log('📊 Periodic analytics reports generated');
      } catch (error) {
        console.error('❌ Error generating periodic reports:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    console.log('✅ Analytics service initialized');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('💀 Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

// Enhanced MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
  
  // Attempt to reconnect
  setTimeout(() => {
    console.log('🔄 Attempting to reconnect to MongoDB...');
    connectDB(3);
  }, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB');
});

// Graceful shutdown with cleanup
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Graceful shutdown initiated...`);
  
  try {
    // Close WebSocket server
    if (realtimeService && realtimeService.wss) {
      console.log('🔌 Closing WebSocket connections...');
      realtimeService.wss.close();
    }
    
    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server with enhanced initialization
const PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'; 

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start HTTP server
    server.listen(PORT, HOST, () => {
      console.log('\n🚀 Energy Trading Platform API Server Started');
      console.log('================================================');
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
      console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
      console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
      console.log(`📚 API Documentation: http://${HOST}:${PORT}/api`);
      console.log('================================================');
      console.log('Available API Endpoints:');
      console.log(` 🔐 Auth: http://${HOST}:${PORT}/api/auth`);
      console.log(` 📱 Devices: http://${HOST}:${PORT}/api/devices`);
      console.log(` 💱 Trading: http://${HOST}:${PORT}/api/trading`);
      console.log(` ⚡ Energy: http://${HOST}:${PORT}/api/energy`);
      console.log(` 📊 Analytics: http://${HOST}:${PORT}/api/analytics`);
      console.log(` 🔗 Blockchain: http://${HOST}:${PORT}/api/blockchain`);
      console.log(` 💳 Payments: http://${HOST}:${PORT}/api/payments`);
      console.log(` 👥 Users: http://${HOST}:${PORT}/api/users`);
      console.log(` 👤 Profile: http://${HOST}:${PORT}/api/profile`);
      console.log('================================================');
      console.log('🔌 WebSocket Server: Available for real-time updates');
      console.log('📊 Analytics Service: Running periodic reports');
      console.log('🔗 Blockchain Service: Available for Web3 integration');
      console.log('================================================\n');
    });

    // Initialize WebSocket server for real-time updates
    console.log('🔄 Initializing WebSocket server...');
    realtimeService.initialize(server);
    console.log('✅ WebSocket server initialized');

    // Server error handling
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log(`💡 Try using a different port: PORT=3002 npm start`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  console.error('Promise:', promise);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server & exit process
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, server };
