/**
 * 화물 API 특성화(characterization) 테스트.
 *
 * shipment.controller.js 를 기능별 파일로 쪼개기 전에, "지금 동작"을 그대로
 * 기록해 두는 안전망이다. 옳고 그름을 판단하려는 테스트가 아니라 리팩터링 전후에
 * 같은 응답이 나가는지 확인하는 용도다. 그래서 현재 동작이 어색해 보여도 그대로
 * 고정하고, 그런 곳에는 주석으로 표시했다.
 *
 * 검증 항목 (shipment.pii.test.js 가 다루는 4개 경로는 제외):
 *   - 올바른 권한일 때의 상태 코드
 *   - 보호된 경로를 토큰 없이 부를 때의 상태 코드
 *   - 응답 최상위 키 모양
 *   - 목록형 응답의 customer 포함 여부
 * 날짜·난수 같은 변하는 값은 단정하지 않는다.
 */
const request = require("supertest");
const mongoose = require("mongoose");

const db = require("./helpers/db");
const { buildApp } = require("./helpers/app");
const { createUser, createShipment } = require("./helpers/factories");

const app = buildApp();

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clear();
});

afterAll(async () => {
  await db.disconnect();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const keys = (body) => Object.keys(body).sort();

const validShipmentBody = () => ({
  origin: { coordinates: [126.97, 37.56], address: "Seoul, KR" },
  destination: { coordinates: [139.69, 35.68], address: "Tokyo, JP" },
  customer: {
    name: "Park Min-su",
    email: "park@customer-test.local",
    phone: "+82-10-1111-2222",
  },
  estimatedDelivery: new Date(Date.now() + 5 * 864e5).toISOString(),
});

const checkpointBody = (name = "Busan hub") => ({
  name,
  location: { coordinates: [129.07, 35.18], address: "Busan, KR" },
});

describe("POST /api/shipments — 화물 생성", () => {
  test("운영권한이면 201, 응답에서 customer 는 빠지고 키 모양이 고정된다", async () => {
    const { token } = await createUser({ role: "operations" });

    const res = await request(app)
      .post("/api/shipments")
      .set(auth(token))
      .send(validShipmentBody());

    expect(res.status).toBe(201);
    expect(keys(res.body)).toEqual(["data", "message", "success"]);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toHaveProperty("customer");
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.trackingNumber).toBeDefined();
    expect(res.body.data.history).toHaveLength(1);
  });

  test("토큰이 없으면 403", async () => {
    const res = await request(app)
      .post("/api/shipments")
      .send(validShipmentBody());
    expect(res.status).toBe(403);
  });

  test("sales 역할은 403", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .post("/api/shipments")
      .set(auth(token))
      .send(validShipmentBody());
    expect(res.status).toBe(403);
  });

  test("필수 필드가 빠지면 라우터 검증에서 400 (errors 배열)", async () => {
    const { token } = await createUser({ role: "operations" });
    const res = await request(app)
      .post("/api/shipments")
      .set(auth(token))
      .send({});
    expect(res.status).toBe(400);
    expect(keys(res.body)).toEqual(["errors"]);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe("GET /api/shipments/delay-summary", () => {
  test("로그인하면 200, 집계 키 모양", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment();

    const res = await request(app)
      .get("/api/shipments/delay-summary")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("updatedAt");
    expect(keys(res.body.meta)).toEqual([
      "deliveredExcluded",
      "method",
      "note",
      "totalShipments",
      "unscorable",
    ]);
    // 화물 단위 정보는 없다
    expect(JSON.stringify(res.body)).not.toContain("customer-test.local");
  });

  test("토큰이 없으면 403", async () => {
    const res = await request(app).get("/api/shipments/delay-summary");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/shipments/dashboard-summary", () => {
  test("로그인하면 200, data/meta 키 모양", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment();
    await createShipment({ status: "delivered" });

    const res = await request(app)
      .get("/api/shipments/dashboard-summary")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "meta", "success", "updatedAt"]);
    expect(keys(res.body.data)).toEqual([
      "active",
      "onTime",
      "processed",
      "windowDays",
    ]);
    expect(res.body.data.windowDays).toBe(30);
    expect(keys(res.body.data.processed)).toEqual([
      "changeRate",
      "current",
      "previous",
    ]);
    expect(res.body.data.processed.current).toBe(2);
    expect(res.body.data.active.current).toBe(1);
    expect(keys(res.body.meta)).toEqual([
      "activePreviousNote",
      "completedAtNote",
      "completedAtSource",
      "note",
      "previousWindowStart",
      "totalShipments",
      "windowStart",
    ]);
  });

  test("토큰이 없으면 403", async () => {
    const res = await request(app).get("/api/shipments/dashboard-summary");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/shipments/trend", () => {
  test("range 를 생략하면 90일 기본값, 키 모양 고정", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment();

    const res = await request(app).get("/api/shipments/trend").set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "meta", "success", "updatedAt"]);
    expect(keys(res.body.data)).toEqual([
      "days",
      "from",
      "points",
      "range",
      "timezone",
      "to",
      "totals",
    ]);
    expect(res.body.data.range).toBe("90d");
    expect(res.body.data.points).toHaveLength(90);
    expect(res.body.data.totals.created).toBe(1);
    expect(keys(res.body.data.points[0])).toEqual([
      "completed",
      "created",
      "date",
    ]);
  });

  test("range=7d 이면 7칸", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .get("/api/shipments/trend?range=7d")
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.points).toHaveLength(7);
  });

  test("잘못된 range 는 400", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .get("/api/shipments/trend?range=1y")
      .set(auth(token));
    expect(res.status).toBe(400);
    expect(keys(res.body)).toEqual(["errors"]);
  });

  test("토큰이 없으면 403", async () => {
    const res = await request(app).get("/api/shipments/trend");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/shipments/public-summary — 공개", () => {
  test("무인증 200, 건수만 있고 화물 단위 정보는 없다", async () => {
    await createShipment({ trackingNumber: "DEMO-PUB-1" });

    const res = await request(app).get("/api/shipments/public-summary");

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "success"]);
    expect(keys(res.body.data)).toEqual([
      "atRisk",
      "dataSource",
      "delayed",
      "inTransit",
      "normal",
      "onTimeRate",
      "updatedAt",
    ]);
    expect(res.body.data.dataSource).toBe("demo");
    expect(JSON.stringify(res.body)).not.toContain("DEMO-PUB-1");
    expect(JSON.stringify(res.body)).not.toContain("customer");
  });

  test("화물이 없으면 dataSource 는 empty, onTimeRate 는 null", async () => {
    const res = await request(app).get("/api/shipments/public-summary");
    expect(res.status).toBe(200);
    expect(res.body.data.dataSource).toBe("empty");
    expect(res.body.data.onTimeRate).toBeNull();
  });
});

