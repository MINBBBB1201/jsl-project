const Shipment = require("../../models/shipment.model");
const logger = require("../../utils/logger");
const TRANSIT_TIMES = require("../../config/transit-times");
const {
  calculateDelayRisk,
  RISK_LEVELS,
  MS_PER_DAY,
} = require("../../utils/delay-risk");
const {
  DELIVERED_STATUS,
  resolveCompletedAt,
  isOnTime,
  computeChangeRate,
} = require("../../utils/delivery-completion");

/**
 * GET /api/shipments/delay-summary
 *
 * 진행 중인 화물의 지연 리스크 등급별 건수를 집계한다.
 * 배송 완료(delivered) 건은 결과가 이미 나온 건이라 집계에서 제외한다.
 */
exports.getDelaySummary = async (req, res) => {
  try {
    const now = new Date();

    // 스코어링 대상: 배송 완료가 아니고, 집하일과 운송모드가 있는 건
    const scorableQuery = {
      status: { $ne: "delivered" },
      shippedAt: { $ne: null },
      transportMode: { $ne: null },
    };

    const shipments = await Shipment.find(scorableQuery)
      .select("transportMode shippedAt status")
      .lean();

    const counts = {
      [RISK_LEVELS.NORMAL]: 0,
      [RISK_LEVELS.AT_RISK]: 0,
      [RISK_LEVELS.DELAYED]: 0,
    };

    for (const shipment of shipments) {
      const { level } = calculateDelayRisk(shipment, TRANSIT_TIMES, { now });
      if (level) counts[level] += 1;
      // 점수를 못 낸 건은 아래 meta.unscorable 에서 별도로 집계한다
    }

    const total =
      counts[RISK_LEVELS.NORMAL] +
      counts[RISK_LEVELS.AT_RISK] +
      counts[RISK_LEVELS.DELAYED];

    // 참고용 부가 정보
    const [deliveredCount, allCount] = await Promise.all([
      Shipment.countDocuments({ status: "delivered" }),
      Shipment.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      total,
      [RISK_LEVELS.NORMAL]: counts[RISK_LEVELS.NORMAL],
      [RISK_LEVELS.AT_RISK]: counts[RISK_LEVELS.AT_RISK],
      [RISK_LEVELS.DELAYED]: counts[RISK_LEVELS.DELAYED],
      updatedAt: now.toISOString(),
      meta: {
        // 집계에서 빠진 건수 — 운영자가 데이터 품질을 확인할 수 있게 노출한다
        totalShipments: allCount,
        deliveredExcluded: deliveredCount,
        // 집하일 또는 운송모드가 없어 점수를 낼 수 없는 건
        unscorable: allCount - deliveredCount - total,
        // v1 은 규칙 기반이며 표준 소요일 상당수가 추정치임을 명시한다
        method: "rule-based-v1",
        note: "표준 소요일 일부는 업계 평균 추정치입니다. 실제 배송 이력 확보 시 교체 예정.",
      },
    });
  } catch (error) {
    logger.error("Error building delay summary:", error);
    res.status(500).json({
      success: false,
      error: "지연 리스크 집계에 실패했습니다.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * 대시보드 상단 KPI 카드용 집계.
 *
 * 카드 3개(처리 화물 건수 / 온타임 배송률 / 활성 배송 건수)가 쓰는 값을 한 번에
 * 내려준다. 카드마다 따로 부르면 같은 화면에서 서로 다른 시각의 스냅샷이 섞인다.
 *
 * 기간 정의
 *   현재 구간 = 최근 30일 (now - 30d ~ now)      ← 카드 부제 "최근 30일 누적" 과 맞춘다
 *   이전 구간 = 그 직전 30일 (now - 60d ~ now - 30d)
 *
 * ⚠️ 증감률은 이전 구간에 비교 대상이 있을 때만 계산한다. 이전 구간이 0 건이면
 *    null 을 내려 화면에서 배지를 감춘다 (utils/delivery-completion.js 참고).
 *    실적처럼 보이는 가짜 숫자를 띄우지 않기 위한 것이다.
 */
const WINDOW_DAYS = 30;

/** 활성(진행 중)에서 빼는 상태 — 결과가 이미 확정된 건 */
const INACTIVE_STATUSES = [DELIVERED_STATUS, "exception"];

exports.getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY);
    const previousStart = new Date(
      now.getTime() - 2 * WINDOW_DAYS * MS_PER_DAY,
    );

    const [
      processedCurrent,
      processedPrevious,
      activeCurrent,
      // windowStart 이전에 생성됐고 지금도 진행 중인 건 — 그 시점에도 분명히 진행 중이었다
      activeStillOpenFromBefore,
      totalShipments,
      deliveredDocs,
    ] = await Promise.all([
      Shipment.countDocuments({ createdAt: { $gte: windowStart, $lte: now } }),
      Shipment.countDocuments({
        createdAt: { $gte: previousStart, $lt: windowStart },
      }),
      Shipment.countDocuments({ status: { $nin: INACTIVE_STATUSES } }),
      Shipment.countDocuments({
        createdAt: { $lte: windowStart },
        status: { $nin: INACTIVE_STATUSES },
      }),
      Shipment.countDocuments({}),
      // 완료 시각은 history 를 봐야 알 수 있어 집계 파이프라인 대신 문서를 읽는다.
      // 완료 건만 대상이고 필요한 필드만 골라 온다.
      Shipment.find({ status: DELIVERED_STATUS })
        .select(
          "status createdAt updatedAt estimatedDelivery history.status history.timestamp",
        )
        .lean(),
    ]);

    // ── 온타임 배송률 ────────────────────────────────────────────────
    // 생성 시각이 아니라 완료 시각이 어느 구간에 속하는지로 나눈다.
    const sourceCounts = { history: 0, updatedAt: 0, unresolved: 0 };
    const window = { delivered: 0, onTime: 0, late: 0, undetermined: 0 };
    const previousWindow = { delivered: 0, onTime: 0, undetermined: 0 };
    // windowStart 시점에 아직 완료되지 않았던 건 (활성 건수의 이전 값 복원용)
    let openAtWindowStart = 0;

    for (const doc of deliveredDocs) {
      const { at: completedAt, source } = resolveCompletedAt(doc);

      if (!completedAt) {
        sourceCounts.unresolved += 1;
        continue;
      }
      sourceCounts[source] += 1;

      if (
        doc.createdAt &&
        new Date(doc.createdAt) <= windowStart &&
        completedAt > windowStart
      ) {
        openAtWindowStart += 1;
      }

      const onTime = isOnTime(completedAt, doc.estimatedDelivery);

      if (completedAt >= windowStart && completedAt <= now) {
        window.delivered += 1;
        if (onTime === null) window.undetermined += 1;
        else if (onTime) window.onTime += 1;
        else window.late += 1;
      } else if (completedAt >= previousStart && completedAt < windowStart) {
        previousWindow.delivered += 1;
        if (onTime === null) previousWindow.undetermined += 1;
        else if (onTime) previousWindow.onTime += 1;
      }
    }

    /** 판정 가능한 건이 하나도 없으면 비율을 만들지 않는다 (0 으로 나누지 않는다) */
    const rateOf = (onTimeCount, deliveredCount, undetermined) => {
      const judged = deliveredCount - undetermined;
      if (judged <= 0) return null;
      return Math.round((onTimeCount / judged) * 1000) / 10;
    };

    const onTimeRate = rateOf(
      window.onTime,
      window.delivered,
      window.undetermined,
    );
    const previousOnTimeRate = rateOf(
      previousWindow.onTime,
      previousWindow.delivered,
      previousWindow.undetermined,
    );

    const activePrevious = activeStillOpenFromBefore + openAtWindowStart;

    res.status(200).json({
      success: true,
      data: {
        windowDays: WINDOW_DAYS,
        // 최근 30일간 생성된 화물 건수
        processed: {
          current: processedCurrent,
          previous: processedPrevious,
          changeRate: computeChangeRate(processedCurrent, processedPrevious),
        },
        // 지금 진행 중인 건수 (delivered / exception 제외 — delayed 는 여전히 운송 중이라 포함)
        active: {
          current: activeCurrent,
          previous: activePrevious,
          changeRate: computeChangeRate(activeCurrent, activePrevious),
        },
        // 약속 기일 내 완료된 비율
        onTime: {
          rate: onTimeRate,
          delivered: window.delivered,
          onTimeCount: window.onTime,
          lateCount: window.late,
          previousRate: previousOnTimeRate,
          // 비율의 변화는 상대 증감률(%)이 아니라 퍼센트포인트 차이로 낸다.
          // 96.4% → 97.4% 를 "+1.0%" 로 적으면 읽는 사람이 97.4 인지 97.4 의 1% 증가인지 알 수 없다.
          changePoint:
            onTimeRate === null || previousOnTimeRate === null
              ? null
              : Math.round((onTimeRate - previousOnTimeRate) * 10) / 10,
        },
      },
      updatedAt: now.toISOString(),
      meta: {
        totalShipments,
        windowStart: windowStart.toISOString(),
        previousWindowStart: previousStart.toISOString(),
        /**
         * 완료 시각을 무엇으로 판단했는지 — 수치의 근거를 운영자가 확인할 수 있게 노출한다.
         * updatedAt 이 많다면 상태 변경이 API 를 거치지 않고 들어온 데이터라는 뜻이다.
         */
        completedAtSource: sourceCounts,
        completedAtNote:
          "deliveredAt 필드가 없어 history 의 delivered 전환 timestamp 를 완료 시각으로 씁니다. 이력이 없으면 updatedAt 으로 대체하며(근사치), 그 건수는 completedAtSource.updatedAt 에 표시됩니다.",
        /**
         * 활성 건수의 "이전 값" 은 과거 시점 상태를 복원한 값이다.
         * exception 은 예외 처리된 시각을 알 수 없어(이력에 남는다는 보장이 없다)
         * 과거 시점 집계에서 제외한다 — 지금 exception 인 건은 그 시점에도
         * 활성이 아니었던 것으로 본다.
         */
        activePreviousNote:
          "활성 건수의 이전 값은 생성 시각과 완료 시각으로 30일 전 시점을 복원한 값입니다. exception 처리 시각은 알 수 없어 제외했습니다.",
        note: "증감률은 이전 구간에 비교 대상이 있을 때만 계산하며, 없으면 null 로 내려 화면에서 감춥니다.",
      },
    });
  } catch (error) {
    logger.error("Error building dashboard summary:", error);
    res.status(500).json({
      success: false,
      error: "대시보드 집계에 실패했습니다.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/shipments/trend?range=7d|30d|90d
 *
 * 날짜별 신규 집하 / 배송 완료 건수. 대시보드 트렌드 차트가 쓴다.
 *
 * ⚠️ 날짜 경계는 UTC 가 아니라 한국 시간 기준으로 자른다. UTC 로 자르면
 *    한국의 오전 0~9시에 집하된 화물이 전날 칸에 들어가, 운영자가 보는
 *    "오늘 몇 건" 과 어긋난다.
 *
 * 값이 없는 날도 0 으로 채워 내려준다. 빠진 날을 그대로 두면 차트가 없는
 * 구간을 직선으로 이어 버려 "그날도 물량이 있었다" 처럼 보인다.
 */
const TREND_TIMEZONE = "Asia/Seoul";
const TREND_RANGES = { "7d": 7, "30d": 30, "90d": 90 };
const DEFAULT_TREND_RANGE = "90d";

/** 한국 시간 기준 YYYY-MM-DD. en-CA 로케일이 이 형식을 그대로 준다. */
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TREND_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const toDayKey = (date) => dayKeyFormatter.format(date);

exports.getShipmentTrend = async (req, res) => {
  try {
    const now = new Date();
    const range = TREND_RANGES[req.query.range]
      ? req.query.range
      : DEFAULT_TREND_RANGE;
    const days = TREND_RANGES[range];

    // 오늘을 포함해 days 개의 날짜 칸을 미리 만들어 둔다.
    // (한국은 서머타임이 없어 24시간씩 물러나면 날짜가 정확히 하루씩 밀린다)
    const buckets = new Map();
    for (let i = days - 1; i >= 0; i -= 1) {
      const key = toDayKey(new Date(now.getTime() - i * MS_PER_DAY));
      buckets.set(key, { date: key, created: 0, completed: 0 });
    }

    // 시간대 차이만큼 하루 여유를 두고 가져온 뒤, 날짜 키로 정확히 거른다
    const fetchFrom = new Date(now.getTime() - (days + 1) * MS_PER_DAY);

    const [createdByDay, deliveredDocs] = await Promise.all([
      Shipment.aggregate([
        { $match: { createdAt: { $gte: fetchFrom } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: TREND_TIMEZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      // 완료 시각은 history 를 봐야 하므로 dashboard-summary 와 같은 유틸로 판단한다
      Shipment.find({ status: DELIVERED_STATUS })
        .select("status updatedAt history.status history.timestamp")
        .lean(),
    ]);

    for (const row of createdByDay) {
      const bucket = buckets.get(row._id);
      if (bucket) bucket.created += row.count;
    }

    const sourceCounts = { history: 0, updatedAt: 0, unresolved: 0 };
    for (const doc of deliveredDocs) {
      const { at: completedAt, source } = resolveCompletedAt(doc);
      if (!completedAt) {
        sourceCounts.unresolved += 1;
        continue;
      }
      sourceCounts[source] += 1;

      const bucket = buckets.get(toDayKey(completedAt));
      if (bucket) bucket.completed += 1;
    }

    const points = Array.from(buckets.values());

    res.status(200).json({
      success: true,
      data: {
        range,
        days,
        timezone: TREND_TIMEZONE,
        from: points.length > 0 ? points[0].date : null,
        to: points.length > 0 ? points[points.length - 1].date : null,
        points,
        totals: {
          created: points.reduce((sum, p) => sum + p.created, 0),
          completed: points.reduce((sum, p) => sum + p.completed, 0),
        },
      },
      updatedAt: now.toISOString(),
      meta: {
        completedAtSource: sourceCounts,
        completedAtNote:
          "dashboard-summary 와 같은 기준입니다 — history 의 delivered 전환 timestamp, 없으면 updatedAt.",
      },
    });
  } catch (error) {
    logger.error("Error building shipment trend:", error);
    res.status(500).json({
      success: false,
      error: "화물 추이를 불러오지 못했습니다.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
