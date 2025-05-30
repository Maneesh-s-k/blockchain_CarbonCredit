const mongoose = require('mongoose');
const User = require('../models/User');
const Device = require('../models/Device');
const EnergyListing = require('../models/EnergyListing');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-trading');
    
    console.log('🌱 Seeding database...');

    // Create sample users
    const users = await User.create([
      {
        username: 'solarjohn',
        email: 'john@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Solar',
        wallet: { balance: 500 },
        statistics: { totalTrades: 15, averageRating: 4.8 }
      },
      {
        username: 'windmary',
        email: 'mary@example.com',
        password: 'Password123',
        firstName: 'Mary',
        lastName: 'Wind',
        wallet: { balance: 750 },
        statistics: { totalTrades: 23, averageRating: 4.9 }
      }
    ]);

    // Create sample devices
    const devices = await Device.create([
      {
        owner: users[0]._id,
        deviceName: 'Rooftop Solar Array',
        deviceType: 'solar',
        capacity: 8.5,
        location: { address: '123 Solar St, San Francisco, CA' },
        verification: { status: 'approved' },
        energyProduction: { totalProduced: 2500 }
      },
      {
        owner: users[1]._id,
        deviceName: 'Backyard Wind Turbine',
        deviceType: 'wind',
        capacity: 3.2,
        location: { address: '456 Wind Ave, Portland, OR' },
        verification: { status: 'approved' },
        energyProduction: { totalProduced: 1800 }
      }
    ]);

    // Create sample listings
    await EnergyListing.create([
      {
        seller: users[0]._id,
        device: devices[0]._id,
        energyType: 'solar',
        amount: 100,
        pricePerKwh: 0.12,
        availability: { endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      },
      {
        seller: users[1]._id,
        device: devices[1]._id,
        energyType: 'wind',
        amount: 75,
        pricePerKwh: 0.10,
        availability: { endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }
      }
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