describe("GET /api/shipments/track-samples — 공개", () => {
  test("무인증 200, DEMO- 번호 문자열 배열만 내려간다", async () => {
    await createShipment({ trackingNumber: "DEMO-SAMPLE-1" });
    await createShipment({ trackingNumber: "REAL-SAMPLE-1" });

    const res = await request(app).get("/api/shipments/track-samples");

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "success"]);
    expect(res.body.data).toEqual(["DEMO-SAMPLE-1"]);
  });

  test("limit 범위를 벗어나면 400", async () => {
    const res = await request(app).get("/api/shipments/track-samples?limit=99");
    expect(res.status).toBe(400);
    expect(keys(res.body)).toEqual(["errors"]);
  });
});

describe("GET /api/shipments/track/:trackingNumber — 없는 번호", () => {
  test("무인증 404, success/error 키", async () => {
    const res = await request(app).get("/api/shipments/track/NOPE-0000");
    expect(res.status).toBe(404);
    expect(keys(res.body)).toEqual(["error", "success"]);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/shipments/nearby", () => {
  test("로그인하면 200, data 배열", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({ trackingNumber: "JSL-NEAR-1" });

    const res = await request(app)
      .get("/api/shipments/nearby?longitude=128&latitude=36&maxDistance=50000")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "success"]);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].trackingNumber).toBe("JSL-NEAR-1");
    // 목록형이라 getAllShipments 와 같이 연락처를 뺀다.
    expect(res.body.data[0]).not.toHaveProperty("customer");
  });

  test("좌표가 없으면 400", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await request(app).get("/api/shipments/nearby").set(auth(token));
    expect(res.status).toBe(400);
    expect(keys(res.body)).toEqual(["errors"]);
  });

  test("토큰이 없으면 403", async () => {
    const res = await request(app).get(
      "/api/shipments/nearby?longitude=128&latitude=36",
    );
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/shipments/:trackingNumber/status", () => {
  test("운영권한이면 200, 이력이 쌓인다", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-STATUS-1" });

    const res = await request(app)
      .patch("/api/shipments/JSL-STATUS-1/status")
      .set(auth(token))
      .send({ status: "out_for_delivery", description: "출고" });

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "message", "success"]);
    expect(res.body.data.status).toBe("out_for_delivery");
    const last = res.body.data.history[res.body.data.history.length - 1];
    expect(last.status).toBe("out_for_delivery");
    expect(last.description).toBe("출고");
    // 위치 갱신(PATCH location)과 같이 쓰기 응답에서는 연락처를 뺀다.
    expect(res.body.data).not.toHaveProperty("customer");
  });

  test("status 가 없으면 400 (컨트롤러 검증)", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-STATUS-2" });

    const res = await request(app)
      .patch("/api/shipments/JSL-STATUS-2/status")
      .set(auth(token))
      .send({});

    expect(res.status).toBe(400);
    expect(keys(res.body)).toEqual(["error", "success"]);
  });

  test("없는 번호는 404", async () => {
    const { token } = await createUser({ role: "operations" });
    const res = await request(app)
      .patch("/api/shipments/NOPE-0000/status")
      .set(auth(token))
      .send({ status: "delivered" });
    expect(res.status).toBe(404);
    expect(keys(res.body)).toEqual(["error", "success"]);
  });

  test("토큰이 없으면 403, sales 도 403", async () => {
    await createShipment({ trackingNumber: "JSL-STATUS-3" });
    const anon = await request(app)
      .patch("/api/shipments/JSL-STATUS-3/status")
      .send({ status: "delivered" });
    expect(anon.status).toBe(403);

    const { token } = await createUser({ role: "sales" });
    const sales = await request(app)
      .patch("/api/shipments/JSL-STATUS-3/status")
      .set(auth(token))
      .send({ status: "delivered" });
    expect(sales.status).toBe(403);
  });
});

