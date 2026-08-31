const Shipment = require('../models/shipment.model');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const TRANSIT_TIMES = require('../config/transit-times');
const {
  calculateDelayRisk,
  buildRiskLevelQuery,
  RISK_LEVELS,
  MS_PER_DAY
} = require('../utils/delay-risk');
const {
  DELIVERED_STATUS,
  resolveCompletedAt,
  isOnTime,
  computeChangeRate
} = require('../utils/delivery-completion');
const shipmentEvents = require('../services/shipment-events.service');

/**
 * 목록 조회 응답에서 제외할 고객 개인정보.
 *
 * 목록은 로그인한 직원만 볼 수 있지만(routes/shipment.routes.js 참고), 화면에서
 * 쓰지도 않는 연락처를 수십 건씩 한꺼번에 내려줄 이유는 없다. 개인정보처리방침의
 * 최소제공 원칙에 따라 목록에서는 customer 를 빼고, 필요한 경우 단건 상세
 * (GET /:trackingNumber) 로만 확인한다.
 */
const PII_EXCLUDED_FIELDS = '-customer';

/** 이미 조회된 문서에서 고객 개인정보를 떼어낸다 (select 를 못 쓰는 경우용) */
const stripPii = (shipment) => {
  if (!shipment) return shipment;
  const plain = typeof shipment.toObject === 'function' ? shipment.toObject() : { ...shipment };
  delete plain.customer;
  return plain;
};

/**
 * 저장된 delayRiskScore/Level 은 시간이 지나면 낡으므로, 응답을 만들 때
 * 조회 시점 기준으로 다시 계산해 덮어쓴다.
 */
const withFreshRisk = (shipment, now) => {
  const plain = typeof shipment.toObject === 'function' ? shipment.toObject() : { ...shipment };
  const risk = calculateDelayRisk(plain, TRANSIT_TIMES, { now });

  return {
    ...plain,
    delayRiskScore: risk.score,
    delayRiskLevel: risk.level,
    delayRisk: {
      score: risk.score,
      level: risk.level,
      elapsedDays: risk.elapsedDays,
      standardDays: risk.standardDays,
      // 표준 소요일이 추정치인지 실측인지 함께 내려준다
      standardSource: risk.source,
      skipped: risk.skipped
    }
  };
};

// Helper function to generate a tracking number
const generateTrackingNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) result += '-';
  }
  return result;
};

// Calculate estimated delivery date (simple implementation - could be enhanced with distance calculation)
const calculateEstimatedDelivery = () => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3); // Default 3 days from now
  return deliveryDate;
};

