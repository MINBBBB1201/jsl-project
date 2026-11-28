/**
 * 화물 엑셀 업로드 (POST /api/shipments/import, GET .../import/template) 테스트.
 *
 * 검증하는 경계:
 *   - 권한: 운영(admin/operations)만. 영업(sales)·비로그인은 거부
 *   - 전부 아니면 전무: 오류 행이 있으면 아무것도 저장하지 않는다
 *   - 수식·DEMO- 접두사·도시표 밖 도시·머리글 변경은 거부
 *   - 같은 파일을 다시 올려도 중복 저장되지 않는다
 *   - 올린 고객 정보가 목록과 공개 조회로 새지 않는다 (PII 경계)
 */
const request = require("supertest");
const ExcelJS = require("exceljs");

const db = require("./helpers/db");
const { buildApp } = require("./helpers/app");
const { createUser } = require("./helpers/factories");
const { COLUMNS, SHEET_NAME } = require("../src/utils/shipment-import");
const Shipment = require("../src/models/shipment.model");

const app = buildApp();
const auth = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.disconnect());

const validRow = (overrides = {}) => ({
  trackingNumber: "JSL-IMP-0001",
  mode: "해상",
  origin: "부산",
  destination: "상하이",
  status: "운송중",
  shippedAt: "2026-11-20",
  eta: "",
  deliveredAt: "",
  current: "",
  customerName: "테스트 고객사",
  customerEmail: "",
  customerPhone: "",
  ...overrides,
});

/** 행 객체 목록으로 xlsx 버퍼를 만든다. header 로 머리글을 바꿀 수 있다. */
async function makeXlsx(rows, { header, sheetName = SHEET_NAME } = {}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(header || COLUMNS.map((c) => c.header));
  rows.forEach((row) => sheet.addRow(COLUMNS.map((c) => row[c.key])));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const upload = (token, buffer, query = "") =>
  request(app)
    .post(`/api/shipments/import${query}`)
    .set(auth(token))
    .attach("file", buffer, "shipments.xlsx");

describe("권한", () => {
  test("비로그인은 거부(403, 이 앱의 인증 실패 응답)", async () => {
    const res = await request(app)
      .post("/api/shipments/import")
      .attach("file", await makeXlsx([validRow()]), "a.xlsx");
    expect(res.status).toBe(403);
    expect(await Shipment.countDocuments()).toBe(0);
  });

  test("영업(sales)은 403", async () => {
    const { token } = await createUser({ role: "sales" });
    const res = await upload(token, await makeXlsx([validRow()]));
    expect(res.status).toBe(403);
    expect(await Shipment.countDocuments()).toBe(0);
  });

  test("양식 내려받기도 운영 권한만", async () => {
    const sales = await createUser({ role: "sales" });
    const ops = await createUser({ role: "operations" });
    const denied = await request(app)
      .get("/api/shipments/import/template")
      .set(auth(sales.token));
    const ok = await request(app)
      .get("/api/shipments/import/template")
      .set(auth(ops.token))
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(denied.status).toBe(403);
    expect(ok.status).toBe(200);
    expect(ok.headers["content-type"]).toContain("spreadsheetml");
    expect(ok.body.slice(0, 2).toString()).toBe("PK");
  });
});

describe("정상 업로드", () => {
  test("201 로 저장하고 예상 도착일·상태 이력이 채워진다", async () => {
    const { token } = await createUser({ role: "operations" });
    const res = await upload(
      token,
      await makeXlsx([
        validRow(),
        validRow({
          trackingNumber: "JSL-IMP-0002",
          mode: "항공",
          status: "배송완료",
          shippedAt: "2026-11-01",
          deliveredAt: "2026-11-05",
        }),
      ]),
    );
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ created: 2, total: 2 });

    const moving = await Shipment.findOne({ trackingNumber: "JSL-IMP-0001" });
    expect(moving.estimatedDelivery).toBeInstanceOf(Date);
    expect(moving.customer.email).toBeUndefined();
    const delivered = await Shipment.findOne({ trackingNumber: "JSL-IMP-0002" });
    expect(delivered.history.some((h) => h.status === "delivered")).toBe(true);
  });

  test("dryRun 은 검증만 하고 저장하지 않는다", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await upload(token, await makeXlsx([validRow()]), "?dryRun=true");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ dryRun: true, created: 1 });
    expect(await Shipment.countDocuments()).toBe(0);
  });

  test("같은 파일을 다시 올리면 건너뛰고 중복 저장하지 않는다", async () => {
    const { token } = await createUser({ role: "admin" });
    const file = await makeXlsx([validRow()]);
    await upload(token, file);
    const again = await upload(token, file);
    expect(again.status).toBe(201);
    expect(again.body.data.created).toBe(0);
    expect(again.body.data.skipped).toHaveLength(1);
    expect(await Shipment.countDocuments()).toBe(1);
  });
});

