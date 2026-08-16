const AutomationLog = require('../models/automation-log.model');
const { JOB_STATUS } = require('../models/automation-log.model');
const logger = require('../utils/logger');

/**
 * 자동화 작업 공통 실행기.
 *
 * 모든 작업이 똑같이 필요로 하는 것 — 시작/종료 로그, 소요 시간 측정, 실행 기록
 * 저장, 실패 시에도 기록 남기기 — 를 여기 모았다. 작업 파일은 "무엇을 집계할지"만
 * 신경 쓰면 된다.
 *
 * 실패해도 예외를 밖으로 던지지 않는다. 스케줄러 안에서 예외가 올라가면
 * 처리되지 않은 rejection 으로 프로세스가 죽고, 그러면 웹 서버까지 함께
 * 내려간다 (같은 프로세스에서 돌기 때문에). 대신 status: 'error' 로 기록을
 * 남겨 대시보드에서 실패가 보이게 한다.
 *
 * @param {string} jobName
 * @param {() => Promise<object>} task 요약 객체를 반환하는 작업 본체
 * @param {{trigger?: 'schedule'|'manual'}} [options]
 * @returns {Promise<{status: string, summary: object, durationMs: number, error?: string}>}
 */
const runWithLog = async (jobName, task, options = {}) => {
  const { trigger = 'schedule' } = options;
  const startedAt = Date.now();
  const ranAt = new Date();

  logger.info(`[automation] ${jobName} 시작 (${trigger})`);

  let summary = {};
  let status = JOB_STATUS.SUCCESS;
  let errorMessage;

  try {
    summary = (await task()) ?? {};
    logger.info(`[automation] ${jobName} 완료: ${JSON.stringify(summary)}`);
  } catch (error) {
    status = JOB_STATUS.ERROR;
    errorMessage = error.message;
    logger.error(`[automation] ${jobName} 실패:`, error);
  }

  const durationMs = Date.now() - startedAt;

  try {
    await AutomationLog.create({
      jobName,
      ranAt,
      summary,
      status,
      error: errorMessage,
      durationMs,
      trigger
    });
  } catch (logError) {
    // 기록 저장까지 실패하면 남길 곳이 로그 파일뿐이다
    logger.error(`[automation] ${jobName} 실행 기록 저장 실패:`, logError);
  }

  return { status, summary, durationMs, error: errorMessage };
};

module.exports = { runWithLog };
