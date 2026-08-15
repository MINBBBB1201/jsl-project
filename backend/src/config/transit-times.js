/**
 * 운송모드별 표준 소요일 테이블
 *
 * ⚠️ source 를 반드시 확인하세요.
 *   - "company-profile" : 회사소개서에 명시된 실측값
 *   - "estimate"        : 업계 평균 기반 추정치. 검증된 값이 아닙니다.
 *
 * TODO: 실제 배송 이력 데이터를 확보하면 모드별 실측 중앙값/p90 으로 교체할 것.
 *       그 전까지 이 값으로 산출된 지연 판정은 참고 지표로만 사용해야 합니다.
 *
 * days 는 집하(shippedAt)부터 도착까지의 달력일 기준입니다.
 */

const TRANSIT_TIMES = {
  AIR: { days: 4, source: 'estimate', label: '항공' },
  SEA: { days: 18, source: 'estimate', label: '해상' },
  SEA_AIR: { days: 10, source: 'estimate', label: '해상-항공 복합' },
  TRUCK_DOMESTIC: { days: 3, source: 'estimate', label: '육상(국내)' },
  TRUCK_CROSSBORDER: { days: 5, source: 'estimate', label: '육상(국경통과)' },
  RAIL: { days: 20, source: 'estimate', label: '철도' },
  // 회사소개서 실측: 한국(ICN) → 유럽 5~7일 door-to-door → 중앙값 6일
  EXPRESS: { days: 6, source: 'company-profile', label: '특송' },
};

const TRANSPORT_MODES = Object.keys(TRANSIT_TIMES);

module.exports = TRANSIT_TIMES;
module.exports.TRANSIT_TIMES = TRANSIT_TIMES;
module.exports.TRANSPORT_MODES = TRANSPORT_MODES;