describe("거부", () => {
  const rejected = async (rows, options) => {
    const { token } = await createUser({ role: "admin" });
    const res = await upload(token, await makeXlsx(rows, options));
    expect(await Shipment.countDocuments()).toBe(0);
    return res;
  };

  test("오류 행이 하나라도 있으면 422 이고 아무것도 저장하지 않는다", async () => {
    const res = await rejected([
      validRow(),
      validRow({ trackingNumber: "JSL-IMP-0002", origin: "없는도시" }),
    ]);
    expect(res.status).toBe(422);
    expect(res.body.errors[0]).toMatchObject({ row: 3, field: "출발 도시" });
  });

  test("DEMO- 접두사 운송장은 거부", async () => {
    const res = await rejected([validRow({ trackingNumber: "DEMO-0001" })]);
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe("운송장번호");
  });

  test("파일 안의 운송장번호 중복은 거부", async () => {
    const res = await rejected([validRow(), validRow()]);
    expect(res.status).toBe(422);
  });

  test("머리글이 양식과 다르면 400", async () => {
    const header = COLUMNS.map((c) => c.header);
    header[0] = "번호";
    const res = await rejected([validRow()], { header });
    expect(res.status).toBe(400);
  });

  test("양식 시트가 없으면 400", async () => {
    const res = await rejected([validRow()], { sheetName: "Sheet1" });
    expect(res.status).toBe(400);
  });

  test("xlsx 가 아닌 파일은 400", async () => {
    const { token } = await createUser({ role: "admin" });
    const res = await upload(token, Buffer.from("not,an,xlsx\n1,2,3"));
    expect(res.status).toBe(400);
  });

  test("수식 셀은 거부", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SHEET_NAME);
    sheet.addRow(COLUMNS.map((c) => c.header));
    const row = COLUMNS.map((c) => validRow()[c.key]);
    row[0] = { formula: '"JSL-F-"&"1"', result: "JSL-F-1" };
    sheet.addRow(row);
    const { token } = await createUser({ role: "admin" });
    const res = await upload(token, Buffer.from(await workbook.xlsx.writeBuffer()));
    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toContain("수식");
    expect(await Shipment.countDocuments()).toBe(0);
  });
});

describe("개인정보 경계", () => {
  test("업로드한 고객 정보는 목록·공개 조회에 나가지 않는다", async () => {
    const { token } = await createUser({ role: "operations" });
    await upload(
      token,
      await makeXlsx([
        validRow({ customerName: "비공개고객사", customerEmail: "secret@customer.test" }),
      ]),
    );

    const list = await request(app).get("/api/shipments").set(auth(token));
    expect(JSON.stringify(list.body)).not.toContain("비공개고객사");
    expect(JSON.stringify(list.body)).not.toContain("secret@customer.test");

    const pub = await request(app).get("/api/shipments/track/JSL-IMP-0001");
    expect(pub.status).toBe(200);
    expect(JSON.stringify(pub.body)).not.toContain("비공개고객사");
    expect(JSON.stringify(pub.body)).not.toContain("secret@customer.test");
  });
});
