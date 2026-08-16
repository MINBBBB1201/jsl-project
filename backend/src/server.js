// ⚠️ 반드시 첫 줄. mongoose 가 로드되기 전에 DNS 리졸버를 확정해야 한다.
//    (설명은 config/dns.js 주석 참고 — DNS_SERVERS 미설정 시 아무 동작 안 함)
require('./config/dns');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { port, mongoUri, allowedOrigins, allowedOriginPatterns } = require('./config/config');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { AppError, errorHandler } = require('./middleware/error.middleware');
const { checkDbConnection } = require('./middleware/db.middleware');
const authRoutes = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const contactRoutes = require('./routes/contact.routes');
const chatRoutes = require('./routes/chat.routes');
const damageInspectionRoutes = require('./routes/damage-inspection.routes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

/**
 * CORS
 *
 * 허용 목록은 config 에서 관리한다 (ALLOWED_ORIGINS 환경변수 > 기본값).
 * Vercel preview 배포는 커밋마다 URL 이 바뀌어서 정규식으로 함께 처리한다.
 */
const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) ||
  allowedOriginPatterns.some((pattern) => pattern.test(origin));

app.use(cors({
  origin: (origin, callback) => {
    // origin 헤더가 없는 요청(curl, 서버 간 호출, 헬스체크)은 CORS 대상이 아니다
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) return callback(null, true);

    // 허용 헤더를 빼는 대신 요청 자체를 막는다.
    // 헤더만 빼면 브라우저는 응답을 못 읽지만 POST 는 이미 실행된 뒤다.
    logger.warn(`CORS 차단된 origin: ${origin}`);
    return callback(new AppError(`CORS 정책에 의해 차단된 origin 입니다: ${origin}`, 403));
  },
  credentials: true,
}));

logger.info(`CORS 허용 origin: ${allowedOrigins.join(', ')}`);

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

/**
 * Routes
 *
 * 인증 정책은 각 라우터 안에서 엔드포인트 단위로 건다 (routes/*.js 참고).
 * 마케팅 페이지·단건 화물조회·문의·챗봇은 공개, 대시보드용 조회와
 * 데이터 변경 API 는 로그인(+역할)이 필요하다.
 * 여기 checkDbConnection 은 이름 그대로 DB 연결 확인만 한다.
 */
app.use('/api/auth', checkDbConnection, authRoutes);
app.use('/api/shipments', checkDbConnection, shipmentRoutes);
app.use('/api/contact', checkDbConnection, contactRoutes);
app.use('/api/chat', checkDbConnection, chatRoutes);
app.use('/api/damage-inspection', checkDbConnection, damageInspectionRoutes);

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
      auth: '/api/auth',
      api: '/api/shipments',
      contact: '/api/contact',
      chat: '/api/chat',
      damageInspection: '/api/damage-inspection'
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
