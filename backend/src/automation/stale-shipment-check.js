const Shipment = require('../models/shipment.model');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const { runWithLog } = require('./run-with-log');

/**
 * 방치된 화물 감지 — 6시간마다
 *
 * 운송 중(in_transit)인데 며칠째 상태가 갱신되지 않은 화물을 찾는다.
 * 화물이 늦은 것과 화물 기록이 방치된 것은 다른 문제다. 지연 리스크는 예정일
 * 대비로 계산되므로 표준 소요일이 긴 해상 건은 2주가 지나도 "정상"으로 나오지만,
 * 그동안 아무도 상태를 갱신하지 않았다면 담당자가 잊고 있는 것에 가깝다.
 * 고객이 먼저 전화해서 알게 되는 상황을 막는 게 목적이다.
 *
 * 판단 기준은 마지막 history 항목의 시각이다 (= 실제로 상태를 갱신한 시점).
 * updatedAt 은 리스크 스냅샷 재저장 같은 내부 변경에도 갱신돼서 기준으로 쓰면
 * 방치된 화물을 놓친다.
 */

const JOB_NAME = 'stale-shipment-check';
const DAY_MS = 24 * 60 * 60 * 1000;

/** 며칠 이상 갱신이 없으면 방치로 볼지 */
const DEFAULT_STALE_DAYS = 3;

/** 마지막으로 상태가 갱신된 시각. history → shippedAt → createdAt 순으로 찾는다. */
const lastStatusUpdateAt = (shipment) => {
  const history = shipment.history ?? [];
  if (history.length > 0) {
    const timestamps = history
      .map((entry) => entry.timestamp)
      .filter(Boolean)
      .map((t) => new Date(t).getTime());

    if (timestamps.length > 0) return new Date(Math.max(...timestamps));
  }

  return shipment.shippedAt ?? shipment.createdAt ?? null;
};

const checkStaleShipments = async (now, staleDays) => {
  const cutoff = new Date(now.getTime() - staleDays * DAY_MS);

  /*
   * 운송 중 화물 전체를 가져와 마지막 갱신 시각을 코드에서 계산한다.
   * 배열의 마지막 원소로 거르는 건 인덱스를 못 타서 쿼리로 표현하기 어렵다.
   * 화물 건수가 커지면 lastStatusUpdateAt 를 문서에 비정규화해 두고
   * 인덱스를 걸어 쿼리로 거르도록 바꾸면 된다.
   */
  const shipments = await Shipment.find({ status: 'in_transit' })
    .select('trackingNumber status history shippedAt createdAt')
    .lean();

  const stale = [];

  for (const shipment of shipments) {
    const lastUpdate = lastStatusUpdateAt(shipment);
    if (!lastUpdate || lastUpdate > cutoff) continue;

    const daysSinceUpdate = Math.floor((now - lastUpdate) / DAY_MS);
    stale.push({ trackingNumber: shipment.trackingNumber, daysSinceUpdate });

    await notificationService.notifyStaleShipment(shipment, daysSinceUpdate, { now });
  }

  if (stale.length > 0) {
    logger.warn(
      `[방치 화물 감지] ${stale.length}건: ` +
        stale.map((s) => `${s.trackingNumber}(${s.daysSinceUpdate}일)`).join(', ')
    );
  }

  return {
    checkedAt: now.toISOString(),
    staleDaysThreshold: staleDays,
    inTransitScanned: shipments.length,
    staleFound: stale.length,
    // 어떤 화물이 걸렸는지 기록에 남긴다 (너무 길어지지 않도록 상위 20건만)
    staleShipments: stale.slice(0, 20)
  };
};

/**
 * @param {{now?: Date, staleDays?: number, trigger?: 'schedule'|'manual'}} [options]
 */
const runStaleShipmentCheck = (options = {}) => {
  const { now = new Date(), staleDays = DEFAULT_STALE_DAYS, trigger } = options;
  return runWithLog(JOB_NAME, () => checkStaleShipments(now, staleDays), { trigger });
};

module.exports = {
  runStaleShipmentCheck,
  lastStatusUpdateAt,
  JOB_NAME,
  DEFAULT_STALE_DAYS
};
