/**
 * 공지사항 API.
 *
 * 다루는 것: 공개 목록/단건(published 만), 관리자 CRUD, draft 는 공개 경로에서
 * 절대 안 보임, isPublished 전환 시 publishedAt 동기화.
 */
const request = require("supertest");

const db = require("./helpers/db");
const { buildApp } = require("./helpers/app");
const { createUser } = require("./helpers/factories");

const app = buildApp();
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const sampleBody = (over = {}) => ({
  title: "정기 점검 안내",
  body: "9월 20일 새벽 시스템 점검이 있습니다.",
  ...over,
});

beforeAll(async () => {
  await db.connect();
});
afterEach(async () => {
  await db.clear();
});
afterAll(async () => {
  await db.disconnect();
});

describe("POST /api/notices — 생성", () => {
  test("admin 은 생성할 수 있다, 기본은 draft", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody());

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: "정기 점검 안내",
      isPublished: false,
      category: "general",
    });
    expect(res.body.data.publishedAt).toBeNull();
  });

  test("isPublished:true 로 생성하면 publishedAt 이 바로 채워진다", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ isPublished: true }));

    expect(res.status).toBe(201);
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  test("admin 이 아니면 403", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody());
    expect(res.status).toBe(403);
  });

  test("토큰 없이는 403", async () => {
    const res = await request(app).post("/api/notices").send(sampleBody());
    expect(res.status).toBe(403);
  });

  test("title 없이는 400", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send({ body: "본문만 있음" });
    expect(res.status).toBe(400);
  });

  test("알 수 없는 category 는 400", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ category: "urgent" }));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/notices — 공개 목록", () => {
  test("published 만 보이고 draft 는 안 보인다", async () => {
    const { token } = await createUser({ role: "admin" });
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ isPublished: true }));
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ title: "초안", isPublished: false }));

    const res = await request(app).get("/api/notices");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].isPublished).toBe(true);
  });

  test("토큰 없이도 조회된다", async () => {
    const res = await request(app).get("/api/notices");
    expect(res.status).toBe(200);
  });

  test("category 필터가 먹는다", async () => {
    const { token } = await createUser({ role: "admin" });
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ category: "maintenance", isPublished: true }));
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(
        sampleBody({ title: "이벤트", category: "event", isPublished: true }),
      );

    const res = await request(app).get("/api/notices?category=event");
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].category).toBe("event");
  });

  test("고정(pinned) 이 먼저 온다", async () => {
    const { token } = await createUser({ role: "admin" });
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ title: "일반", isPublished: true }));
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ title: "고정", isPublished: true, isPinned: true }));

    const res = await request(app).get("/api/notices");
    expect(res.body.data[0].title).toBe("고정");
  });
});

describe("GET /api/notices/:id — 공개 단건", () => {
  test("published 는 조회된다", async () => {
    const { token } = await createUser({ role: "admin" });
    const created = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ isPublished: true }));

    const res = await request(app).get(`/api/notices/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("정기 점검 안내");
  });

  test("draft 는 공개 경로에서 404 (존재 여부를 드러내지 않는다)", async () => {
    const { token } = await createUser({ role: "admin" });
    const created = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody());

    const res = await request(app).get(`/api/notices/${created.body.data.id}`);
    expect(res.status).toBe(404);
  });

  test("존재하지 않는 id 는 404", async () => {
    const res = await request(app).get("/api/notices/64b7f9b2c1a2b3d4e5f60718");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/notices/all — 관리자 전체 목록", () => {
  test("admin 은 draft 포함 전부 본다", async () => {
    const { token } = await createUser({ role: "admin" });
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ isPublished: true }));
    await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ title: "초안" }));

    const res = await request(app).get("/api/notices/all").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  test("admin 이 아니면 403, 토큰 없으면 403", async () => {
    const { token } = await createUser({ role: "operations" });
    expect(
      (await request(app).get("/api/notices/all").set(auth(token))).status,
    ).toBe(403);
    expect((await request(app).get("/api/notices/all")).status).toBe(403);
  });
});

describe("PATCH /api/notices/:id — 수정", () => {
  test("admin 은 필드를 바꿀 수 있고, isPublished 전환 시 publishedAt 이 동기화된다", async () => {
    const { token } = await createUser({ role: "admin" });
    const created = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody());

    const published = await request(app)
      .patch(`/api/notices/${created.body.data.id}`)
      .set(auth(token))
      .send({ isPublished: true });
    expect(published.body.data.isPublished).toBe(true);
    expect(published.body.data.publishedAt).toBeTruthy();

    const unpublished = await request(app)
      .patch(`/api/notices/${created.body.data.id}`)
      .set(auth(token))
      .send({ isPublished: false });
    expect(unpublished.body.data.isPublished).toBe(false);
    expect(unpublished.body.data.publishedAt).toBeNull();
  });

  test("admin 이 아니면 403", async () => {
    const { token: adminToken } = await createUser({ role: "admin" });
    const created = await request(app)
      .post("/api/notices")
      .set(auth(adminToken))
      .send(sampleBody());

    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .patch(`/api/notices/${created.body.data.id}`)
      .set(auth(token))
      .send({ title: "수정 시도" });
    expect(res.status).toBe(403);
  });

  test("존재하지 않는 id 는 404", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await request(app)
      .patch("/api/notices/64b7f9b2c1a2b3d4e5f60718")
      .set(auth(token))
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/notices/:id — 삭제", () => {
  test("admin 은 삭제할 수 있다", async () => {
    const { token } = await createUser({ role: "admin" });
    const created = await request(app)
      .post("/api/notices")
      .set(auth(token))
      .send(sampleBody({ isPublished: true }));

    const res = await request(app)
      .delete(`/api/notices/${created.body.data.id}`)
      .set(auth(token));
    expect(res.status).toBe(200);

    const after = await request(app).get(
      `/api/notices/${created.body.data.id}`,
    );
    expect(after.status).toBe(404);
  });

  test("admin 이 아니면 403", async () => {
    const { token: adminToken } = await createUser({ role: "admin" });
    const created = await request(app)
      .post("/api/notices")
      .set(auth(adminToken))
      .send(sampleBody());

    const { token } = await createUser({ role: "sales" });
    const res = await request(app)
      .delete(`/api/notices/${created.body.data.id}`)
      .set(auth(token));
    expect(res.status).toBe(403);
  });
});