describe("GET /api/shipments/:trackingNumber/history", () => {
  test("로그인하면 200, data 는 history 배열", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({ trackingNumber: "JSL-HIST-1" });

    const res = await request(app)
      .get("/api/shipments/JSL-HIST-1/history")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "success"]);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("없는 번호는 404, 토큰이 없으면 403", async () => {
    const { token } = await createUser({ role: "sales" });
    const missing = await request(app)
      .get("/api/shipments/NOPE-0000/history")
      .set(auth(token));
    expect(missing.status).toBe(404);
    expect(keys(missing.body)).toEqual(["error", "success"]);

    const anon = await request(app).get("/api/shipments/NOPE-0000/history");
    expect(anon.status).toBe(403);
  });
});

describe("GET /api/shipments/:trackingNumber/eta", () => {
  test("로그인하면 200, success 래퍼 없이 평평한 키 모양", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({ trackingNumber: "JSL-ETA-1" });

    const res = await request(app)
      .get("/api/shipments/JSL-ETA-1/eta")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual([
      "currentLocation",
      "destination",
      "distance",
      "eta",
      "estimatedTimeHours",
      "status",
      "trackingNumber",
    ].sort());
    expect(res.body.trackingNumber).toBe("JSL-ETA-1");
    expect(typeof res.body.distance).toBe("string");
  });

  test("없는 번호는 404 (error 키만), 토큰이 없으면 403", async () => {
    const { token } = await createUser({ role: "sales" });
    const missing = await request(app)
      .get("/api/shipments/NOPE-0000/eta")
      .set(auth(token));
    expect(missing.status).toBe(404);
    expect(keys(missing.body)).toEqual(["error"]);

    const anon = await request(app).get("/api/shipments/NOPE-0000/eta");
    expect(anon.status).toBe(403);
  });
});

describe("GET /api/shipments/:trackingNumber/distance", () => {
  test("로그인하면 200, data 키 모양 (체크포인트 없음)", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({ trackingNumber: "JSL-DIST-1" });

    const res = await request(app)
      .get("/api/shipments/JSL-DIST-1/distance")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "success"]);
    expect(keys(res.body.data)).toEqual([
      "checkpointDistances",
      "checkpoints",
      "distanceTraveled",
      "progress",
      "remainingDistance",
      "totalDistance",
      "trackingNumber",
    ]);
    expect(res.body.data.checkpoints).toEqual([]);
    expect(res.body.data.checkpointDistances).toEqual([]);
  });

  test("체크포인트가 있으면 checkpoints 에 요약이 담긴다", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-DIST-2" });
    await request(app)
      .post("/api/shipments/JSL-DIST-2/checkpoints")
      .set(auth(token))
      .send(checkpointBody("Busan hub"));

    const res = await request(app)
      .get("/api/shipments/JSL-DIST-2/distance")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.checkpoints).toHaveLength(1);
    expect(keys(res.body.data.checkpoints[0])).toEqual([
      "address",
      "estimatedArrival",
      "name",
      "reached",
    ]);
  });

  test("없는 번호는 404, 토큰이 없으면 403", async () => {
    const { token } = await createUser({ role: "sales" });
    const missing = await request(app)
      .get("/api/shipments/NOPE-0000/distance")
      .set(auth(token));
    expect(missing.status).toBe(404);
    expect(keys(missing.body)).toEqual(["error", "success"]);

    const anon = await request(app).get("/api/shipments/NOPE-0000/distance");
    expect(anon.status).toBe(403);
  });
});

