const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import all models to ensure they're registered
require('./models/User');
require('./models/Device');
require('./models/EnergyListing');
require('./models/Transaction');
require('./models/PaymentMethod');
require('./models/WalletTransaction');

// Import routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const tradingRoutes = require('./routes/trading');
const energyRoutes = require('./routes/energy');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Energy Trading Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      devices: '/api/devices',
      trading: '/api/trading',
      energy: '/api/energy',
      payments: '/api/payments',
      users: '/api/users',
      profile: '/api/profile'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', authenticate, deviceRoutes);
app.use('/api/trading', authenticate, tradingRoutes);
app.use('/api/energy', authenticate, energyRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/profile', authenticate, profileRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-trading',
      mongoOptions
    );

    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

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

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log('\n🚀 Energy Trading Platform API Server Started');
      console.log('================================================');
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
      console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
      console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
      console.log('================================================');
      console.log('Available API Endpoints:');
      console.log(`  🔐 Auth: http://${HOST}:${PORT}/api/auth`);
      console.log(`  📱 Devices: http://${HOST}:${PORT}/api/devices`);
      console.log(`  💱 Trading: http://${HOST}:${PORT}/api/trading`);
      console.log(`  ⚡ Energy: http://${HOST}:${PORT}/api/energy`);
      console.log(`  💳 Payments: http://${HOST}:${PORT}/api/payments`);
      console.log(`  👥 Users: http://${HOST}:${PORT}/api/users`);
      console.log(`  👤 Profile: http://${HOST}:${PORT}/api/profile`);
      console.log('================================================\n');
    });

    // Server error handling
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown for server
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
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
  
  // Close server & exit process
  process.exit(1);
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

module.exports = app;
