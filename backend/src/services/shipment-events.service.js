const Shipment = require('../models/shipment.model');
const TRANSIT_TIMES = require('../config/transit-times');
const { calculateDelayRisk, RISK_LEVELS } = require('../utils/delay-risk');
const notificationService = require('./notification.service');

/**
 * 화물 변화에서 알림 트리거를 판단하는 곳.
 *
 * 지연 리스크는 저장된 값이 아니라 조회 시점에 다시 계산하는 값이라
 * (delay-risk.js 참고) "값이 바뀌는 순간"이라는 게 없다. 그래서 두 갈래로 잡는다.
 *
 *   1) 화물을 저장할 때        → handleShipmentSaved
 *      운영자가 상태/위치를 바꾸는 순간 바로 알림이 뜬다.
 *   2) 주기적으로 전체를 훑을 때 → scanDelayRisk
 *      아무도 건드리지 않아도 시간이 지나면 위험군으로 넘어가는 화물이 있다.
 *      이쪽이 실제로 대부분을 잡아낸다.
 *
 * 두 경로가 같은 화물을 동시에 잡아도 알림은 하루 한 건만 남는다
 * (notification.service 의 dedupeKey).
 */

const isRisky = (level) =>
  level === RISK_LEVELS.AT_RISK || level === RISK_LEVELS.DELAYED;

/**
 * 화물 저장 직후 호출한다.
 * @returns {Promise<object|null>} 생성된 알림 (없으면 null)
 */
exports.handleShipmentSaved = async (shipment, options = {}) => {
  const { now = new Date() } = options;

  if (shipment.status === 'delivered') {
    return notificationService.notifyDelivered(shipment);
  }

  const risk = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });
  if (!isRisky(risk.level)) return null;

  return notificationService.notifyDelayRisk(shipment, risk.level, { now });
};

/**
 * 배송 중인 전체 화물의 지연 리스크를 훑어 알림을 만든다.
 *
 * 자동화 작업(daily-ops-digest)에서 호출한다.
 * @returns {Promise<{scanned:number, atRisk:number, delayed:number, created:number}>}
 */
exports.scanDelayRisk = async (options = {}) => {
  const { now = new Date() } = options;

  const shipments = await Shipment.find({
    status: { $ne: 'delivered' },
    shippedAt: { $ne: null },
    transportMode: { $ne: null }
  }).select('trackingNumber transportMode shippedAt status');

  const result = { scanned: shipments.length, atRisk: 0, delayed: 0, created: 0 };

  for (const shipment of shipments) {
    const { level } = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });

    if (level === RISK_LEVELS.AT_RISK) result.atRisk += 1;
    else if (level === RISK_LEVELS.DELAYED) result.delayed += 1;
    else continue;

    const created = await notificationService.notifyDelayRisk(shipment, level, { now });
    if (created) result.created += 1;
  }

  return result;
};
