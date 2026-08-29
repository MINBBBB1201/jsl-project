/**
 * delivery-completion 단위 테스트
 *
 * 완료 시각 판정은 온타임 배송률의 분자/분모를 모두 결정한다. 여기가 틀리면
 * 운영자가 실제보다 좋은(또는 나쁜) 정시율을 보게 되므로 경계값까지 고정해 둔다.
 */

const {
  COMPLETION_SOURCES,
  resolveCompletedAt,
  isOnTime,
  computeChangeRate
} = require('./delivery-completion');

const iso = (s) => new Date(s);

describe('resolveCompletedAt — 완료 시각과 그 근거', () => {
  test('delivered 가 아니면 완료 시각이 없다', () => {
    const r = resolveCompletedAt({
      status: 'in_transit',
      history: [{ status: 'delivered', timestamp: iso('2026-08-10T00:00:00Z') }],
      updatedAt: iso('2026-08-11T00:00:00Z')
    });
    expect(r.at).toBeNull();
    expect(r.source).toBe(COMPLETION_SOURCES.NONE);
  });

  test('history 의 delivered 전환 timestamp 를 쓴다', () => {
    const r = resolveCompletedAt({
      status: 'delivered',
      history: [
        { status: 'in_transit', timestamp: iso('2026-08-01T00:00:00Z') },
        { status: 'delivered', timestamp: iso('2026-08-05T09:30:00Z') }
      ],
      updatedAt: iso('2026-08-20T00:00:00Z')
    });
    expect(r.source).toBe(COMPLETION_SOURCES.HISTORY);
    expect(r.at.toISOString()).toBe('2026-08-05T09:30:00.000Z');
  });

  // 실제 DB 에 완료 처리 후 되돌린 화물이 있다 (DEMO-0025-TRK: "알림 트리거 검증" → "검증 후 원복").
  // 지금 delivered 라면 마지막 전환이 실제 완료 시점이다.
  test('delivered 이력이 여러 개면 가장 최근 것을 쓴다', () => {
    const r = resolveCompletedAt({
      status: 'delivered',
      history: [
        { status: 'delivered', timestamp: iso('2026-08-05T00:00:00Z') },
        { status: 'in_transit', timestamp: iso('2026-08-06T00:00:00Z') },
        { status: 'delivered', timestamp: iso('2026-08-09T00:00:00Z') }
      ],
      updatedAt: iso('2026-08-09T00:00:10Z')
    });
    expect(r.at.toISOString()).toBe('2026-08-09T00:00:00.000Z');
    expect(r.source).toBe(COMPLETION_SOURCES.HISTORY);
  });

  test('delivered 이력이 없으면 updatedAt 으로 폴백하고 근거를 밝힌다', () => {
    const r = resolveCompletedAt({
      status: 'delivered',
      history: [{ status: 'in_transit', timestamp: iso('2026-08-01T00:00:00Z') }],
      updatedAt: iso('2026-08-07T12:00:00Z')
    });
    expect(r.source).toBe(COMPLETION_SOURCES.UPDATED_AT);
    expect(r.at.toISOString()).toBe('2026-08-07T12:00:00.000Z');
  });

  test('history 자체가 없어도 터지지 않는다', () => {
    const r = resolveCompletedAt({ status: 'delivered', updatedAt: iso('2026-08-07T12:00:00Z') });
    expect(r.source).toBe(COMPLETION_SOURCES.UPDATED_AT);
  });

  test('이력도 updatedAt 도 없으면 집계에서 뺄 수 있게 none 을 돌려준다', () => {
    const r = resolveCompletedAt({ status: 'delivered', history: [] });
    expect(r.at).toBeNull();
    expect(r.source).toBe(COMPLETION_SOURCES.NONE);
  });

  test('깨진 timestamp 는 무시하고 성한 값을 고른다', () => {
    const r = resolveCompletedAt({
      status: 'delivered',
      history: [
        { status: 'delivered', timestamp: 'not-a-date' },
        { status: 'delivered', timestamp: iso('2026-08-03T00:00:00Z') }
      ],
      updatedAt: iso('2026-08-20T00:00:00Z')
    });
    expect(r.source).toBe(COMPLETION_SOURCES.HISTORY);
    expect(r.at.toISOString()).toBe('2026-08-03T00:00:00.000Z');
  });

  test('null 문서에도 방어한다', () => {
    expect(resolveCompletedAt(null).at).toBeNull();
  });
});

describe('isOnTime — 약속 기일 판정', () => {
  test('기일 전에 끝나면 정시', () => {
    expect(isOnTime(iso('2026-08-05T00:00:00Z'), iso('2026-08-06T00:00:00Z'))).toBe(true);
  });

  test('기일 후에 끝나면 지연', () => {
    expect(isOnTime(iso('2026-08-07T00:00:00Z'), iso('2026-08-06T00:00:00Z'))).toBe(false);
  });

  // 기일"까지"가 약속이므로 그 순간 도착한 건은 정시로 센다
  test('경계값 — 기일과 같은 순간은 정시', () => {
    const t = iso('2026-08-06T00:00:00Z');
    expect(isOnTime(t, t)).toBe(true);
  });

  test('기일이나 완료 시각이 없으면 판정하지 않는다 (null)', () => {
    expect(isOnTime(null, iso('2026-08-06T00:00:00Z'))).toBeNull();
    expect(isOnTime(iso('2026-08-06T00:00:00Z'), null)).toBeNull();
    expect(isOnTime(iso('2026-08-06T00:00:00Z'), 'not-a-date')).toBeNull();
  });
});

describe('computeChangeRate — 기간 대비 증감률', () => {
  test('증가', () => {
    expect(computeChangeRate(120, 100)).toBe(20);
  });

  test('감소', () => {
    expect(computeChangeRate(80, 100)).toBe(-20);
  });

  test('소수 첫째 자리까지 반올림', () => {
    expect(computeChangeRate(37, 36)).toBe(2.8);
  });

  // 0 에서 늘어난 것은 증감률로 표현할 수 없다. "+3600%" 대신 배지를 감춘다.
  test('이전 값이 0 이면 null (0 으로 나누지 않는다)', () => {
    expect(computeChangeRate(36, 0)).toBeNull();
  });

  test('둘 다 0 이어도 null', () => {
    expect(computeChangeRate(0, 0)).toBeNull();
  });

  test('숫자가 아니면 null', () => {
    expect(computeChangeRate(36, null)).toBeNull();
    expect(computeChangeRate(undefined, 10)).toBeNull();
    expect(computeChangeRate(Infinity, 10)).toBeNull();
  });
});
