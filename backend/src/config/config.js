require('dotenv').config();

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is required');
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV || 'development',
};
