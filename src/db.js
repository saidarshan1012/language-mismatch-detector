const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
/**
 * MongoDB Connection
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');


async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Run connection if executed directly
if (require.main === module) {
  connectDB();
}

module.exports = connectDB;