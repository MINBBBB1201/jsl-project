const AutomationLog = require('../models/automation-log.model');
const logger = require('../utils/logger');
const { JOBS, TIMEZONE } = require('../automation/scheduler');

const MAX_LIMIT = 50;

/**
 * 자동화 실행 이력.
 *
 * 대시보드 위젯이 "자동화가 실제로 돌고 있는지"를 보여주기 위해 쓴다.
 * 등록된 스케줄 목록도 함께 내려서, 기록이 없을 때 "작업이 없는 것"인지
 * "등록은 됐는데 아직 안 돈 것"인지 구분할 수 있게 한다.
 */
exports.getLogs = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      MAX_LIMIT
    );

    const logs = await AutomationLog.find()
      .sort({ ranAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        items: logs.map((log) => ({
          id: log._id.toString(),
          jobName: log.jobName,
          ranAt: log.ranAt,
          status: log.status,
          durationMs: log.durationMs ?? null,
          trigger: log.trigger ?? 'schedule',
          summary: log.summary ?? {},
          error: log.error ?? null
        })),
        // 등록된 스케줄 (코드에 정의된 값 — 실행 이력과 대조해 보라고 함께 준다)
        schedules: JOBS.map((job) => ({
          name: job.name,
          expression: job.expression,
          timezone: TIMEZONE
        }))
      }
    });
  } catch (error) {
    logger.error('자동화 실행 이력 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '자동화 실행 이력을 불러오지 못했습니다.'
    });
  }
};
