const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const energyRoutes = require('./routes/energy');
const tradingRoutes = require('./routes/trading');
const deviceRoutes = require('./routes/devices');
const blockchainRoutes = require('./routes/blockchain');
const paymentRoutes = require('./routes/payments');
const profileRoutes = require('./routes/profile');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - UPDATED
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Both frontend and backend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Handle preflight requests explicitly - NEW
app.options('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware - MOVED AFTER CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - MOVED AFTER BODY PARSING
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads/devices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database connection
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URL + 'energy-trading-dapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));
}

// Add a simple test route for debugging - NEW
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    blockchain: {
      contractAddress: process.env.CONTRACT_ADDRESS,
      verifierContract: process.env.VERIFIER_CONTRACT_ADDRESS
    },
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'not configured',
      twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured'
    },
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:3001']
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Energy Trading API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${process.env.PORT || 5000}/api`,
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/verify-email/:token': 'Verify email',
        'POST /api/auth/resend-verification': 'Resend email verification',
        'POST /api/auth/send-phone-verification': 'Send phone verification',
        'POST /api/auth/verify-phone': 'Verify phone',
        'POST /api/auth/forgot-password': 'Request password reset',
        'POST /api/auth/reset-password/:token': 'Reset password',
        'GET /api/auth/me': 'Get current user',
        'POST /api/auth/change-password': 'Change password',
        'POST /api/auth/refresh-token': 'Refresh JWT token',
        'GET /api/auth/login-history': 'Get login history',
        'POST /api/auth/logout': 'Logout user'
      },
      users: {
        'GET /api/users/:userId': 'Get user profile',
        'PUT /api/users/:userId': 'Update user profile',
        'GET /api/users/:userId/devices': 'Get user devices',
        'GET /api/users/:userId/transactions': 'Get user transactions',
        'PUT /api/users/:userId/balance': 'Update user balance (admin)',
        'GET /api/users': 'Get all users (admin)'
      },
      profile: {
        'GET /api/profile': 'Get current user profile',
        'PUT /api/profile': 'Update current user profile',
        'PUT /api/profile/preferences': 'Update user preferences',
        'POST /api/profile/deactivate': 'Deactivate account'
      },
      energy: {
        'POST /api/energy/devices/register': 'Register new energy device',
        'POST /api/energy/devices/:deviceId/production': 'Submit energy production',
        'GET /api/energy/devices/:deviceId': 'Get device energy data',
        'GET /api/energy/devices': 'Get all devices'
      },
      trading: {
        'POST /api/trading/sell': 'Create sell order',
        'POST /api/trading/buy': 'Create buy order',
        'GET /api/trading/market': 'Get market data',
        'GET /api/trading/orders/:userId?': 'Get user orders',
        'DELETE /api/trading/orders/:orderId': 'Cancel order'
      },
      devices: {
        'GET /api/devices/:deviceId': 'Get device details',
        'PUT /api/devices/:deviceId': 'Update device',
        'POST /api/devices/:deviceId/documents': 'Upload verification documents',
        'PUT /api/devices/:deviceId/verify': 'Verify device (admin)',
        'DELETE /api/devices/:deviceId': 'Delete device',
        'GET /api/devices/:deviceId/statistics': 'Get device statistics'
      },
      blockchain: {
        'GET /api/blockchain/status': 'Get blockchain status',
        'GET /api/blockchain/transaction/:txHash': 'Get transaction details'
      },
      payments: {
        'POST /api/payments/process': 'Process payment',
        'GET /api/payments/history/:userId?': 'Get payment history',
        'GET /api/payments/:paymentId': 'Get payment details'
      },
      test: {
        'GET /api/test': 'Test API connectivity and CORS'
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📊 Database: Connected to MongoDB`);
    console.log(`⛓️  Contract Address: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
    console.log(`🔗 CORS: Enabled for http://localhost:3000`);
    console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
  });
}

module.exports = app;
