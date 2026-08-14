const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { port, mongoUri } = require('./config/config');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/error.middleware');
const { checkDbAuth } = require('./middleware/auth.middleware');
const shipmentRoutes = require('./routes/shipment.routes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Database connection check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn('MongoDB not connected, attempting to reconnect...');
    connectDB()
      .then(() => {
        logger.info('MongoDB reconnected successfully');
        next();
      })
      .catch(err => {
        logger.error('Failed to reconnect to MongoDB:', err);
        res.status(500).json({ 
          success: false, 
          error: 'Database connection error. Please try again later.' 
        });
      });
  } else {
    next();
  }
});

// Routes
app.use('/api/shipments', checkDbAuth, shipmentRoutes);

// Add redirect for /shipments to /api/shipments
app.use('/shipments', (req, res) => {
  // Redirect to the same path but with /api prefix
  const redirectUrl = `/api${req.url}`;
  res.redirect(307, redirectUrl);
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'ok',
    database: dbStatus
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Shipment Tracker API is running',
    endpoints: {
      health: '/health',
      api: '/api/shipments'
    }
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`));
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
    
    // Handle server shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down server...');
      server.close(async () => {
        logger.info('Express server closed');
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });
    };
    
    // Handle process termination
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing
