/**
 * delay-risk 단위 테스트
 *
 * 표준 소요일 테이블과 기준 시각(now)을 주입하므로, 실제 설정값이나
 * 현재 시각에 의존하지 않고 경계값을 정확히 검증할 수 있다.
 */

const {
  calculateDelayRisk,
  calculateEstimatedArrival,
  buildRiskLevelQuery,
  RISK_LEVELS,
  SKIP_REASONS,
  MS_PER_DAY,
} = require('./delay-risk');

// 테스트 전용 테이블 — 계산이 쉽도록 10일로 잡는다
const TABLE = {
  TEST_MODE: { days: 10, source: 'test' },
  FAST_MODE: { days: 4, source: 'test' },
  BROKEN_MODE: { days: 0, source: 'test' },
};

const NOW = new Date('2026-08-16T00:00:00.000Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * MS_PER_DAY);

const score = (shippedAt, mode = 'TEST_MODE', status = 'in_transit') =>
  calculateDelayRisk({ transportMode: mode, shippedAt, status }, TABLE, { now: NOW });

describe('calculateDelayRisk — 경과율과 등급', () => {
  test('경과 0일이면 경과율 0, 정상', () => {
    const r = score(daysAgo(0));
    expect(r.score).toBe(0);
    expect(r.level).toBe(RISK_LEVELS.NORMAL);
  });

  test('10일 표준에 5일 경과 → 0.5, 정상', () => {
    const r = score(daysAgo(5));
    expect(r.score).toBeCloseTo(0.5, 4);
    expect(r.level).toBe(RISK_LEVELS.NORMAL);
    expect(r.elapsedDays).toBeCloseTo(5, 2);
    expect(r.standardDays).toBe(10);
  });

  test('경계 바로 아래(8.4일 = 0.84)는 정상', () => {
    expect(score(daysAgo(8.4)).level).toBe(RISK_LEVELS.NORMAL);
  });

  test('경계값 0.85 는 지연위험 (이상 포함)', () => {
    const r = score(daysAgo(8.5));
    expect(r.score).toBeCloseTo(0.85, 4);
    expect(r.level).toBe(RISK_LEVELS.AT_RISK);
  });

  test('0.85 ~ 1.0 사이는 지연위험', () => {
    expect(score(daysAgo(9.5)).level).toBe(RISK_LEVELS.AT_RISK);
    expect(score(daysAgo(9.99)).level).toBe(RISK_LEVELS.AT_RISK);
  });

  test('경계값 1.0 은 지연 (이상 포함)', () => {
    const r = score(daysAgo(10));
    expect(r.score).toBeCloseTo(1, 4);
    expect(r.level).toBe(RISK_LEVELS.DELAYED);
  });

  test('1.0 초과는 지연', () => {
    expect(score(daysAgo(25)).level).toBe(RISK_LEVELS.DELAYED);
  });

  test('운송모드마다 같은 경과일이라도 등급이 다르다', () => {
    expect(score(daysAgo(4), 'TEST_MODE').level).toBe(RISK_LEVELS.NORMAL);   // 4/10 = 0.4
    expect(score(daysAgo(4), 'FAST_MODE').level).toBe(RISK_LEVELS.DELAYED);  // 4/4  = 1.0
  });

  test('표준 소요일의 source 를 함께 돌려준다', () => {
    expect(score(daysAgo(1)).source).toBe('test');
  });
});

describe('calculateDelayRisk — 점수를 낼 수 없는 경우', () => {
  const expectSkipped = (result, reason) => {
    expect(result.skipped).toBe(reason);
    expect(result.score).toBeNull();
    expect(result.level).toBeNull();
  };

  test('배송 완료 건은 제외', () => {
    expectSkipped(score(daysAgo(30), 'TEST_MODE', 'delivered'), SKIP_REASONS.DELIVERED);
  });

  test('shippedAt 이 없으면 제외', () => {
    expectSkipped(score(null), SKIP_REASONS.NO_SHIPPED_AT);
  });

  test('잘못된 날짜면 제외', () => {
    expectSkipped(score(new Date('아무거나')), SKIP_REASONS.NO_SHIPPED_AT);
  });

  test('테이블에 없는 운송모드는 제외', () => {
    expectSkipped(score(daysAgo(3), 'NOT_IN_TABLE'), SKIP_REASONS.UNKNOWN_MODE);
  });

  test('표준 소요일이 0 이면 제외 (0 나누기 방지)', () => {
    expectSkipped(score(daysAgo(3), 'BROKEN_MODE'), SKIP_REASONS.INVALID_STANDARD);
  });

  test('shipment 자체가 없어도 예외를 던지지 않는다', () => {
    expect(() => calculateDelayRisk(null, TABLE, { now: NOW })).not.toThrow();
  });
});

describe('calculateDelayRisk — 방어 로직', () => {
  test('미래 집하일이면 경과율을 0 으로 막는다 (음수 방지)', () => {
    const future = new Date(NOW.getTime() + 5 * MS_PER_DAY);
    const r = score(future);
    expect(r.score).toBe(0);
    expect(r.level).toBe(RISK_LEVELS.NORMAL);
  });

  test('임계값을 주입해 기준을 바꿀 수 있다', () => {
    const strict = calculateDelayRisk(
      { transportMode: 'TEST_MODE', shippedAt: daysAgo(6), status: 'in_transit' },
      TABLE,
      { now: NOW, thresholds: { atRisk: 0.5, delayed: 0.7 } }
    );
    expect(strict.score).toBeCloseTo(0.6, 4);
    expect(strict.level).toBe(RISK_LEVELS.AT_RISK); // 기본 기준이면 '정상'
  });
});

describe('calculateEstimatedArrival', () => {
  test('집하일 + 표준 소요일', () => {
    const arrival = calculateEstimatedArrival(NOW, 'TEST_MODE', TABLE);
    expect(arrival.toISOString()).toBe('2026-08-26T00:00:00.000Z');
  });

  test('모르는 모드나 빈 값이면 null', () => {
    expect(calculateEstimatedArrival(NOW, 'NOPE', TABLE)).toBeNull();
    expect(calculateEstimatedArrival(null, 'TEST_MODE', TABLE)).toBeNull();
    expect(calculateEstimatedArrival(NOW, 'BROKEN_MODE', TABLE)).toBeNull();
  });
});

describe('buildRiskLevelQuery — 쿼리와 계산 결과가 일치하는지', () => {
  /** 쿼리 조건을 실제 shippedAt 에 적용해 본다 (mongo 없이 검증) */
  const matches = (condition, shippedAt) => {
    if (condition.$gt && !(shippedAt > condition.$gt)) return false;
    if (condition.$lte && !(shippedAt <= condition.$lte)) return false;
    return true;
  };

  const branchFor = (query, mode) => query.$or.find((b) => b.transportMode === mode).shippedAt;

  test.each([
    [RISK_LEVELS.NORMAL],
    [RISK_LEVELS.AT_RISK],
    [RISK_LEVELS.DELAYED],
  ])('%s: 쿼리 매칭 결과가 calculateDelayRisk 와 같다', (level) => {
    const query = buildRiskLevelQuery(level, TABLE, { now: NOW });
    const condition = branchFor(query, 'TEST_MODE');

    // 0.1일 간격으로 0~15일 전까지 훑으며 두 경로가 항상 일치하는지 확인
    for (let d = 0; d <= 15; d += 0.1) {
      const shippedAt = daysAgo(d);
      const computed = score(shippedAt).level === level;
      const queried = matches(condition, shippedAt);
      expect({ d: d.toFixed(1), queried }).toEqual({ d: d.toFixed(1), queried: computed });
    }
  });

  test('배송 완료 건을 제외하는 조건이 포함된다', () => {
    const query = buildRiskLevelQuery(RISK_LEVELS.DELAYED, TABLE, { now: NOW });
    expect(query.status).toEqual({ $ne: 'delivered' });
  });

  test('표준 소요일이 0 인 모드는 쿼리에서 빠진다', () => {
    const query = buildRiskLevelQuery(RISK_LEVELS.NORMAL, TABLE, { now: NOW });
    const modes = query.$or.map((b) => b.transportMode);
    expect(modes).toContain('TEST_MODE');
    expect(modes).not.toContain('BROKEN_MODE');
  });

  test('알 수 없는 등급이면 null', () => {
    expect(buildRiskLevelQuery('없는등급', TABLE, { now: NOW })).toBeNull();
  });
});