describe("PATCH /api/shipments/:trackingNumber/location/manual", () => {
  test("운영권한이면 200, 위치와 이력이 바뀐다", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-MANUAL-1" });

    const res = await request(app)
      .patch("/api/shipments/JSL-MANUAL-1/location/manual")
      .set(auth(token))
      .send({
        coordinates: [127.5, 36.5],
        address: "Daejeon hub",
        status: "out_for_delivery",
      });

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "message", "success"]);
    expect(res.body.data.currentLocation.address).toBe("Daejeon hub");
    expect(res.body.data.status).toBe("out_for_delivery");
    expect(res.body.data).not.toHaveProperty("customer");
  });

  test("검증 실패는 400, 없는 번호는 404, 권한 없음은 403", async () => {
    const { token } = await createUser({ role: "operations" });
    const bad = await request(app)
      .patch("/api/shipments/JSL-MANUAL-2/location/manual")
      .set(auth(token))
      .send({});
    expect(bad.status).toBe(400);
    expect(keys(bad.body)).toEqual(["errors"]);

    const missing = await request(app)
      .patch("/api/shipments/NOPE-0000/location/manual")
      .set(auth(token))
      .send({ coordinates: [127.5, 36.5], address: "Daejeon hub" });
    expect(missing.status).toBe(404);
    expect(keys(missing.body)).toEqual(["error", "success"]);

    const anon = await request(app)
      .patch("/api/shipments/JSL-MANUAL-2/location/manual")
      .send({ coordinates: [127.5, 36.5], address: "Daejeon hub" });
    expect(anon.status).toBe(403);
  });
});

