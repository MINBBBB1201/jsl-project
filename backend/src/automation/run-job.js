/**
 * 자동화 작업 수동 실행 진입점.
 *
 *   npm run job:daily-digest
 *   npm run job:stale-check
 *   npm run job:stale-check -- --stale-days=1   (기준일 조정)
 *
 * 스케줄을 기다리지 않고 바로 돌려볼 수 있게 만든 것이고, 동시에 이 프로젝트의
 * 자동화가 웹 서버에 묶여 있지 않다는 증거이기도 하다. 이 스크립트는 Express 를
 * 전혀 부르지 않는다 — DB 에 직접 붙어 작업을 실행하고 빠진다. 그래서 나중에
 * Render Cron Job 같은 별도 서비스에 그대로 얹을 수 있다.
 */

// ⚠️ mongoose 보다 먼저 — server.js 와 같은 이유 (config/dns.js 주석 참고)
require('../config/dns');

const { connectDB, closeDB } = require('../config/database');
const { runDailyOpsDigest } = require('./daily-ops-digest');
const { runStaleShipmentCheck } = require('./stale-shipment-check');

const JOBS = {
  'daily-digest': runDailyOpsDigest,
  'stale-check': runStaleShipmentCheck
};

const parseArgs = (argv) => {
  const jobName = argv.find((arg) => !arg.startsWith('--'));
  const staleDaysArg = argv.find((arg) => arg.startsWith('--stale-days='));

  return {
    jobName,
    staleDays: staleDaysArg ? Number(staleDaysArg.split('=')[1]) : undefined
  };
};

const main = async () => {
  const { jobName, staleDays } = parseArgs(process.argv.slice(2));
  const run = JOBS[jobName];

  if (!run) {
    console.error(
      `실행할 작업을 찾을 수 없습니다: ${jobName ?? '(없음)'}\n` +
      `사용 가능한 작업: ${Object.keys(JOBS).join(', ')}`
    );
    process.exit(1);
  }

  await connectDB();

  const options = { trigger: 'manual' };
  if (Number.isFinite(staleDays)) options.staleDays = staleDays;

  const result = await run(options);

  console.log('\n────────────────────────────────────────────────');
  console.log(` 작업: ${jobName}`);
  console.log(` 상태: ${result.status}`);
  console.log(` 소요: ${result.durationMs}ms`);
  if (result.error) console.log(` 오류: ${result.error}`);
  console.log(' 요약:');
  console.log(JSON.stringify(result.summary, null, 2));
  console.log('────────────────────────────────────────────────\n');

  await closeDB();

  // 작업이 실패했으면 종료 코드로 알린다 (CI·외부 스케줄러가 실패를 감지할 수 있게)
  process.exit(result.status === 'success' ? 0 : 1);
};

main().catch(async (error) => {
  console.error('작업 실행 중 오류:', error);
  await closeDB().catch(() => {});
  process.exit(1);
});
