/**
 * 화물 API 의 개인정보(PII) 노출 경계 테스트.
 *
 * 이 프로젝트의 원칙(개인정보 최소제공): 여러 건을 한 번에 보여주는 목록은
 * 고객 연락처(customer)를 빼고, 담당자가 한 건을 처리하려고 여는 상세 화면은
 * 포함한다. PR #6 에서 상세 조회가 customer 를 부당하게 빼던 걸 고쳤는데,
 * 그 경계를 지켜 줄 자동 테스트가 없었다 (SESSION_HISTORY 의 남은 과제).
 *
 * 경계:
 *   GET /api/shipments            (목록, 로그인)      → customer 없음
 *   GET /api/shipments/:tn        (내부 상세, 로그인)  → customer 있음
 *   GET /api/shipments/track/:tn  (공개 조회, 무인증)  → customer 없음 + 화이트리스트 필드만
 *   PATCH .../:tn/location        (쓰기, 운영권한)     → 응답에서 customer 없음 (stripPii)
 */
const request = require("supertest");

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

describe("GET /api/shipments — 목록", () => {
  test("로그인하면 200, 각 항목에서 customer 가 빠진다", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({ trackingNumber: "JSL-LIST-1" });
    await createShipment({ trackingNumber: "JSL-LIST-2" });

    const res = await request(app).get("/api/shipments").set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    for (const item of res.body.data) {
      expect(item).not.toHaveProperty("customer");
      // 목록에 필요한 비-PII 필드는 그대로 있어야 한다
      expect(item.trackingNumber).toBeDefined();
      expect(item.status).toBeDefined();
    }
  });

  test("토큰이 없으면 403", async () => {
    await createShipment();
    const res = await request(app).get("/api/shipments");
    expect(res.status).toBe(403);
    expect(res.body).not.toHaveProperty("data");
  });
});

describe("GET /api/shipments/:trackingNumber — 내부 상세", () => {
  test("로그인하면 200, customer 연락처가 들어온다", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({
      trackingNumber: "JSL-DETAIL-1",
      customer: {
        name: "Kim Yeong-hee",
        email: "yh.kim@customer-test.local",
        phone: "+82-10-1234-5678",
      },
    });

    const res = await request(app)
      .get("/api/shipments/JSL-DETAIL-1")
      .set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.customer).toMatchObject({
      name: "Kim Yeong-hee",
      email: "yh.kim@customer-test.local",
      phone: "+82-10-1234-5678",
    });
  });

  test("토큰이 없으면 403 이고 customer 가 새지 않는다", async () => {
    await createShipment({ trackingNumber: "JSL-DETAIL-2" });
    const res = await request(app).get("/api/shipments/JSL-DETAIL-2");
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("customer-test.local");
  });
});

describe("GET /api/shipments/track/:trackingNumber — 공개 조회", () => {
  test("무인증 200 이지만 customer 도, 원문 필드도 나가지 않는다", async () => {
    await createShipment({
      trackingNumber: "JSL-PUBLIC-1",
      customer: {
        name: "Secret Person",
        email: "secret@customer-test.local",
        phone: "000",
      },
    });

    const res = await request(app).get("/api/shipments/track/JSL-PUBLIC-1");

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("customer");
    expect(res.body.data).not.toHaveProperty("items");
    expect(res.body.data).not.toHaveProperty("history");
    // 공개 조회는 주소 문자열만, 좌표는 주지 않는다
    expect(res.body.data.trackingNumber).toBe("JSL-PUBLIC-1");
    expect(JSON.stringify(res.body)).not.toContain("customer-test.local");
    expect(JSON.stringify(res.body)).not.toContain("Secret Person");
  });
});

describe("PATCH /api/shipments/:trackingNumber/location — 쓰기 응답", () => {
  test("운영권한으로 위치를 바꿔도 응답에서 customer 는 빠진다", async () => {
    const { token } = await createUser({ role: "operations" });
    await createShipment({ trackingNumber: "JSL-WRITE-1" });

    const res = await request(app)
      .patch("/api/shipments/JSL-WRITE-1/location")
      .set(auth(token))
      .send({
        coordinates: [127.5, 36.5],
        address: "Daejeon hub",
        status: "in_transit",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("customer");
  });

  test("sales 역할은 쓰기가 막힌다 (403)", async () => {
    const { token } = await createUser({ role: "sales" });
    await createShipment({ trackingNumber: "JSL-WRITE-2" });

    const res = await request(app)
      .patch("/api/shipments/JSL-WRITE-2/location")
      .set(auth(token))
      .send({ coordinates: [127.5, 36.5], address: "Daejeon hub" });

    expect(res.status).toBe(403);
  });
});
