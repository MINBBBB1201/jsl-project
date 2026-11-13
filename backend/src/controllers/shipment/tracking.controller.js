const Shipment = require("../../models/shipment.model");
const logger = require("../../utils/logger");
const TRANSIT_TIMES = require("../../config/transit-times");
const { calculateDelayRisk, RISK_LEVELS } = require("../../utils/delay-risk");
const { PII_EXCLUDED_FIELDS, withFreshRisk, calculateDistance } = require("./shared");

/**
 * GET /api/shipments/:trackingNumber — 내부 상세 조회
 *
 * 로그인한 직원만 부를 수 있다 (routes/shipment.routes.js 의 requireAuth).
 * 목록과 달리 고객 이름·이메일·전화번호와 상태 이력까지 문서를 통째로 내려준다.
 *
 * ⚠️ 목록(getAllShipments)의 PII_EXCLUDED_FIELDS 정책과 여기가 다른 것은 의도다.
 *    목록은 화면에서 쓰지도 않는 연락처를 수십 건씩 한꺼번에 내보낼 이유가 없어
 *    빼지만, 상세는 담당자가 그 한 건을 처리하려고 여는 화면이라 연락처가 필요하다.
 *    (개인정보 최소제공 = 목적에 필요한 만큼만, 이지 무조건 감추기가 아니다)
 *
 * 고객이 로그인 없이 부르는 공개 조회는 이 함수가 아니라 trackShipment 다.
 * 그쪽은 별도 화이트리스트 select 를 써서 customer 를 애초에 읽지 않는다.
 */
exports.getShipmentByTrackingNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // 목록과 같이 조회 시점 기준으로 리스크를 다시 계산해 delayRisk 를 붙인다.
    // 문서에 저장된 delayRiskScore/Level 은 마지막 저장 시점의 스냅샷이라
    // 시간이 지나면 낡는다 (shipment.model.js 의 경고 참고). 여기만 빠져 있어서
    // 상세 화면이 목록과 다른 등급을 보여줄 수 있었다.
    res.status(200).json({
      success: true,
      data: withFreshRisk(shipment, new Date()),
    });
  } catch (error) {
    logger.error("Error fetching shipment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shipment",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
      status: { $ne: "delivered" },
      shippedAt: { $ne: null },
      transportMode: { $ne: null },
    })
      .select("transportMode shippedAt status trackingNumber")
      .lean();

    const counts = {
      [RISK_LEVELS.NORMAL]: 0,
      [RISK_LEVELS.AT_RISK]: 0,
      [RISK_LEVELS.DELAYED]: 0,
    };

    let demoCount = 0;

    for (const shipment of shipments) {
      const { level } = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });
      if (level) counts[level] += 1;
      if (String(shipment.trackingNumber).startsWith("DEMO-")) demoCount += 1;
    }

    const inTransit =
      counts[RISK_LEVELS.NORMAL] +
      counts[RISK_LEVELS.AT_RISK] +
      counts[RISK_LEVELS.DELAYED];

    const dataSource =
      shipments.length === 0
        ? "empty"
        : demoCount === shipments.length
          ? "demo"
          : demoCount > 0
            ? "mixed"
            : "live";

    res.status(200).json({
      success: true,
      data: {
        inTransit,
        normal: counts[RISK_LEVELS.NORMAL],
        atRisk: counts[RISK_LEVELS.AT_RISK],
        delayed: counts[RISK_LEVELS.DELAYED],
        // 정시 운송 비율 — 화면에서 다시 계산하지 않도록 서버에서 내려준다
        onTimeRate:
          inTransit === 0
            ? null
            : Math.round((counts[RISK_LEVELS.NORMAL] / inTransit) * 100),
        dataSource,
        updatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error building public summary:", error);
    res.status(500).json({
      success: false,
      error: "운영 현황을 불러오지 못했습니다.",
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
      .select("trackingNumber -_id")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: shipments.map((s) => s.trackingNumber),
    });
  } catch (error) {
    logger.error("Error fetching tracking samples:", error);
    res.status(500).json({
      success: false,
      error: "예시 번호를 불러오지 못했습니다.",
    });
  }
};

exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const now = new Date();

    const shipment = await Shipment.findOne({ trackingNumber })
      .select(
        "trackingNumber transportMode status shippedAt estimatedArrivalAt estimatedDelivery origin.address destination.address currentLocation.address",
      )
      .lean();

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "운송장번호를 찾을 수 없습니다. 번호를 다시 확인해 주세요.",
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
        estimatedArrivalAt:
          shipment.estimatedArrivalAt ?? shipment.estimatedDelivery ?? null,
        delayRisk: {
          level: risk.level,
          score: risk.score,
          elapsedDays: risk.elapsedDays,
          standardDays: risk.standardDays,
          standardSource: risk.source,
          skipped: risk.skipped,
        },
      },
    });
  } catch (error) {
    logger.error("Error tracking shipment:", error);
    res.status(500).json({
      success: false,
      error: "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get shipment ETA
exports.getShipmentETA = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
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
      status: shipment.status,
    });
  } catch (error) {
    logger.error("Error calculating ETA:", error);
    res.status(500).json({ error: "Failed to calculate ETA" });
  }
};

