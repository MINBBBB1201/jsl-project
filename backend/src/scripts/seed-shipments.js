/**
 * 지연 감지 데모용 화물 시드 스크립트
 *
 * ############################################################################
 * # 경고: 이 데이터는 데모용 합성 데이터이며 실제 배송 기록이 아닙니다.        #
 * #                                                                          #
 * # - 트래킹 번호, 고객명, 좌표, 품목이 전부 임의로 생성된 값입니다.           #
 * # - 실제 화물/고객 정보와 아무 관련이 없습니다.                             #
 * # - 지연 감지 파이프라인 동작 확인 및 대시보드 데모 용도입니다.              #
 * # - 실제 배송 이력 데이터를 확보하면 이 데이터는 전부 삭제해야 합니다.       #
 * #   (--reset 옵션으로 합성 데이터만 골라 삭제할 수 있습니다)                #
 * ############################################################################
 *
 * 실행: npm run seed:shipments
 *      npm run seed:shipments -- --reset   (기존 합성 데이터 삭제 후 재삽입)
 *      npm run seed:shipments -- --count=60
 */

// ⚠️ mongoose 보다 먼저 — server.js 와 같은 이유 (config/dns.js 주석 참고)
require('../config/dns');

const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/database');
const Shipment = require('../models/shipment.model');
const TRANSIT_TIMES = require('../config/transit-times');
const {
  calculateDelayRisk,
  calculateEstimatedArrival,
  RISK_LEVELS,
  MS_PER_DAY
} = require('../utils/delay-risk');
const logger = require('../utils/logger');

/** 합성 데이터 식별용 표시. --reset 시 이 표시가 있는 문서만 지운다. */
const DEMO_MARKER = 'DEMO';
const DEMO_TRACKING_PREFIX = 'DEMO-';

const DEFAULT_COUNT = 36;

// [합성] 노선 — 회사 서비스 지역을 참고했지만 실제 운송 실적이 아님
const ROUTES = {
  AIR: [
    { from: ['광저우', 113.2644, 23.1291], to: ['인천', 126.4505, 37.4602] },
    { from: ['옌타이', 121.3914, 37.5393], to: ['인천', 126.4505, 37.4602] },
    { from: ['인천', 126.4505, 37.4602], to: ['프랑크푸르트', 8.5622, 50.0379] },
    { from: ['인천', 126.4505, 37.4602], to: ['로스앤젤레스', -118.4085, 33.9416] },
  ],
  SEA: [
    { from: ['상하이', 121.4737, 31.2304], to: ['부산', 129.0756, 35.1796] },
    { from: ['선전', 114.0579, 22.5431], to: ['로테르담', 4.4777, 51.9244] },
    { from: ['부산', 129.0756, 35.1796], to: ['롱비치', -118.1937, 33.7701] },
  ],
  SEA_AIR: [
    { from: ['상하이', 121.4737, 31.2304], to: ['시카고', -87.9073, 41.9742] },
    { from: ['선전', 114.0579, 22.5431], to: ['암스테르담', 4.7683, 52.3105] },
  ],
  TRUCK_DOMESTIC: [
    { from: ['상하이', 121.4737, 31.2304], to: ['항저우', 120.1551, 30.2741] },
    { from: ['광저우', 113.2644, 23.1291], to: ['둥관', 113.7518, 23.0207] },
    { from: ['인천', 126.7052, 37.4563], to: ['대구', 128.6014, 35.8714] },
  ],
  TRUCK_CROSSBORDER: [
    { from: ['난닝', 108.3665, 22.8170], to: ['하노이', 105.8342, 21.0278] },
    { from: ['하노이', 105.8342, 21.0278], to: ['방콕', 100.5018, 13.7563] },
  ],
  RAIL: [
    { from: ['시안', 108.9398, 34.3416], to: ['함부르크', 9.9937, 53.5511] },
    { from: ['청두', 104.0668, 30.5728], to: ['바르샤바', 21.0122, 52.2297] },
    { from: ['충칭', 106.5516, 29.5630], to: ['모스크바', 37.6173, 55.7558] },
  ],
  EXPRESS: [
    { from: ['인천', 126.4505, 37.4602], to: ['런던', -0.1276, 51.5072] },
    { from: ['인천', 126.4505, 37.4602], to: ['베를린', 13.4050, 52.5200] },
    { from: ['인천', 126.4505, 37.4602], to: ['파리', 2.3522, 48.8566] },
  ],
};

// [합성] 고객사명 — 실존 기업이 아닙니다
const DEMO_CUSTOMERS = [
  '가나무역', '다라전자', '마바산업', '사아물산', '자차코퍼레이션',
  '카타테크', '파하글로벌', '나다상사', '라마인터내셔널', '바사로지스',
];

const DEMO_ITEMS = [
  '전자부품', '의류', '기계부품', '생활용품', '화장품',
  '자동차부품', '식품(상온)', '플라스틱 원료',
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];

const makeTrackingNumber = (index) =>
  `${DEMO_TRACKING_PREFIX}${String(index + 1).padStart(4, '0')}-${pick(['AIR', 'SEA', 'TRK', 'RAI', 'EXP'])}`;

const toLocation = ([address, lng, lat], timestamp) => ({
  type: 'Point',
  coordinates: [lng, lat],
  address,
  timestamp,
});

/**
 * 리스크 등급이 골고루 섞이도록 경과율 목표치를 정해두고
 * 거기에 맞는 shippedAt 을 역산한다.
 * (랜덤하게만 흩뿌리면 표준 소요일이 긴 모드가 전부 '정상' 으로 몰린다)
 */
