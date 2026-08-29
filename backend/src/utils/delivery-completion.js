/**
 * 배송 "완료 시각" 판정
 *
 * ⚠️ Shipment 스키마에는 deliveredAt 같은 완료 시각 필드가 없다.
 *    (models/shipment.model.js 확인 — status / estimatedDelivery / history 만 있다)
 *
 * 상태 변경은 history 배열에 { status, timestamp } 로 쌓인다:
 *   - controllers/shipment.controller.js updateShipmentStatus  → history.push({ status, timestamp: new Date() })
 *   - models/shipment.model.js updateLocation                  → 같은 형태로 push
 * 그래서 status 가 'delivered' 로 바뀐 이력 항목의 timestamp 가 실제 완료 시각이다.
 *
 * 두 가지를 조심한다.
 *
 * 1) 'delivered' 이력이 여러 개일 수 있다.
 *    실제 DB 에 완료 처리 후 되돌린 화물이 있다(DEMO-0025-TRK: delivered → in_transit,
 *    "알림 트리거 검증" 후 "검증 후 원복"). 지금 status 가 delivered 라면 마지막
 *    delivered 전환이 실제 완료 시점이므로 가장 최근 timestamp 를 쓴다.
 *    (가장 오래된 것을 쓰면 되돌렸다 다시 완료한 화물의 완료일이 과거로 튄다)
 *
 * 2) 이력이 없는 화물이 있다.
 *    시드 스크립트(scripts/seed-shipments.js)는 집하 시점 in_transit 이력만 넣는다.
 *    외부에서 import 된 데이터에도 이력이 없을 수 있으므로 updatedAt 으로 폴백한다.
 *    updatedAt 은 "마지막 수정 시각" 이지 완료 시각이 아니다 — 완료 후 다른 필드를
 *    고치면 뒤로 밀린다. 그래서 폴백을 썼다는 사실을 집계 응답의 meta 로 노출해
 *    운영자가 수치의 근거를 알 수 있게 한다.
 */

const DELIVERED_STATUS = 'delivered';

/** 완료 시각의 출처 — 집계 응답 meta 로 그대로 나간다 */
const COMPLETION_SOURCES = {
  /** history 의 delivered 전환 timestamp (정확) */
  HISTORY: 'history',
  /** delivered 이력이 없어 updatedAt 으로 대체 (근사) */
  UPDATED_AT: 'updatedAt',
  /** 둘 다 없어 완료 시각을 특정할 수 없음 (집계에서 제외) */
  NONE: 'none'
};

/**
 * 배송 완료 시각과 그 근거를 돌려준다.
 *
 * @param {object} shipment  status / history / updatedAt 을 가진 문서 (lean 객체 가능)
 * @returns {{ at: Date|null, source: string }}
 */
const resolveCompletedAt = (shipment) => {
  if (!shipment || shipment.status !== DELIVERED_STATUS) {
    return { at: null, source: COMPLETION_SOURCES.NONE };
  }

  let latest = null;
  for (const entry of shipment.history || []) {
    if (!entry || entry.status !== DELIVERED_STATUS || !entry.timestamp) continue;
    const timestamp = new Date(entry.timestamp);
    if (Number.isNaN(timestamp.getTime())) continue;
    if (!latest || timestamp > latest) latest = timestamp;
  }

  if (latest) return { at: latest, source: COMPLETION_SOURCES.HISTORY };

  if (shipment.updatedAt) {
    const fallback = new Date(shipment.updatedAt);
    if (!Number.isNaN(fallback.getTime())) {
      return { at: fallback, source: COMPLETION_SOURCES.UPDATED_AT };
    }
  }

  return { at: null, source: COMPLETION_SOURCES.NONE };
};

/**
 * 약속 기일(estimatedDelivery) 안에 끝났는지.
 * 기일이 없으면 판정할 수 없으므로 null 을 돌려 집계에서 빼도록 한다.
 *
 * 경계(완료 시각 == 약속 기일)는 정시로 본다. 기일"까지"가 약속이므로
 * 그 순간에 도착한 건을 지연으로 세면 안 된다.
 */
const isOnTime = (completedAt, estimatedDelivery) => {
  if (!completedAt || !estimatedDelivery) return null;
  const due = new Date(estimatedDelivery);
  if (Number.isNaN(due.getTime())) return null;
  return completedAt.getTime() <= due.getTime();
};

/**
 * 기간 대비 증감률(%).
 *
 * 이전 값이 0 이거나 없으면 null 을 돌려준다. 0 에서 늘어난 것은 증감률로
 * 표현할 수 없고(분모가 0), 화면에서 "+∞%" 나 "+3600%" 같은 숫자를 보여주는
 * 것보다 배지를 감추는 편이 정직하다.
 */
const computeChangeRate = (current, previous) => {
  if (typeof current !== 'number' || typeof previous !== 'number') return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

module.exports = {
  DELIVERED_STATUS,
  COMPLETION_SOURCES,
  resolveCompletedAt,
  isOnTime,
  computeChangeRate
};