// Get shipment history
exports.getShipmentHistory = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await Shipment.findOne({ trackingNumber }, "history");

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: shipment.history,
    });
  } catch (error) {
    logger.error("Error fetching shipment history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shipment history",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get nearby shipments
exports.getNearbyShipments = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // Default 10km

    const shipments = await Shipment.find({
      "currentLocation.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
      // 여러 건을 돌려주는 목록이라 getAllShipments 와 같이 연락처를 뺀다.
    }).select(PII_EXCLUDED_FIELDS);

    res.status(200).json({
      success: true,
      data: shipments,
    });
  } catch (error) {
    logger.error("Error fetching nearby shipments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch nearby shipments",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
        error: "Shipment not found",
      });
    }

    // Calculate distance from origin to current location
    let distanceTraveled = calculateDistance(
      shipment.origin.coordinates,
      shipment.currentLocation.coordinates,
    );

    // Calculate distance from current location to destination
    const remainingDistance = calculateDistance(
      shipment.currentLocation.coordinates,
      shipment.destination.coordinates,
    );

    // Calculate total route distance (origin to destination)
    let totalDistance = calculateDistance(
      shipment.origin.coordinates,
      shipment.destination.coordinates,
    );

    // Include checkpoints in distance calculation if they exist
    let checkpointDistances = [];
    if (shipment.checkpoints && shipment.checkpoints.length > 0) {
      // Add origin as the first point
      let routePoints = [shipment.origin.coordinates];

      // Add all checkpoints in order
      shipment.checkpoints.forEach((checkpoint) => {
        routePoints.push(checkpoint.location.coordinates);
      });

      // Add destination as the last point
      routePoints.push(shipment.destination.coordinates);

      // Calculate total distance with checkpoints
      totalDistance = 0;
      for (let i = 0; i < routePoints.length - 1; i++) {
        const segmentDistance = calculateDistance(
          routePoints[i],
          routePoints[i + 1],
        );
        totalDistance += segmentDistance;

        // If this is a checkpoint segment, add to checkpoint distances
        if (i > 0 && i < routePoints.length - 2) {
          checkpointDistances.push({
            checkpointName: shipment.checkpoints[i - 1].name,
            distance: segmentDistance.toFixed(2),
          });
        }
      }

      // Recalculate distance traveled considering checkpoints
      let traveled = 0;
      let currentFound = false;

      for (let i = 0; i < routePoints.length - 1; i++) {
        const segmentDistance = calculateDistance(
          routePoints[i],
          routePoints[i + 1],
        );

        // If we haven't found the current location yet, add this segment's distance
        if (!currentFound) {
          // Check if current location is between these two points
          const distanceToStart = calculateDistance(
            routePoints[i],
            shipment.currentLocation.coordinates,
          );
          const distanceToEnd = calculateDistance(
            shipment.currentLocation.coordinates,
            routePoints[i + 1],
          );

          if (distanceToStart + distanceToEnd <= segmentDistance * 1.1) {
            // 10% margin for error
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
        progress: Math.min(
          Math.round((distanceTraveled / totalDistance) * 100),
          99,
        ), // percentage
        checkpoints: shipment.checkpoints.map((cp) => ({
          name: cp.name,
          address: cp.location.address,
          reached: cp.reached,
          estimatedArrival: cp.estimatedArrival,
        })),
        checkpointDistances: checkpointDistances,
      },
    });
  } catch (error) {
    logger.error("Error calculating route distance:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate route distance",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
