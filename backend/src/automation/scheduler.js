const cron = require('node-cron');
const logger = require('../utils/logger');
const { runDailyOpsDigest } = require('./daily-ops-digest');
const { runStaleShipmentCheck } = require('./stale-shipment-check');

/**
 * 자동화 스케줄러.
 *
 * 서버가 떠 있는 동안 정해진 시각에 스스로 작업을 실행한다. 웹 요청과는
 * 아무 관계가 없다 — 아무도 사이트에 접속하지 않아도 돌아간다.
 *
 * ── 배포 형태에 대해 ────────────────────────────────────────────────────
 * 지금은 웹 서버와 같은 프로세스에서 돈다. 인스턴스가 하나뿐이라 이 편이
 * 단순하고 비용이 들지 않기 때문이다. 다만 이 방식은 두 가지 한계가 있다.
 *   - 웹 서버가 여러 개로 늘어나면 같은 작업이 인스턴스 수만큼 중복 실행된다.
 *     (알림은 dedupeKey 로 막히지만 automation-log 는 중복으로 쌓인다)
 *   - 무료 플랜처럼 유휴 시 잠드는 환경에서는 그 시간대의 실행을 건너뛴다.
 * 그래서 각 작업은 스케줄러에 의존하지 않는 순수 함수로 두고, 별도 진입점
 * (run-job.js)에서도 실행할 수 있게 했다. 나중에 Render Cron Job 같은 별도
 * 서비스로 옮길 때 이 파일만 빼면 되고 작업 코드는 그대로 쓴다.
 */

/** 실행 시각 기준 시간대 — 운영팀이 한국에 있으므로 KST */
const TIMEZONE = 'Asia/Seoul';

const JOBS = [
  {
    name: 'daily-ops-digest',
    // 매일 09:00 KST
    expression: '0 9 * * *',
    run: runDailyOpsDigest
  },
  {
    name: 'stale-shipment-check',
    // 6시간마다 (00, 06, 12, 18시 KST)
    expression: '0 */6 * * *',
    run: runStaleShipmentCheck
  }
];

/**
 * 같은 작업이 겹쳐 도는 것을 막는다.
 * 6시간 주기 작업이 6시간 넘게 걸릴 일은 없지만, DB 가 느려진 상황에서
 * 이전 실행이 끝나기 전에 다음 실행이 시작되면 알림이 두 번 나갈 수 있다.
 */
const running = new Set();

const runOnce = async (job) => {
  if (running.has(job.name)) {
    logger.warn(`[automation] ${job.name} 이전 실행이 아직 진행 중이라 이번 회차는 건너뜁니다.`);
    return;
  }

  running.add(job.name);
  try {
    await job.run({ trigger: 'schedule' });
  } finally {
    running.delete(job.name);
  }
};

let tasks = [];

/**
 * 스케줄 등록.
 * ENABLE_AUTOMATION=false 로 끌 수 있다 (로컬에서 시끄러울 때, 또는 자동화를
 * 별도 서비스로 분리 배포했을 때 웹 인스턴스에서 중복 실행되지 않도록).
 */
const startScheduler = () => {
  if (process.env.ENABLE_AUTOMATION === 'false') {
    logger.info('[automation] ENABLE_AUTOMATION=false — 스케줄러를 시작하지 않습니다.');
    return [];
  }

  tasks = JOBS.map((job) => {
    const task = cron.schedule(job.expression, () => runOnce(job), {
      timezone: TIMEZONE
    });
    logger.info(`[automation] 등록: ${job.name} (${job.expression} ${TIMEZONE})`);
    return task;
  });

  return tasks;
};

/** 종료 시 정리 (graceful shutdown 에서 호출) */
const stopScheduler = () => {
  tasks.forEach((task) => task.stop());
  tasks = [];
};

module.exports = { startScheduler, stopScheduler, JOBS, TIMEZONE };
