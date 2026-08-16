const mongoose = require('mongoose');

/**
 * 자동화 작업 실행 기록.
 *
 * 자동화는 아무도 보지 않는 곳에서 도는 코드라, 조용히 멈춰도 티가 나지 않는다.
 * 실행할 때마다 결과를 남겨서 "언제 돌았고 무엇을 봤는지"를 대시보드에서
 * 확인할 수 있게 한다. 실패도 기록한다 — 실패가 기록되지 않으면 성공과
 * 실행 안 됨을 구분할 수 없다.
 */

const JOB_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
};

const automationLogSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      index: true
    },
    ranAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    /** 작업마다 다른 요약 구조라 자유 형식으로 둔다 (집계 수치 등) */
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      required: true,
      default: JOB_STATUS.SUCCESS
    },
    /** 실패했을 때 원인. 성공 시에는 비어 있다. */
    error: String,
    durationMs: Number,
    /**
     * 실행 방식 — cron 자동 실행인지 수동 실행인지.
     * 스케줄러가 죽었는데 수동 실행 기록만 쌓이는 상황을 구분하기 위해 남긴다.
     */
    trigger: {
      type: String,
      enum: ['schedule', 'manual'],
      default: 'schedule'
    }
  },
  { timestamps: true }
);

const AutomationLog = mongoose.model('AutomationLog', automationLogSchema);

module.exports = AutomationLog;
module.exports.JOB_STATUS = JOB_STATUS;
