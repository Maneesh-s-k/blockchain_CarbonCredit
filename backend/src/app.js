const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const tradingRoutes = require('./routes/trading');
const energyRoutes = require('./routes/energy');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
// Add this after your imports
console.log('authRoutes:', authRoutes);
console.log('deviceRoutes:', deviceRoutes);
console.log('tradingRoutes:', tradingRoutes);
console.log('energyRoutes:', energyRoutes);
console.log('paymentRoutes:', paymentRoutes);
console.log('userRoutes:', userRoutes);
console.log('profileRoutes:', profileRoutes);


// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes - MAKE SURE ALL THESE MODULES EXIST AND EXPORT ROUTERS
app.use('/api/auth', authRoutes);
app.use('/api/devices', authenticate, deviceRoutes);
app.use('/api/trading', authenticate, tradingRoutes);
app.use('/api/energy', authenticate, energyRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/profile', authenticate, profileRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-trading', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  });
};

startServer();

module.exports = app;
