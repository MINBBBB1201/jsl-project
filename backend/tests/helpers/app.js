/**
 * 테스트용 최소 Express 앱.
 *
 * server.js 는 require 되는 순간 connectDB() · app.listen() · 스케줄러까지
 * 실행해서 supertest 로 그대로 쓰기 어렵다. 여기서는 검증 대상 라우터만
 * server.js 와 같은 방식(같은 prefix, checkDbConnection, errorHandler)으로
 * 얹어 HTTP 경계를 재현한다.
 */
const express = require('express');

const { checkDbConnection } = require('../../src/middleware/db.middleware');
const { errorHandler } = require('../../src/middleware/error.middleware');
const shipmentRoutes = require('../../src/routes/shipment.routes');

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api/shipments', checkDbConnection, shipmentRoutes);
  app.all('*', (req, res, next) => next(new Error(`Can't find ${req.originalUrl}`)));
  app.use(errorHandler);
  return app;
}

module.exports = { buildApp };