describe("체크포인트 — POST/PATCH/DELETE /:trackingNumber/checkpoints", () => {
  test("추가: 운영권한이면 200, data 에 checkpoints 가 생긴다", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-CP-1" });

    const res = await request(app)
      .post("/api/shipments/JSL-CP-1/checkpoints")
      .set(auth(token))
      .send(checkpointBody());

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "message", "success"]);
    expect(res.body.data.checkpoints).toHaveLength(1);
    expect(res.body.data.checkpoints[0].name).toBe("Busan hub");
    expect(res.body.data.checkpoints[0].reached).toBe(false);
    expect(res.body.data).not.toHaveProperty("customer");
  });

  test("추가: 검증 실패 400, 없는 번호 404, 토큰 없음 403, sales 403", async () => {
    const { token } = await createUser({ role: "operations" });
    const bad = await request(app)
      .post("/api/shipments/JSL-CP-2/checkpoints")
      .set(auth(token))
      .send({});
    expect(bad.status).toBe(400);
    expect(keys(bad.body)).toEqual(["errors"]);

    const missing = await request(app)
      .post("/api/shipments/NOPE-0000/checkpoints")
      .set(auth(token))
      .send(checkpointBody());
    expect(missing.status).toBe(404);
    expect(keys(missing.body)).toEqual(["error", "success"]);

    const anon = await request(app)
      .post("/api/shipments/JSL-CP-2/checkpoints")
      .send(checkpointBody());
    expect(anon.status).toBe(403);

    const sales = await createUser({ role: "sales" });
    const forbidden = await request(app)
      .post("/api/shipments/JSL-CP-2/checkpoints")
      .set(auth(sales.token))
      .send(checkpointBody());
    expect(forbidden.status).toBe(403);
  });

  test("수정: 이름·메모가 바뀌고 200", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-CP-3" });
    const added = await request(app)
      .post("/api/shipments/JSL-CP-3/checkpoints")
      .set(auth(token))
      .send(checkpointBody());
    const checkpointId = added.body.data.checkpoints[0]._id;

    const res = await request(app)
      .patch(`/api/shipments/JSL-CP-3/checkpoints/${checkpointId}`)
      .set(auth(token))
      .send({ name: "Busan port", notes: "메모" });

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "message", "success"]);
    expect(res.body.data.checkpoints[0].name).toBe("Busan port");
    expect(res.body.data.checkpoints[0].notes).toBe("메모");
  });

  test("수정: 처음 reached=true 가 되면 이력이 한 건 쌓이고, 다시 보내도 늘지 않는다", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-CP-4" });
    const added = await request(app)
      .post("/api/shipments/JSL-CP-4/checkpoints")
      .set(auth(token))
      .send(checkpointBody());
    const checkpointId = added.body.data.checkpoints[0]._id;
    const before = added.body.data.history.length;

    const res = await request(app)
      .patch(`/api/shipments/JSL-CP-4/checkpoints/${checkpointId}`)
      .set(auth(token))
      .send({ reached: true });

    expect(res.status).toBe(200);
    expect(res.body.data.checkpoints[0].reached).toBe(true);
    expect(res.body.data.history).toHaveLength(before + 1);
    expect(res.body.data.history[before].description).toBe("Checkpoint reached: Busan hub");
    expect(res.body.data).not.toHaveProperty("customer");

    const again = await request(app)
      .patch(`/api/shipments/JSL-CP-4/checkpoints/${checkpointId}`)
      .set(auth(token))
      .send({ reached: true });
    expect(again.body.data.history).toHaveLength(before + 1);
  });

  test("수정: 없는 체크포인트 404, 없는 화물 404, 권한 없음 403", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-CP-5" });
    const unknownId = new mongoose.Types.ObjectId().toString();

    const noCp = await request(app)
      .patch(`/api/shipments/JSL-CP-5/checkpoints/${unknownId}`)
      .set(auth(token))
      .send({ name: "x" });
    expect(noCp.status).toBe(404);
    expect(noCp.body.error).toBe("Checkpoint not found");

    const noShipment = await request(app)
      .patch(`/api/shipments/NOPE-0000/checkpoints/${unknownId}`)
      .set(auth(token))
      .send({ name: "x" });
    expect(noShipment.status).toBe(404);
    expect(noShipment.body.error).toBe("Shipment not found");

    const anon = await request(app)
      .patch(`/api/shipments/JSL-CP-5/checkpoints/${unknownId}`)
      .send({ name: "x" });
    expect(anon.status).toBe(403);
  });

  test("삭제: 없는 체크포인트 404, 없는 화물 404, 권한 없음 403", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-CP-6" });
    const unknownId = new mongoose.Types.ObjectId().toString();

    const noCp = await request(app)
      .delete(`/api/shipments/JSL-CP-6/checkpoints/${unknownId}`)
      .set(auth(token));
    expect(noCp.status).toBe(404);
    expect(noCp.body.error).toBe("Checkpoint not found");

    const noShipment = await request(app)
      .delete(`/api/shipments/NOPE-0000/checkpoints/${unknownId}`)
      .set(auth(token));
    expect(noShipment.status).toBe(404);
    expect(noShipment.body.error).toBe("Shipment not found");

    const anon = await request(app).delete(
      `/api/shipments/JSL-CP-6/checkpoints/${unknownId}`,
    );
    expect(anon.status).toBe(403);
  });

  test("삭제: 존재하는 체크포인트가 지워지고 200", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-CP-7" });
    const added = await request(app)
      .post("/api/shipments/JSL-CP-7/checkpoints")
      .set(auth(token))
      .send(checkpointBody());
    const checkpointId = added.body.data.checkpoints[0]._id;

    const res = await request(app)
      .delete(`/api/shipments/JSL-CP-7/checkpoints/${checkpointId}`)
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkpoints).toHaveLength(0);
    expect(res.body.data).not.toHaveProperty("customer");
  });
});

describe("목록형 응답의 customer 노출 (요약)", () => {
  test("GET /api/shipments 의 riskLevel 필터 응답에도 customer 는 없다", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment();

    const res = await request(app)
      .get("/api/shipments?transportMode=SEA")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(keys(res.body)).toEqual(["data", "pagination", "success"]);
    expect(keys(res.body.pagination)).toEqual(["limit", "page", "pages", "total"]);
    for (const item of res.body.data) {
      expect(item).not.toHaveProperty("customer");
      expect(item).toHaveProperty("delayRisk");
    }
  });

  test("GET /api/shipments 의 잘못된 transportMode 는 400", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .get("/api/shipments?transportMode=ROCKET")
      .set(auth(token));
    expect(res.status).toBe(400);
    expect(keys(res.body)).toEqual(["errors"]);
  });
});
