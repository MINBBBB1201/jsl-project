const Notification = require('../models/notification.model');
const { NOTIFICATION_TYPES } = require('../models/notification.model');
const logger = require('../utils/logger');

/**
 * 알림 생성 지점을 한 곳으로 모은 서비스.
 *
 * 컨트롤러·자동화 작업이 각자 Notification.create 를 부르면 문구와 중복 방지
 * 규칙이 흩어진다. 여기 함수만 쓰도록 하면 나중에 이메일/Slack 발송을 붙일 때도
 * 이 파일 한 곳만 고치면 된다.
 *
 * 규칙: 알림 생성 실패가 본 작업을 실패시키면 안 된다.
 *       문의는 접수됐는데 알림 저장이 실패했다고 해서 500 을 돌려주면,
 *       고객은 문의가 접수되지 않은 줄 알고 다시 보낸다. 그래서 모든 함수는
 *       실패를 로그로만 남기고 null 을 반환한다.
 */

/**
 * KST 기준 날짜 키 (YYYY-MM-DD).
 *
 * 중복 방지를 "하루 1건" 으로 정의하려면 어느 시간대의 하루인지 정해야 한다.
 * 운영팀이 한국에 있으므로 KST 자정을 경계로 삼는다. 서버가 UTC 로 떠 있어도
 * 결과가 같도록 오프셋을 직접 더한다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const kstDateKey = (date = new Date()) =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

/**
 * 알림 저장.
 * dedupeKey 가 이미 있으면 조용히 건너뛴다(유니크 인덱스 위반 = 이미 알린 사건).
 * @returns {Promise<object|null>} 새로 만들어진 알림, 중복이거나 실패면 null
 */
const create = async ({ type, message, shipment, dedupeKey }) => {
  try {
    return await Notification.create({
      type,
      message,
      relatedShipmentId: shipment?._id,
      relatedTrackingNumber: shipment?.trackingNumber,
      dedupeKey
    });
  } catch (error) {
    // 11000 = duplicate key. 같은 사건을 이미 알린 것이므로 정상 흐름이다.
    if (error.code === 11000) return null;

    logger.error(`알림 생성 실패 (${type}):`, error);
    return null;
  }
};

/** 신규 문의 접수 */
exports.notifyNewContact = (contact) =>
  create({
    type: NOTIFICATION_TYPES.CONTACT,
    message: `신규 문의: ${contact.companyName || contact.contactName || '이름 미기재'}`
  });

/**
 * 지연위험/지연 감지.
 * 같은 화물은 KST 하루에 한 번만 알린다.
 */
exports.notifyDelayRisk = (shipment, riskLevel, options = {}) => {
  const { now = new Date() } = options;

  return create({
    type: NOTIFICATION_TYPES.DELAY_RISK,
    message: `지연 위험 화물: ${shipment.trackingNumber} (${riskLevel})`,
    shipment,
    dedupeKey: `delay-risk:${shipment.trackingNumber}:${kstDateKey(now)}`
  });
};

/**
 * 배송 완료.
 * 화물당 한 번만 알린다 (상태를 되돌렸다가 다시 delivered 로 바꿔도 재알림 없음).
 */
exports.notifyDelivered = (shipment) =>
  create({
    type: NOTIFICATION_TYPES.DELIVERED,
    message: `배송완료: ${shipment.trackingNumber}`,
    shipment,
    dedupeKey: `delivered:${shipment.trackingNumber}`
  });

/**
 * 오래 갱신되지 않은 운송 중 화물.
 * 같은 화물은 KST 하루에 한 번만 알린다.
 */
exports.notifyStaleShipment = (shipment, daysSinceUpdate, options = {}) => {
  const { now = new Date() } = options;

  return create({
    type: NOTIFICATION_TYPES.STALE_SHIPMENT,
    message:
      `방치된 화물: ${shipment.trackingNumber} — ` +
      `${daysSinceUpdate}일째 상태 업데이트 없음`,
    shipment,
    dedupeKey: `stale-shipment:${shipment.trackingNumber}:${kstDateKey(now)}`
  });
};

exports.kstDateKey = kstDateKey;
