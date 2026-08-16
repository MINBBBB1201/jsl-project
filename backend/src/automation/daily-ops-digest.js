const Contact = require('../models/contact.model');
const Notification = require('../models/notification.model');
const logger = require('../utils/logger');
const shipmentEvents = require('../services/shipment-events.service');
const { runWithLog } = require('./run-with-log');

/**
 * 일일 운영 다이제스트 — 매일 오전 9시(KST)
 *
 * 아침에 출근해서 "어제 무슨 일이 있었나"를 한눈에 보게 하는 작업이다.
 * 웹 요청과 무관하게 스스로 실행되며, 아무도 화면을 열지 않아도 돌아간다.
 *
 * 하는 일
 *   1. 배송 중인 전체 화물의 지연 리스크를 다시 계산해 집계하고,
 *      위험군은 알림을 만든다 (하루 한 건으로 제한 — notification.service 참고).
 *      운영자가 아무것도 건드리지 않아도 시간이 지나면 위험군으로 넘어가는
 *      화물이 있어서, 이 스캔이 실제로 지연 감지의 주력이 된다.
 *   2. 최근 24시간 신규 문의 건수
 *   3. 아직 처리되지 않은(read: false) 알림 개수
 *
 * 결과는 콘솔 로그 + automation-log 컬렉션에 남는다.
 *
 * TODO: 이메일/Slack 발송이 필요해지면 아래 summary 를 만든 직후에
 *       전송 호출만 추가하면 된다. 집계 로직은 건드릴 필요가 없다.
 */

const JOB_NAME = 'daily-ops-digest';
const DAY_MS = 24 * 60 * 60 * 1000;

const buildDigest = async (now) => {
  const since = new Date(now.getTime() - DAY_MS);

  // 1. 지연 리스크 스캔 (+ 위험군 알림 생성)
  const risk = await shipmentEvents.scanDelayRisk({ now });

  // 2·3. 신규 문의 / 미처리 알림
  const [newContacts, unreadNotifications] = await Promise.all([
    Contact.countDocuments({ createdAt: { $gte: since } }),
    Notification.countDocuments({ read: false })
  ]);

  const summary = {
    generatedAt: now.toISOString(),
    shipments: {
      scanned: risk.scanned,
      atRisk: risk.atRisk,
      delayed: risk.delayed,
      notificationsCreated: risk.created
    },
    newContacts24h: newContacts,
    unreadNotifications
  };

  // 콘솔에도 사람이 읽기 좋은 형태로 남긴다 (Render 로그에서 바로 확인 가능)
  logger.info(
    [
      '[일일 운영 다이제스트]',
      `배송중 ${risk.scanned}건 (지연 ${risk.delayed} / 지연위험 ${risk.atRisk})`,
      `신규 문의 24h: ${newContacts}건`,
      `미처리 알림: ${unreadNotifications}건`,
      `새 알림 생성: ${risk.created}건`
    ].join(' | ')
  );

  return summary;
};

/**
 * @param {{now?: Date, trigger?: 'schedule'|'manual'}} [options]
 */
const runDailyOpsDigest = (options = {}) => {
  const { now = new Date(), trigger } = options;
  return runWithLog(JOB_NAME, () => buildDigest(now), { trigger });
};

module.exports = { runDailyOpsDigest, JOB_NAME };