const TARGET_RATIOS = [
  // 정상 (< 0.85)
  0.05, 0.15, 0.25, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.82,
  // 지연위험 (0.85 ~ 1.0)
  0.86, 0.88, 0.9, 0.93, 0.95, 0.97, 0.99,
  // 지연 (>= 1.0)
  1.02, 1.1, 1.25, 1.4, 1.8,
];

const buildShipment = (index, now) => {
  const modes = Object.keys(ROUTES);
  const transportMode = modes[index % modes.length];
  const route = pick(ROUTES[transportMode]);
  const standardDays = TRANSIT_TIMES[transportMode].days;

  // 목표 경과율 → shippedAt 역산 (약간의 노이즈 추가)
  const targetRatio = TARGET_RATIOS[index % TARGET_RATIOS.length];
  const jitter = (Math.random() - 0.5) * 0.06;
  const elapsedDays = Math.max(0.1, (targetRatio + jitter) * standardDays);
  const shippedAt = new Date(now.getTime() - elapsedDays * MS_PER_DAY);

  const estimatedArrivalAt = calculateEstimatedArrival(shippedAt, transportMode, TRANSIT_TIMES);
  const { level } = calculateDelayRisk({ transportMode, shippedAt, status: 'in_transit' }, TRANSIT_TIMES, { now });

  // 지연 등급이면 status 도 delayed 로 (일부는 in_transit 으로 남겨 현실감 유지)
  let status = 'in_transit';
  if (level === RISK_LEVELS.DELAYED && index % 3 !== 0) status = 'delayed';

  const origin = toLocation(route.from, shippedAt);
  const destination = toLocation(route.to, estimatedArrivalAt);

  // 현재 위치는 출발지와 도착지 사이 어딘가 (경과율 비례, 단순 선형 보간)
  const progress = Math.min(1, elapsedDays / standardDays);
  const currentLocation = {
    type: 'Point',
    coordinates: [
      route.from[1] + (route.to[1] - route.from[1]) * progress,
      route.from[2] + (route.to[2] - route.from[2]) * progress,
    ],
    address: `${route.from[0]} → ${route.to[0]} 운송 중 (${DEMO_MARKER})`,
    timestamp: now,
  };

  const customer = pick(DEMO_CUSTOMERS);

  return {
    trackingNumber: makeTrackingNumber(index),
    origin,
    destination,
    currentLocation,
    checkpoints: [],
    status,
    transportMode,
    shippedAt,
    estimatedArrivalAt,
    estimatedDelivery: estimatedArrivalAt,
    history: [
      {
        location: origin,
        status: 'in_transit',
        description: `[${DEMO_MARKER}] 집하 완료 — 합성 데이터`,
        timestamp: shippedAt,
      },
    ],
    customer: {
      name: `[${DEMO_MARKER}] ${customer}`,
      email: `demo-${index + 1}@example.com`,
      phone: '000-0000-0000',
    },
    items: [
      {
        description: `[${DEMO_MARKER}] ${pick(DEMO_ITEMS)}`,
        quantity: randomInt(1, 200),
        weight: randomInt(5, 2000),
        dimensions: { length: randomInt(20, 200), width: randomInt(20, 150), height: randomInt(20, 150) },
      },
    ],
  };
};

const seed = async () => {
  await connectDB();

  const reset = process.argv.includes('--reset');
  const countArg = process.argv.find((a) => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : DEFAULT_COUNT;

  // 합성 데이터만 골라서 지운다 — 실데이터가 섞여 있어도 안전하도록
  const demoFilter = { trackingNumber: { $regex: `^${DEMO_TRACKING_PREFIX}` } };

  if (reset) {
    const { deletedCount } = await Shipment.deleteMany(demoFilter);
    logger.info(`--reset: 기존 합성 화물 ${deletedCount}건 삭제`);
  }

  const existing = await Shipment.countDocuments(demoFilter);
  if (existing > 0 && !reset) {
    logger.warn(`합성 화물이 이미 ${existing}건 있습니다. 다시 넣으려면 --reset 옵션을 사용하세요.`);
  } else {
    const now = new Date();
    const docs = Array.from({ length: count }, (_, i) => buildShipment(i, now));

    // insertMany 는 pre('save') 훅을 타지 않으므로 create 로 넣는다
    // (estimatedArrivalAt / delayRiskScore 자동 계산을 그대로 태우기 위함)
    await Shipment.create(docs);
    logger.info(`합성 화물 ${docs.length}건 삽입 완료 (전부 ${DEMO_MARKER} 표시)`);
  }

  // 등급 분포 확인
  const now = new Date();
  const all = await Shipment.find(demoFilter).select('transportMode shippedAt status').lean();
  const counts = { [RISK_LEVELS.NORMAL]: 0, [RISK_LEVELS.AT_RISK]: 0, [RISK_LEVELS.DELAYED]: 0, 제외: 0 };
  const byMode = {};

  for (const s of all) {
    const { level } = calculateDelayRisk(s, TRANSIT_TIMES, { now });
    if (level) counts[level] += 1;
    else counts.제외 += 1;
    byMode[s.transportMode] = (byMode[s.transportMode] || 0) + 1;
  }

  logger.info(`등급 분포 — 정상 ${counts[RISK_LEVELS.NORMAL]} / 지연위험 ${counts[RISK_LEVELS.AT_RISK]} / 지연 ${counts[RISK_LEVELS.DELAYED]} / 제외 ${counts.제외}`);
  logger.info(`운송모드 분포 — ${Object.entries(byMode).map(([m, c]) => `${m}:${c}`).join(', ')}`);

  await closeDB();
};

seed().catch(async (err) => {
  logger.error('시드 실패:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