// Create a new shipment
exports.createShipment = async (req, res) => {
  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      logger.warn('MongoDB not connected during shipment creation, attempting to reconnect...');
      try {
        // Try to reconnect
        const { connectDB } = require('../config/database');
        await connectDB();
        logger.info('MongoDB reconnected successfully for shipment creation');
      } catch (connError) {
        logger.error('Failed to reconnect to MongoDB for shipment creation:', connError);
        return res.status(500).json({
          success: false,
          error: 'Database connection error. Please try again later.'
        });
      }
    }

    const { origin, destination, checkpoints, customer, items } = req.body;
    
    // Validate required fields
    if (!origin || !origin.coordinates || !origin.address) {
      return res.status(400).json({
        success: false,
        error: 'Origin with coordinates and address is required'
      });
    }
    
    if (!destination || !destination.coordinates || !destination.address) {
      return res.status(400).json({
        success: false,
        error: 'Destination with coordinates and address is required'
      });
    }
    
    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({
        success: false,
        error: 'Customer with name and email is required'
      });
    }
    
    // Process checkpoints if provided
    let validatedCheckpoints = [];
    if (checkpoints && Array.isArray(checkpoints) && checkpoints.length > 0) {
      // Validate each checkpoint
      for (const checkpoint of checkpoints) {
        if (!checkpoint.location || !checkpoint.location.coordinates || !checkpoint.location.address) {
          return res.status(400).json({
            success: false,
            error: 'Each checkpoint must have location with coordinates and address'
          });
        }
        
        if (!checkpoint.name) {
          return res.status(400).json({
            success: false,
            error: 'Each checkpoint must have a name'
          });
        }
        
        validatedCheckpoints.push({
          location: {
            type: 'Point',
            coordinates: checkpoint.location.coordinates,
            address: checkpoint.location.address,
            timestamp: new Date()
          },
          name: checkpoint.name,
          estimatedArrival: checkpoint.estimatedArrival || null,
          reached: false,
          notes: checkpoint.notes || ''
        });
      }
    }
    
    // Create new shipment
    const shipment = new Shipment({
      trackingNumber: generateTrackingNumber(),
      origin: {
        type: 'Point',
        coordinates: origin.coordinates,
        address: origin.address,
        timestamp: new Date()
      },
      destination: {
        type: 'Point',
        coordinates: destination.coordinates,
        address: destination.address,
        timestamp: new Date()
      },
      checkpoints: validatedCheckpoints,
      currentLocation: {
        type: 'Point',
        coordinates: origin.coordinates,
        address: origin.address,
        timestamp: new Date()
      },
      status: 'pending',
      estimatedDelivery: req.body.estimatedDelivery || calculateEstimatedDelivery(),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || ''
      },
      items: items || [],
      history: [{
        location: {
          type: 'Point',
          coordinates: origin.coordinates,
          address: origin.address,
          timestamp: new Date()
        },
        status: 'pending',
        description: 'Shipment created',
        timestamp: new Date()
      }]
    });

    // Save with retry mechanism
    let savedShipment;
    try {
      savedShipment = await shipment.save();
    } catch (saveError) {
      // If first save fails, try one more time
      if (saveError.name === 'MongoNetworkError' || 
          saveError.name === 'MongoTimeoutError' ||
          (saveError.message && saveError.message.includes('connection'))) {
        
        logger.warn('MongoDB save error, attempting to reconnect and retry:', saveError);
        
        try {
          // Try to reconnect
          const { connectDB } = require('../config/database');
          await connectDB();
          
          // Try saving again
          savedShipment = await shipment.save();
          logger.info('Shipment saved successfully after retry');
        } catch (retryError) {
          throw retryError; // Will be caught by outer catch block
        }
      } else {
        throw saveError; // Will be caught by outer catch block
      }
    }
    
    logger.info(`New shipment created: ${savedShipment.trackingNumber}`);
    
    res.status(201).json({
      success: true,
      data: stripPii(savedShipment),
      message: 'Shipment created successfully'
    });
  } catch (error) {
    logger.error('Error creating shipment:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to create shipment';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid shipment data: ' + Object.values(error.errors).map(e => e.message).join(', ');
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      errorMessage = 'Duplicate tracking number. Please try again.';
    } else if (error.name === 'MongoNetworkError') {
      errorMessage = 'Network error connecting to database. Please try again later.';
    }
    
    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get shipment by tracking number
exports.getShipmentByTrackingNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    // 인증이 없는 상태라 고객 개인정보는 내려주지 않는다 (PII_EXCLUDED_FIELDS 주석 참고)
    const shipment = await Shipment.findOne({ trackingNumber }).select(PII_EXCLUDED_FIELDS);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    logger.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update shipment location
exports.updateShipmentLocation = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { coordinates, address, status, description } = req.body;
    
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    // Update location and status
    await shipment.updateLocation(
      {
        longitude: coordinates[0],
        latitude: coordinates[1],
        address: address
      },
      status,
      description
    );
    
    logger.info(`Shipment ${trackingNumber} location updated`);

    // Get updated shipment
    const updatedShipment = await Shipment.findOne({ trackingNumber });

    // 위치 갱신에도 상태가 함께 바뀔 수 있어 같은 알림 트리거를 태운다
    await shipmentEvents.handleShipmentSaved(updatedShipment);

    res.status(200).json({
      success: true,
      data: stripPii(updatedShipment),
      message: 'Shipment location updated successfully'
    });
  } catch (error) {
    logger.error('Error updating shipment location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shipment location',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get shipment history
exports.getShipmentHistory = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const shipment = await Shipment.findOne({ trackingNumber }, 'history');
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shipment.history
    });
  } catch (error) {
    logger.error('Error fetching shipment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipment history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get nearby shipments
exports.getNearbyShipments = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // Default 10km
    
    const shipments = await Shipment.find({
      'currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });

    res.status(200).json({
      success: true,
      data: shipments
    });
  } catch (error) {
    logger.error('Error fetching nearby shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby shipments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all shipments with filtering and sorting
exports.getAllShipments = async (req, res) => {
  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      logger.warn('MongoDB not connected when fetching shipments, attempting to reconnect...');
      try {
        // Try to reconnect
        const { connectDB } = require('../config/database');
        await connectDB();
        logger.info('MongoDB reconnected successfully for fetching shipments');
      } catch (connError) {
        logger.error('Failed to reconnect to MongoDB for fetching shipments:', connError);
        return res.status(500).json({ 
          success: false, 
          error: 'Database connection error. Please try again later.' 
        });
      }
    }
    
    const { status, riskLevel, transportMode, sortBy, sortOrder, limit = 50, page = 1 } = req.query;
    const now = new Date();
    const query = {};

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (transportMode) {
      query.transportMode = transportMode;
    }

    // 리스크 등급 필터.
    // 저장된 delayRiskLevel 은 낡을 수 있어 shippedAt 날짜 범위로 조회한다.
    if (riskLevel) {
      const riskQuery = buildRiskLevelQuery(riskLevel, TRANSIT_TIMES, { now });
      if (!riskQuery) {
        return res.status(400).json({
          success: false,
          error: `riskLevel 은 ${Object.values(RISK_LEVELS).join(', ')} 중 하나여야 합니다.`
        });
      }
      query.$or = riskQuery.$or;
      // status 를 명시적으로 넘긴 경우 그 필터를 우선한다
      if (!status) {
        query.status = riskQuery.status;
      }
    }

    // Apply sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      // Default sort by createdAt in descending order (newest first)
      sortOptions.createdAt = -1;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    
    // Fetch shipments with retry mechanism
    let shipments;
    try {
      shipments = await Shipment.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitValue)
        .select(`-__v ${PII_EXCLUDED_FIELDS}`);
    } catch (fetchError) {
      // If first fetch fails, try one more time
      if (fetchError.name === 'MongoNetworkError' || 
          fetchError.name === 'MongoTimeoutError' ||
          (fetchError.message && fetchError.message.includes('connection'))) {
        
        logger.warn('MongoDB fetch error, attempting to reconnect and retry:', fetchError);
        
        try {
          // Try to reconnect
          const { connectDB } = require('../config/database');
          await connectDB();
          
          // Try fetching again
          shipments = await Shipment.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitValue)
            .select(`-__v ${PII_EXCLUDED_FIELDS}`);
            
          logger.info('Shipments fetched successfully after retry');
        } catch (retryError) {
          throw retryError; // Will be caught by outer catch block
        }
      } else {
        throw fetchError; // Will be caught by outer catch block
      }
    }
    
    // Get total count for pagination info
    const totalCount = await Shipment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: shipments.map((shipment) => withFreshRisk(shipment, now)),
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: limitValue,
        pages: Math.ceil(totalCount / limitValue)
      }
    });
  } catch (error) {
    logger.error('Error fetching shipments:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to fetch shipments';
    
    if (error.name === 'MongoNetworkError') {
      errorMessage = 'Network error connecting to database. Please try again later.';
    } else if (error.name === 'MongoServerError') {
      errorMessage = 'Database server error. Please try again later.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/shipments/delay-summary
 *
 * 진행 중인 화물의 지연 리스크 등급별 건수를 집계한다.
 * 배송 완료(delivered) 건은 결과가 이미 나온 건이라 집계에서 제외한다.
 */
exports.getDelaySummary = async (req, res) => {
  try {
    const now = new Date();

    // 스코어링 대상: 배송 완료가 아니고, 집하일과 운송모드가 있는 건
    const scorableQuery = {
      status: { $ne: 'delivered' },
      shippedAt: { $ne: null },
      transportMode: { $ne: null }
    };

    const shipments = await Shipment.find(scorableQuery)
      .select('transportMode shippedAt status')
      .lean();

    const counts = {
      [RISK_LEVELS.NORMAL]: 0,
      [RISK_LEVELS.AT_RISK]: 0,
      [RISK_LEVELS.DELAYED]: 0
    };
    let skipped = 0;

    for (const shipment of shipments) {
      const { level } = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });
      if (level) counts[level] += 1;
      else skipped += 1;
    }

    const total = counts[RISK_LEVELS.NORMAL] + counts[RISK_LEVELS.AT_RISK] + counts[RISK_LEVELS.DELAYED];

    // 참고용 부가 정보
    const [deliveredCount, allCount] = await Promise.all([
      Shipment.countDocuments({ status: 'delivered' }),
      Shipment.countDocuments({})
    ]);

    res.status(200).json({
      success: true,
      total,
      [RISK_LEVELS.NORMAL]: counts[RISK_LEVELS.NORMAL],
      [RISK_LEVELS.AT_RISK]: counts[RISK_LEVELS.AT_RISK],
      [RISK_LEVELS.DELAYED]: counts[RISK_LEVELS.DELAYED],
      updatedAt: now.toISOString(),
      meta: {
        // 집계에서 빠진 건수 — 운영자가 데이터 품질을 확인할 수 있게 노출한다
        totalShipments: allCount,
        deliveredExcluded: deliveredCount,
        // 집하일 또는 운송모드가 없어 점수를 낼 수 없는 건
        unscorable: allCount - deliveredCount - total,
        // v1 은 규칙 기반이며 표준 소요일 상당수가 추정치임을 명시한다
        method: 'rule-based-v1',
        note: '표준 소요일 일부는 업계 평균 추정치입니다. 실제 배송 이력 확보 시 교체 예정.'
      }
    });
  } catch (error) {
    logger.error('Error building delay summary:', error);
    res.status(500).json({
      success: false,
      error: '지연 리스크 집계에 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 대시보드 상단 KPI 카드용 집계.
 *
 * 카드 3개(처리 화물 건수 / 온타임 배송률 / 활성 배송 건수)가 쓰는 값을 한 번에
 * 내려준다. 카드마다 따로 부르면 같은 화면에서 서로 다른 시각의 스냅샷이 섞인다.
 *
 * 기간 정의
 *   현재 구간 = 최근 30일 (now - 30d ~ now)      ← 카드 부제 "최근 30일 누적" 과 맞춘다
 *   이전 구간 = 그 직전 30일 (now - 60d ~ now - 30d)
 *
 * ⚠️ 증감률은 이전 구간에 비교 대상이 있을 때만 계산한다. 이전 구간이 0 건이면
 *    null 을 내려 화면에서 배지를 감춘다 (utils/delivery-completion.js 참고).
 *    실적처럼 보이는 가짜 숫자를 띄우지 않기 위한 것이다.
 */
const WINDOW_DAYS = 30;

/** 활성(진행 중)에서 빼는 상태 — 결과가 이미 확정된 건 */
const INACTIVE_STATUSES = [DELIVERED_STATUS, 'exception'];

exports.getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY);
    const previousStart = new Date(now.getTime() - 2 * WINDOW_DAYS * MS_PER_DAY);

    const [
      processedCurrent,
      processedPrevious,
      activeCurrent,
      // windowStart 이전에 생성됐고 지금도 진행 중인 건 — 그 시점에도 분명히 진행 중이었다
      activeStillOpenFromBefore,
      totalShipments,
      deliveredDocs
    ] = await Promise.all([
      Shipment.countDocuments({ createdAt: { $gte: windowStart, $lte: now } }),
      Shipment.countDocuments({ createdAt: { $gte: previousStart, $lt: windowStart } }),
      Shipment.countDocuments({ status: { $nin: INACTIVE_STATUSES } }),
      Shipment.countDocuments({
        createdAt: { $lte: windowStart },
        status: { $nin: INACTIVE_STATUSES }
      }),
      Shipment.countDocuments({}),
      // 완료 시각은 history 를 봐야 알 수 있어 집계 파이프라인 대신 문서를 읽는다.
      // 완료 건만 대상이고 필요한 필드만 골라 온다.
      Shipment.find({ status: DELIVERED_STATUS })
        .select('status createdAt updatedAt estimatedDelivery history.status history.timestamp')
        .lean()
    ]);

    // ── 온타임 배송률 ────────────────────────────────────────────────
    // 생성 시각이 아니라 완료 시각이 어느 구간에 속하는지로 나눈다.
    const sourceCounts = { history: 0, updatedAt: 0, unresolved: 0 };
    const window = { delivered: 0, onTime: 0, late: 0, undetermined: 0 };
    const previousWindow = { delivered: 0, onTime: 0, undetermined: 0 };
    // windowStart 시점에 아직 완료되지 않았던 건 (활성 건수의 이전 값 복원용)
    let openAtWindowStart = 0;

    for (const doc of deliveredDocs) {
      const { at: completedAt, source } = resolveCompletedAt(doc);

      if (!completedAt) {
        sourceCounts.unresolved += 1;
        continue;
      }
      sourceCounts[source] += 1;

      if (doc.createdAt && new Date(doc.createdAt) <= windowStart && completedAt > windowStart) {
        openAtWindowStart += 1;
      }

      const onTime = isOnTime(completedAt, doc.estimatedDelivery);

      if (completedAt >= windowStart && completedAt <= now) {
        window.delivered += 1;
        if (onTime === null) window.undetermined += 1;
        else if (onTime) window.onTime += 1;
        else window.late += 1;
      } else if (completedAt >= previousStart && completedAt < windowStart) {
        previousWindow.delivered += 1;
        if (onTime === null) previousWindow.undetermined += 1;
        else if (onTime) previousWindow.onTime += 1;
      }
    }

    /** 판정 가능한 건이 하나도 없으면 비율을 만들지 않는다 (0 으로 나누지 않는다) */
    const rateOf = (onTimeCount, deliveredCount, undetermined) => {
      const judged = deliveredCount - undetermined;
      if (judged <= 0) return null;
      return Math.round((onTimeCount / judged) * 1000) / 10;
    };

    const onTimeRate = rateOf(window.onTime, window.delivered, window.undetermined);
    const previousOnTimeRate = rateOf(
      previousWindow.onTime,
      previousWindow.delivered,
      previousWindow.undetermined
    );

    const activePrevious = activeStillOpenFromBefore + openAtWindowStart;

    res.status(200).json({
      success: true,
      data: {
        windowDays: WINDOW_DAYS,
        // 최근 30일간 생성된 화물 건수
        processed: {
          current: processedCurrent,
          previous: processedPrevious,
          changeRate: computeChangeRate(processedCurrent, processedPrevious)
        },
        // 지금 진행 중인 건수 (delivered / exception 제외 — delayed 는 여전히 운송 중이라 포함)
        active: {
          current: activeCurrent,
          previous: activePrevious,
          changeRate: computeChangeRate(activeCurrent, activePrevious)
        },
        // 약속 기일 내 완료된 비율
        onTime: {
          rate: onTimeRate,
          delivered: window.delivered,
          onTimeCount: window.onTime,
          lateCount: window.late,
          previousRate: previousOnTimeRate,
          // 비율의 변화는 상대 증감률(%)이 아니라 퍼센트포인트 차이로 낸다.
          // 96.4% → 97.4% 를 "+1.0%" 로 적으면 읽는 사람이 97.4 인지 97.4 의 1% 증가인지 알 수 없다.
          changePoint:
            onTimeRate === null || previousOnTimeRate === null
              ? null
              : Math.round((onTimeRate - previousOnTimeRate) * 10) / 10
        }
      },
      updatedAt: now.toISOString(),
      meta: {
        totalShipments,
        windowStart: windowStart.toISOString(),
        previousWindowStart: previousStart.toISOString(),
        /**
         * 완료 시각을 무엇으로 판단했는지 — 수치의 근거를 운영자가 확인할 수 있게 노출한다.
         * updatedAt 이 많다면 상태 변경이 API 를 거치지 않고 들어온 데이터라는 뜻이다.
         */
        completedAtSource: sourceCounts,
        completedAtNote:
          'deliveredAt 필드가 없어 history 의 delivered 전환 timestamp 를 완료 시각으로 씁니다. 이력이 없으면 updatedAt 으로 대체하며(근사치), 그 건수는 completedAtSource.updatedAt 에 표시됩니다.',
        /**
         * 활성 건수의 "이전 값" 은 과거 시점 상태를 복원한 값이다.
         * exception 은 예외 처리된 시각을 알 수 없어(이력에 남는다는 보장이 없다)
         * 과거 시점 집계에서 제외한다 — 지금 exception 인 건은 그 시점에도
         * 활성이 아니었던 것으로 본다.
         */
        activePreviousNote:
          '활성 건수의 이전 값은 생성 시각과 완료 시각으로 30일 전 시점을 복원한 값입니다. exception 처리 시각은 알 수 없어 제외했습니다.',
        note: '증감률은 이전 구간에 비교 대상이 있을 때만 계산하며, 없으면 null 로 내려 화면에서 감춥니다.'
      }
    });
  } catch (error) {
    logger.error('Error building dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: '대시보드 집계에 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/shipments/trend?range=7d|30d|90d
 *
 * 날짜별 신규 집하 / 배송 완료 건수. 대시보드 트렌드 차트가 쓴다.
 *
 * ⚠️ 날짜 경계는 UTC 가 아니라 한국 시간 기준으로 자른다. UTC 로 자르면
 *    한국의 오전 0~9시에 집하된 화물이 전날 칸에 들어가, 운영자가 보는
 *    "오늘 몇 건" 과 어긋난다.
 *
 * 값이 없는 날도 0 으로 채워 내려준다. 빠진 날을 그대로 두면 차트가 없는
 * 구간을 직선으로 이어 버려 "그날도 물량이 있었다" 처럼 보인다.
 */
const TREND_TIMEZONE = 'Asia/Seoul';
const TREND_RANGES = { '7d': 7, '30d': 30, '90d': 90 };
const DEFAULT_TREND_RANGE = '90d';

/** 한국 시간 기준 YYYY-MM-DD. en-CA 로케일이 이 형식을 그대로 준다. */
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TREND_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const toDayKey = (date) => dayKeyFormatter.format(date);

exports.getShipmentTrend = async (req, res) => {
  try {
    const now = new Date();
    const range = TREND_RANGES[req.query.range] ? req.query.range : DEFAULT_TREND_RANGE;
    const days = TREND_RANGES[range];

    // 오늘을 포함해 days 개의 날짜 칸을 미리 만들어 둔다.
    // (한국은 서머타임이 없어 24시간씩 물러나면 날짜가 정확히 하루씩 밀린다)
    const buckets = new Map();
    for (let i = days - 1; i >= 0; i -= 1) {
      const key = toDayKey(new Date(now.getTime() - i * MS_PER_DAY));
      buckets.set(key, { date: key, created: 0, completed: 0 });
    }

    // 시간대 차이만큼 하루 여유를 두고 가져온 뒤, 날짜 키로 정확히 거른다
    const fetchFrom = new Date(now.getTime() - (days + 1) * MS_PER_DAY);

    const [createdByDay, deliveredDocs] = await Promise.all([
      Shipment.aggregate([
        { $match: { createdAt: { $gte: fetchFrom } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: TREND_TIMEZONE
              }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      // 완료 시각은 history 를 봐야 하므로 dashboard-summary 와 같은 유틸로 판단한다
      Shipment.find({ status: DELIVERED_STATUS })
        .select('status updatedAt history.status history.timestamp')
        .lean()
    ]);

    for (const row of createdByDay) {
      const bucket = buckets.get(row._id);
      if (bucket) bucket.created += row.count;
    }

    const sourceCounts = { history: 0, updatedAt: 0, unresolved: 0 };
    for (const doc of deliveredDocs) {
      const { at: completedAt, source } = resolveCompletedAt(doc);
      if (!completedAt) {
        sourceCounts.unresolved += 1;
        continue;
      }
      sourceCounts[source] += 1;

      const bucket = buckets.get(toDayKey(completedAt));
      if (bucket) bucket.completed += 1;
    }

    const points = Array.from(buckets.values());

    res.status(200).json({
      success: true,
      data: {
        range,
        days,
        timezone: TREND_TIMEZONE,
        from: points.length > 0 ? points[0].date : null,
        to: points.length > 0 ? points[points.length - 1].date : null,
        points,
        totals: {
          created: points.reduce((sum, p) => sum + p.created, 0),
          completed: points.reduce((sum, p) => sum + p.completed, 0)
        }
      },
      updatedAt: now.toISOString(),
      meta: {
        completedAtSource: sourceCounts,
        completedAtNote:
          'dashboard-summary 와 같은 기준입니다 — history 의 delivered 전환 timestamp, 없으면 updatedAt.'
      }
    });
  } catch (error) {
    logger.error('Error building shipment trend:', error);
    res.status(500).json({
      success: false,
      error: '화물 추이를 불러오지 못했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/shipments/track/:trackingNumber
 *
 * 고객용 공개 조회. 운송장번호만 알면 누구나 호출할 수 있으므로
 * 기존 getShipmentByTrackingNumber 를 쓰지 않고 별도로 둔다.
 * 그쪽은 문서를 통째로 반환해서 고객 이름/이메일/전화번호와 위치 이력까지
 * 노출된다 — 공개 페이지에 그대로 쓰면 개인정보가 새어나간다.
 *
 * 여기서는 배송 상태 확인에 필요한 필드만 골라서 내려준다.
 */
/**
 * 랜딩 히어로의 운영 현황 패널용 공개 집계.
 *
 * ⚠️ 공개 엔드포인트다. 대시보드용 /delay-summary 는 로그인이 필요하지만,
 *    이쪽은 랜딩(비로그인)에서 부른다. 그래서 운송장번호·구간·고객 정보는
 *    일절 내려주지 않고 등급별 "건수"만 반환한다. 화물 단위 정보가 하나도
 *    없으므로 특정 화주의 배송을 추적하는 데 쓸 수 없다.
 *
 *    다만 회사의 대략적인 운영 규모(진행 중 화물 수)는 공개된다.
 *    이를 공개하고 싶지 않다면 이 엔드포인트를 지우고 히어로 패널을
 *    고정 수치로 바꾸면 된다.
 *
 * dataSource: 시드 합성 데이터(DEMO-)가 섞여 있는지 알려준다.
 *    화면에서 "데모 데이터 기준" 이라고 밝히기 위한 값이다. 합성 수치를
 *    실제 운영 실적처럼 보여주지 않기 위해 서버가 판단해서 내려준다.
 */
exports.getPublicSummary = async (req, res) => {
  try {
    const now = new Date();

    const shipments = await Shipment.find({
      status: { $ne: 'delivered' },
      shippedAt: { $ne: null },
      transportMode: { $ne: null }
    })
      .select('transportMode shippedAt status trackingNumber')
      .lean();

    const counts = {
      [RISK_LEVELS.NORMAL]: 0,
      [RISK_LEVELS.AT_RISK]: 0,
      [RISK_LEVELS.DELAYED]: 0
    };

    let demoCount = 0;

    for (const shipment of shipments) {
      const { level } = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });
      if (level) counts[level] += 1;
      if (String(shipment.trackingNumber).startsWith('DEMO-')) demoCount += 1;
    }

    const inTransit =
      counts[RISK_LEVELS.NORMAL] + counts[RISK_LEVELS.AT_RISK] + counts[RISK_LEVELS.DELAYED];

    const dataSource =
      shipments.length === 0 ? 'empty'
        : demoCount === shipments.length ? 'demo'
          : demoCount > 0 ? 'mixed'
            : 'live';

    res.status(200).json({
      success: true,
      data: {
        inTransit,
        normal: counts[RISK_LEVELS.NORMAL],
        atRisk: counts[RISK_LEVELS.AT_RISK],
        delayed: counts[RISK_LEVELS.DELAYED],
        // 정시 운송 비율 — 화면에서 다시 계산하지 않도록 서버에서 내려준다
        onTimeRate: inTransit === 0 ? null : Math.round((counts[RISK_LEVELS.NORMAL] / inTransit) * 100),
        dataSource,
        updatedAt: now.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error building public summary:', error);
    res.status(500).json({
      success: false,
      error: '운영 현황을 불러오지 못했습니다.'
    });
  }
};

/**
 * 공개 조회 페이지의 "예시 운송장번호" 안내용.
 *
 * 목록 API(GET /api/shipments)는 구간·상태가 전부 담겨 있어 로그인 뒤로 옮겼는데,
 * 조회 화면의 데모 안내에는 번호 몇 개가 필요하다. 그래서 번호만 내려주는
 * 공개 엔드포인트를 따로 둔다.
 *
 * TODO: 실제 배송 데이터가 연결되면 데모 안내와 함께 이 엔드포인트도 삭제하세요.
 */
exports.getTrackingSamples = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);

    const shipments = await Shipment.find({ trackingNumber: /^DEMO-/ })
      .select('trackingNumber -_id')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: shipments.map((s) => s.trackingNumber)
    });
  } catch (error) {
    logger.error('Error fetching tracking samples:', error);
    res.status(500).json({
      success: false,
      error: '예시 번호를 불러오지 못했습니다.'
    });
  }
};

exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const now = new Date();

    const shipment = await Shipment.findOne({ trackingNumber })
      .select('trackingNumber transportMode status shippedAt estimatedArrivalAt estimatedDelivery origin.address destination.address currentLocation.address')
      .lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: '운송장번호를 찾을 수 없습니다. 번호를 다시 확인해 주세요.'
      });
    }

    const risk = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });

    res.status(200).json({
      success: true,
      data: {
        trackingNumber: shipment.trackingNumber,
        transportMode: shipment.transportMode ?? null,
        status: shipment.status,
        origin: shipment.origin?.address ?? null,
        destination: shipment.destination?.address ?? null,
        currentLocation: shipment.currentLocation?.address ?? null,
        shippedAt: shipment.shippedAt ?? null,
        estimatedArrivalAt: shipment.estimatedArrivalAt ?? shipment.estimatedDelivery ?? null,
        delayRisk: {
          level: risk.level,
          score: risk.score,
          elapsedDays: risk.elapsedDays,
          standardDays: risk.standardDays,
          standardSource: risk.source,
          skipped: risk.skipped
        }
      }
    });
  } catch (error) {
    logger.error('Error tracking shipment:', error);
    res.status(500).json({
      success: false,
      error: '조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get shipment ETA
exports.getShipmentETA = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Calculate remaining distance and time
    const currentLocation = shipment.currentLocation.coordinates;
    const destination = shipment.destination.coordinates;
    
    // Calculate distance using Haversine formula
    const distance = calculateDistance(currentLocation, destination);
    
    // Assume average speed of 50 km/h for ground transport
    const averageSpeed = 50; // km/h
    const estimatedTimeHours = distance / averageSpeed;
    
    const eta = new Date();
    eta.setHours(eta.getHours() + estimatedTimeHours);
    
    res.json({
      trackingNumber: shipment.trackingNumber,
      currentLocation: shipment.currentLocation,
      destination: shipment.destination,
      distance: distance.toFixed(2), // km
      estimatedTimeHours: estimatedTimeHours.toFixed(2),
      eta: eta,
      status: shipment.status
    });
  } catch (error) {
    logger.error('Error calculating ETA:', error);
    res.status(500).json({ error: 'Failed to calculate ETA' });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2[1] - point1[1]);
  const dLon = toRad(point2[0] - point1[0]);
  const lat1 = toRad(point1[1]);
  const lat2 = toRad(point2[1]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

// Update shipment status
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, description } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    // Update status
    shipment.status = status;
    
    // Add to history
    shipment.history.push({
      location: shipment.currentLocation,
      status,
      description: description || `Status updated to ${status}`,
      timestamp: new Date()
    });
    
    await shipment.save();

    logger.info(`Shipment ${trackingNumber} status updated to ${status}`);

    // 배송완료 / 지연위험 알림 트리거 (실패해도 상태 변경은 이미 저장됐다)
    await shipmentEvents.handleShipmentSaved(shipment);

    res.status(200).json({
      success: true,
      data: shipment,
      message: 'Shipment status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating shipment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shipment status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get shipment route distance
exports.getShipmentRouteDistance = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({ 
        success: false,
        error: 'Shipment not found' 
      });
    }
    
    // Calculate distance from origin to current location
    let distanceTraveled = calculateDistance(
      shipment.origin.coordinates,
      shipment.currentLocation.coordinates
    );
    
    // Calculate distance from current location to destination
    const remainingDistance = calculateDistance(
      shipment.currentLocation.coordinates,
      shipment.destination.coordinates
    );
    
    // Calculate total route distance (origin to destination)
    let totalDistance = calculateDistance(
      shipment.origin.coordinates,
      shipment.destination.coordinates
    );
    
    // Include checkpoints in distance calculation if they exist
    let checkpointDistances = [];
    if (shipment.checkpoints && shipment.checkpoints.length > 0) {
      // Add origin as the first point
      let routePoints = [shipment.origin.coordinates];
      
      // Add all checkpoints in order
      shipment.checkpoints.forEach(checkpoint => {
        routePoints.push(checkpoint.location.coordinates);
      });
      
      // Add destination as the last point
      routePoints.push(shipment.destination.coordinates);
      
      // Calculate total distance with checkpoints
      totalDistance = 0;
      for (let i = 0; i < routePoints.length - 1; i++) {
        const segmentDistance = calculateDistance(routePoints[i], routePoints[i + 1]);
        totalDistance += segmentDistance;
        
        // If this is a checkpoint segment, add to checkpoint distances
        if (i > 0 && i < routePoints.length - 2) {
          checkpointDistances.push({
            checkpointName: shipment.checkpoints[i - 1].name,
            distance: segmentDistance.toFixed(2)
          });
        }
      }
      
      // Recalculate distance traveled considering checkpoints
      let traveled = 0;
      let currentFound = false;
      
      for (let i = 0; i < routePoints.length - 1; i++) {
        const segmentDistance = calculateDistance(routePoints[i], routePoints[i + 1]);
        
        // If we haven't found the current location yet, add this segment's distance
        if (!currentFound) {
          // Check if current location is between these two points
          const distanceToStart = calculateDistance(routePoints[i], shipment.currentLocation.coordinates);
          const distanceToEnd = calculateDistance(shipment.currentLocation.coordinates, routePoints[i + 1]);
          
          if (distanceToStart + distanceToEnd <= segmentDistance * 1.1) { // 10% margin for error
            traveled += distanceToStart;
            currentFound = true;
          } else {
            traveled += segmentDistance;
          }
        }
      }
      
      // Update distanceTraveled if we found the current location along the route
      if (currentFound) {
        distanceTraveled = traveled;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        trackingNumber: shipment.trackingNumber,
        distanceTraveled: distanceTraveled.toFixed(2), // km
        remainingDistance: remainingDistance.toFixed(2), // km
        totalDistance: totalDistance.toFixed(2), // km
        progress: Math.min(Math.round((distanceTraveled / totalDistance) * 100), 99), // percentage
        checkpoints: shipment.checkpoints.map(cp => ({
          name: cp.name,
          address: cp.location.address,
          reached: cp.reached,
          estimatedArrival: cp.estimatedArrival
        })),
        checkpointDistances: checkpointDistances
      }
    });
  } catch (error) {
    logger.error('Error calculating route distance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate route distance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update shipment location manually
exports.updateShipmentLocationManually = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { coordinates, address, status, description } = req.body;
    
    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Valid coordinates [longitude, latitude] are required'
      });
    }
    
    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    // Update current location
    shipment.currentLocation = {
      type: 'Point',
      coordinates: coordinates,
      address: address,
      timestamp: new Date()
    };
    
    // Update status if provided
    if (status) {
      shipment.status = status;
    }
    
    // Add to history
    shipment.history.push({
      location: shipment.currentLocation,
      status: status || shipment.status,
      description: description || 'Location updated manually',
      timestamp: new Date()
    });
    
    await shipment.save();
    
    logger.info(`Shipment ${trackingNumber} location updated manually`);

    await shipmentEvents.handleShipmentSaved(shipment);

    res.status(200).json({
      success: true,
      data: shipment,
      message: 'Shipment location updated successfully'
    });
  } catch (error) {
    logger.error('Error updating shipment location manually:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shipment location',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add a checkpoint to shipment
exports.addCheckpoint = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { location, name, estimatedArrival, notes } = req.body;
    
    // Validate required fields
    if (!location || !location.coordinates || !location.address) {
      return res.status(400).json({
        success: false,
        error: 'Location with coordinates and address is required'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Checkpoint name is required'
      });
    }
    
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    // Create new checkpoint
    const newCheckpoint = {
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        timestamp: new Date()
      },
      name,
      estimatedArrival: estimatedArrival || null,
      reached: false,
      notes: notes || ''
    };
    
    // Add to checkpoints array
    shipment.checkpoints.push(newCheckpoint);
    
    await shipment.save();
    
    logger.info(`Checkpoint added to shipment ${trackingNumber}`);
    
    res.status(200).json({
      success: true,
      data: shipment,
      message: 'Checkpoint added successfully'
    });
  } catch (error) {
    logger.error('Error adding checkpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add checkpoint',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a checkpoint
exports.updateCheckpoint = async (req, res) => {
  try {
    const { trackingNumber, checkpointId } = req.params;
    const { name, estimatedArrival, reached, notes, location } = req.body;
    
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    // Find the checkpoint
    const checkpoint = shipment.checkpoints.id(checkpointId);
    
    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        error: 'Checkpoint not found'
      });
    }
    
    // Update fields if provided
    if (name) checkpoint.name = name;
    if (estimatedArrival !== undefined) checkpoint.estimatedArrival = estimatedArrival;
    if (reached !== undefined) checkpoint.reached = reached;
    if (notes !== undefined) checkpoint.notes = notes;
    
    // Update location if provided
    if (location && location.coordinates && location.address) {
      checkpoint.location = {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        timestamp: new Date()
      };
    }
    
    // If checkpoint is marked as reached, add to history
    if (reached && !checkpoint.reached) {
      shipment.history.push({
        location: shipment.currentLocation,
        status: shipment.status,
        description: `Checkpoint reached: ${checkpoint.name}`,
        timestamp: new Date()
      });
      
      checkpoint.reached = true;
    }
    
    await shipment.save();
    
    logger.info(`Checkpoint ${checkpointId} updated for shipment ${trackingNumber}`);
    
    res.status(200).json({
      success: true,
      data: shipment,
      message: 'Checkpoint updated successfully'
    });
  } catch (error) {
    logger.error('Error updating checkpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update checkpoint',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a checkpoint
exports.deleteCheckpoint = async (req, res) => {
  try {
    const { trackingNumber, checkpointId } = req.params;
    
    const shipment = await Shipment.findOne({ trackingNumber });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }
    
    // Find and remove the checkpoint
    const checkpoint = shipment.checkpoints.id(checkpointId);
    
    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        error: 'Checkpoint not found'
      });
    }
    
    checkpoint.remove();
    
    await shipment.save();
    
    logger.info(`Checkpoint ${checkpointId} deleted from shipment ${trackingNumber}`);
    
    res.status(200).json({
      success: true,
      data: shipment,
      message: 'Checkpoint deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting checkpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete checkpoint',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
