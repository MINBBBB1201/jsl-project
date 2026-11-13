const TRANSIT_TIMES = require("../../config/transit-times");
const { calculateDelayRisk } = require("../../utils/delay-risk");

/**
 * 목록 조회 응답에서 제외할 고객 개인정보.
 *
 * 목록은 로그인한 직원만 볼 수 있지만(routes/shipment.routes.js 참고), 화면에서
 * 쓰지도 않는 연락처를 수십 건씩 한꺼번에 내려줄 이유는 없다. 개인정보처리방침의
 * 최소제공 원칙에 따라 목록에서는 customer 를 빼고, 필요한 경우 단건 상세
 * (GET /:trackingNumber) 로만 확인한다.
 */
const PII_EXCLUDED_FIELDS = "-customer";

/** 이미 조회된 문서에서 고객 개인정보를 떼어낸다 (select 를 못 쓰는 경우용) */
const stripPii = (shipment) => {
  if (!shipment) return shipment;
  const plain =
    typeof shipment.toObject === "function"
      ? shipment.toObject()
      : { ...shipment };
  delete plain.customer;
  return plain;
};

/**
 * 저장된 delayRiskScore/Level 은 시간이 지나면 낡으므로, 응답을 만들 때
 * 조회 시점 기준으로 다시 계산해 덮어쓴다.
 */
const withFreshRisk = (shipment, now) => {
  const plain =
    typeof shipment.toObject === "function"
      ? shipment.toObject()
      : { ...shipment };
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
      skipped: risk.skipped,
    },
  };
};

// Helper function to generate a tracking number
const generateTrackingNumber = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 11) result += "-";
  }
  return result;
};

// Calculate estimated delivery date (simple implementation - could be enhanced with distance calculation)
const calculateEstimatedDelivery = () => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3); // Default 3 days from now
  return deliveryDate;
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2[1] - point1[1]);
  const dLon = toRad(point2[0] - point1[0]);
  const lat1 = toRad(point1[1]);
  const lat2 = toRad(point2[1]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

module.exports = {
  PII_EXCLUDED_FIELDS,
  stripPii,
  withFreshRisk,
  generateTrackingNumber,
  calculateEstimatedDelivery,
  calculateDistance,
  toRad,
};
