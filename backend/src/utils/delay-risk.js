/**
 * 지연 리스크 스코어링 (v1 — 규칙 기반 baseline)
 *
 * 경과율 = (현재까지 경과일) / (운송모드 표준 소요일)
 *
 *   경과율 < 0.85        → 정상
 *   0.85 ≤ 경과율 < 1.0  → 지연위험
 *   경과율 ≥ 1.0         → 지연
 *
 * ── 왜 규칙 기반인가 ───────────────────────────────────────────────────
 * 실제 배송 이력 데이터가 아직 없어 학습할 정답 레이블이 없다. 규칙 기반
 * baseline 은 물류 업계에서 ML 도입 전 단계로 흔히 쓰이는 방식이고,
 * 나중에 회귀/분류 모델을 올렸을 때 성능 비교 기준선이 된다.
 * 이력 데이터를 확보하면 표준 소요일을 실측 분포로 바꾸고, 그 다음 단계로
 * 노선·계절·통관 지연 등을 feature 로 쓰는 모델로 고도화할 수 있다.
 *
 * ── 설계 ───────────────────────────────────────────────────────────────
 * 이 모듈은 순수 함수다. 표준 소요일 테이블과 기준 시각을 주입받으므로
 * 하드코딩된 값이 없고 단위 테스트가 가능하다.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 경과율 임계값 */
const DEFAULT_THRESHOLDS = {
  atRisk: 0.85,
  delayed: 1.0,
};

const RISK_LEVELS = {
  NORMAL: '정상',
  AT_RISK: '지연위험',
  DELAYED: '지연',
};

/** 점수를 낼 수 없는 사유 */
const SKIP_REASONS = {
  DELIVERED: 'delivered',           // 이미 배송 완료 — 리스크 대상 아님
  NO_SHIPPED_AT: 'no-shipped-at',   // 집하 일시 없음
  UNKNOWN_MODE: 'unknown-mode',     // 표준 소요일 테이블에 없는 운송모드
  INVALID_STANDARD: 'invalid-standard-days',
};

/**
 * 경과율을 리스크 등급으로 변환한다.
 * @param {number} score 경과율
 * @param {{atRisk: number, delayed: number}} thresholds
 */
const scoreToLevel = (score, thresholds = DEFAULT_THRESHOLDS) => {
  if (score >= thresholds.delayed) return RISK_LEVELS.DELAYED;
  if (score >= thresholds.atRisk) return RISK_LEVELS.AT_RISK;
  return RISK_LEVELS.NORMAL;
};

/**
 * 화물 하나의 지연 리스크를 계산한다.
 *
 * @param {object} shipment - { transportMode, shippedAt, status }
 * @param {object} transitTimes - 운송모드별 { days, source } 테이블 (주입)
 * @param {object} [options]
 * @param {Date}   [options.now] - 기준 시각 (테스트에서 고정 가능)
 * @param {object} [options.thresholds]
 * @returns {{
 *   score: number|null,
 *   level: string|null,
 *   elapsedDays: number|null,
 *   standardDays: number|null,
 *   source: string|null,
 *   skipped: string|null
 * }}
 */
const calculateDelayRisk = (shipment, transitTimes, options = {}) => {
  const { now = new Date(), thresholds = DEFAULT_THRESHOLDS } = options;

  const empty = (skipped) => ({
    score: null,
    level: null,
    elapsedDays: null,
    standardDays: null,
    source: null,
    skipped,
  });

  if (!shipment) return empty(SKIP_REASONS.NO_SHIPPED_AT);

  // 배송 완료 건은 지연 리스크 대상이 아니다 (이미 결과가 나온 건)
  if (shipment.status === 'delivered') return empty(SKIP_REASONS.DELIVERED);

  const shippedAt = shipment.shippedAt ? new Date(shipment.shippedAt) : null;
  if (!shippedAt || Number.isNaN(shippedAt.getTime())) {
    return empty(SKIP_REASONS.NO_SHIPPED_AT);
  }

  const standard = transitTimes?.[shipment.transportMode];
  if (!standard) return empty(SKIP_REASONS.UNKNOWN_MODE);
  if (!(standard.days > 0)) return empty(SKIP_REASONS.INVALID_STANDARD);

  // 미래 날짜로 잘못 들어온 경우 음수 경과일이 나오므로 0 으로 막는다
  const elapsedDays = Math.max(0, (now.getTime() - shippedAt.getTime()) / MS_PER_DAY);
  const score = elapsedDays / standard.days;

  return {
    score: Number(score.toFixed(4)),
    level: scoreToLevel(score, thresholds),
    elapsedDays: Number(elapsedDays.toFixed(2)),
    standardDays: standard.days,
    source: standard.source,
    skipped: null,
  };
};

/**
 * 예상 도착일 = 집하일 + 표준 소요일
 */
const calculateEstimatedArrival = (shippedAt, transportMode, transitTimes) => {
  const standard = transitTimes?.[transportMode];
  if (!shippedAt || !standard || !(standard.days > 0)) return null;

  const base = new Date(shippedAt);
  if (Number.isNaN(base.getTime())) return null;

  return new Date(base.getTime() + standard.days * MS_PER_DAY);
};

/**
 * 특정 리스크 등급에 해당하는 shippedAt 범위를 운송모드별로 만들어
 * MongoDB 쿼리 조건($or)으로 돌려준다.
 *
 * 저장된 delayRiskLevel 은 시간이 지나면 낡는다(어제 '정상'이 오늘 '지연'일 수
 * 있음). 그래서 필터링은 저장값이 아니라 shippedAt 날짜 범위로 한다.
 *
 * 경과율 r = (now - shippedAt) / D 이므로
 *   r < a          ⟺ shippedAt >  now - a·D
 *   a ≤ r < b      ⟺ now - b·D <  shippedAt ≤ now - a·D
 *   r ≥ b          ⟺ shippedAt ≤ now - b·D
 */
const buildRiskLevelQuery = (level, transitTimes, options = {}) => {
  const { now = new Date(), thresholds = DEFAULT_THRESHOLDS } = options;
  const nowMs = now.getTime();
  const cutoff = (ratio, days) => new Date(nowMs - ratio * days * MS_PER_DAY);

  const branches = Object.entries(transitTimes)
    .filter(([, standard]) => standard?.days > 0)
    .map(([mode, standard]) => {
      const { days } = standard;
      let shippedAtCondition;

      if (level === RISK_LEVELS.NORMAL) {
        shippedAtCondition = { $gt: cutoff(thresholds.atRisk, days) };
      } else if (level === RISK_LEVELS.AT_RISK) {
        shippedAtCondition = {
          $gt: cutoff(thresholds.delayed, days),
          $lte: cutoff(thresholds.atRisk, days),
        };
      } else if (level === RISK_LEVELS.DELAYED) {
        shippedAtCondition = { $lte: cutoff(thresholds.delayed, days) };
      } else {
        return null;
      }

      return { transportMode: mode, shippedAt: shippedAtCondition };
    })
    .filter(Boolean);

  if (branches.length === 0) return null;

  return {
    // 배송 완료 건은 리스크 집계에서 제외한다
    status: { $ne: 'delivered' },
    $or: branches,
  };
};

module.exports = {
  calculateDelayRisk,
  calculateEstimatedArrival,
  buildRiskLevelQuery,
  scoreToLevel,
  RISK_LEVELS,
  SKIP_REASONS,
  DEFAULT_THRESHOLDS,
  MS_PER_DAY,
};
