/**
 * 화물 엑셀(xlsx) 업로드 — 양식 정의, 파싱, 검증.
 *
 * ── 이 모듈이 받는 것 ───────────────────────────────────────────────────
 * JSL 이 정한 "화물 업로드 양식" 한 가지뿐이다. 회사가 쓰는 임의의 엑셀(예: 통관용
 * 상업송장·패킹리스트 CIPL)을 읽지 않는다. 그런 서류는 셀 위치가 파일마다 다르고
 * 고객사 상호·주소·단가 같은 상업 정보가 함께 딸려 오기 때문이다. 양식의 첫 행
 * 머리글이 정해진 이름과 다르면 파일 전체를 거부한다.
 *
 * ── 안전장치 ────────────────────────────────────────────────────────────
 * - 파일 크기·행 수 상한, zip(xlsx) 시그니처 확인은 호출하는 쪽(라우트)과 여기서 한다.
 * - 수식 셀은 값을 믿지 않고 오류로 돌려보낸다(다른 시트·외부 파일을 가리킬 수 있다).
 * - 전부 아니면 전무: 오류가 한 행이라도 있으면 아무것도 저장하지 않는다.
 *   중간까지만 들어간 상태에서 "어디까지 반영됐나"를 운영자가 가려내기 어렵다.
 * - 운송장번호가 DEMO- 로 시작하면 거부한다. 합성 데이터 표시(dataSource)가
 *   그 접두사로 판단되므로 실데이터가 데모로 둔갑하면 안 된다.
 */
const ExcelJS = require("exceljs");

const { resolveCity, listCityNames } = require("../config/city-coordinates");
const TRANSIT_TIMES = require("../config/transit-times");
const { calculateEstimatedArrival } = require("./delay-risk");

const SHEET_NAME = "화물";
const GUIDE_SHEET_NAME = "안내";
const MAX_ROWS = 500;
const DEMO_PREFIX = "DEMO-";
const TRACKING_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 양식 열. required 는 값이 반드시 있어야 하는 열이다. */
const COLUMNS = [
  { key: "trackingNumber", header: "운송장번호", required: true, width: 22 },
  { key: "mode", header: "운송모드", required: true, width: 14 },
  { key: "origin", header: "출발 도시", required: true, width: 14 },
  { key: "destination", header: "도착 도시", required: true, width: 14 },
  { key: "status", header: "상태", required: true, width: 12 },
  { key: "shippedAt", header: "집하일", required: true, width: 14 },
  { key: "eta", header: "도착예정일", required: false, width: 14 },
  { key: "deliveredAt", header: "완료일", required: false, width: 14 },
  { key: "current", header: "현재 위치 도시", required: false, width: 16 },
  { key: "customerName", header: "고객명", required: true, width: 18 },
  { key: "customerEmail", header: "고객 이메일", required: false, width: 24 },
  { key: "customerPhone", header: "고객 연락처", required: false, width: 18 },
];

/** 화면에 쓰는 한글 라벨 → 저장 값 */
const STATUS_BY_LABEL = {
  접수: "pending",
  운송중: "in_transit",
  배송출발: "out_for_delivery",
  배송완료: "delivered",
  예외: "exception",
  지연: "delayed",
};

const MODE_BY_LABEL = Object.fromEntries(
  Object.entries(TRANSIT_TIMES).map(([code, info]) => [info.label, code]),
);

const clean = (value) => String(value ?? "").trim();

/**
 * exceljs 의 셀 값은 문자열·숫자·Date 외에 { formula, result }, { richText },
 * { text, hyperlink } 같은 객체일 수 있다. 일반 값만 꺼내고 수식은 표시한다.
 */
function readCell(cell) {
  const value = cell.value;
  if (value === null || value === undefined) return { value: "" };
  if (value instanceof Date) return { value };
  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) {
      return { formula: true };
    }
    if (Array.isArray(value.richText)) {
      return { value: value.richText.map((part) => part.text).join("") };
    }
    if (typeof value.text === "string") return { value: value.text };
    return { value: "" };
  }
  return { value };
}

/** 'YYYY-MM-DD' 문자열이나 Date 를 UTC 자정 기준 Date 로. 못 읽으면 null */
function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 안내 시트와 오류 문구에 쓰는 허용값 */
const allowedModes = () => Object.keys(MODE_BY_LABEL);
const allowedStatuses = () => Object.keys(STATUS_BY_LABEL);

/** 빈 양식(xlsx 버퍼). 데이터 시트는 머리글만 두고 예시는 안내 시트에 적는다. */
async function buildTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JSL Logistics";

  const sheet = workbook.addWorksheet(SHEET_NAME);
  sheet.columns = COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const guide = workbook.addWorksheet(GUIDE_SHEET_NAME);
  guide.columns = [
    { header: "항목", key: "name", width: 20 },
    { header: "설명", key: "desc", width: 80 },
  ];
  guide.getRow(1).font = { bold: true };
  const rows = [
    ["사용 방법", `"${SHEET_NAME}" 시트의 1행(머리글)은 바꾸지 말고 2행부터 입력합니다. 한 번에 ${MAX_ROWS}행까지.`],
    ["필수 열", COLUMNS.filter((c) => c.required).map((c) => c.header).join(", ")],
    ["운송모드", allowedModes().join(", ")],
    ["상태", allowedStatuses().join(", ")],
    ["날짜", "YYYY-MM-DD 형식(예: 2026-11-20). 엑셀 날짜 칸도 됩니다."],
    ["도착예정일", "비우면 운송모드의 표준 소요일로 계산합니다."],
    ["완료일", "상태가 배송완료일 때 입력합니다. 비우면 도착예정일을 완료일로 봅니다."],
    ["현재 위치 도시", "비우면 접수는 출발 도시, 배송완료는 도착 도시, 그 밖의 상태는 출발 도시로 둡니다."],
    ["도시", `표에 있는 도시만 쓸 수 있습니다: ${listCityNames().join(", ")}`],
    ["운송장번호", `영문·숫자·.-_ 3~64자. "${DEMO_PREFIX}" 로 시작할 수 없고, 이미 등록된 번호는 건너뜁니다.`],
    ["수식", "수식 셀은 받지 않습니다. 값으로 붙여 넣어 주세요."],
    ["개인정보", "고객명·연락처는 화물 상세 화면에서만 보이고 목록과 공개 조회에는 나가지 않습니다. 고객사 동의 없이 실제 고객 정보를 올리지 마세요."],
    ["예시", "JSL-26-0001 | 해상 | 부산 | 상하이 | 운송중 | 2026-11-20 | | | | 고객사 상호 | ops@example.com | "],
  ];
  rows.forEach(([name, desc]) => guide.addRow({ name, desc }));
  guide.getColumn("desc").alignment = { wrapText: true, vertical: "top" };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * 업로드된 xlsx 를 읽어 행 객체 목록으로 만든다. 형식 오류는 throw 한다.
 * @returns {Promise<{rowNumber:number, raw:object, errors:{row,field,message}[]}[]>}
 */
async function readWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    const error = new Error("xlsx 파일을 읽을 수 없습니다. 양식을 내려받아 다시 작성해 주세요.");
    error.statusCode = 400;
    throw error;
  }

  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) {
    const error = new Error(`"${SHEET_NAME}" 시트가 없습니다. 양식을 내려받아 사용해 주세요.`);
    error.statusCode = 400;
    throw error;
  }

  // 머리글이 양식과 같아야 한다 (열 순서·이름이 바뀐 파일은 거부)
  const headerRow = sheet.getRow(1);
  const mismatched = COLUMNS.filter(
    (column, index) => clean(readCell(headerRow.getCell(index + 1)).value) !== column.header,
  );
  if (mismatched.length > 0) {
    const error = new Error(
      `머리글이 양식과 다릅니다: ${mismatched.map((c) => c.header).join(", ")}. 1행은 바꾸지 말아 주세요.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const lastRow = sheet.actualRowCount > 0 ? sheet.lastRow.number : 1;
  const rows = [];
  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const raw = {};
    const errors = [];
    let hasValue = false;

    COLUMNS.forEach((column, index) => {
      const cell = readCell(row.getCell(index + 1));
      if (cell.formula) {
        errors.push({ row: rowNumber, field: column.header, message: "수식은 받지 않습니다. 값으로 붙여 넣어 주세요." });
        hasValue = true;
        return;
      }
      raw[column.key] = cell.value;
      if (clean(cell.value) !== "") hasValue = true;
    });

    if (hasValue) rows.push({ rowNumber, raw, errors });
    if (rows.length > MAX_ROWS) {
      const error = new Error(`한 번에 ${MAX_ROWS}행까지만 올릴 수 있습니다.`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (rows.length === 0) {
    const error = new Error("입력된 행이 없습니다. 2행부터 화물을 입력해 주세요.");
    error.statusCode = 400;
    throw error;
  }
  return rows;
}

/**
 * 행 하나를 Shipment 문서 입력으로 바꾸고, 문제가 있으면 errors 에 쌓는다.
 * @returns {{doc: object|null, errors: object[]}}
 */
function toShipmentInput({ rowNumber, raw, errors: readErrors }, now = new Date()) {
  const errors = [...readErrors];
  const fail = (field, message) => errors.push({ row: rowNumber, field, message });

  const trackingNumber = clean(raw.trackingNumber);
  if (!trackingNumber) fail("운송장번호", "필수 항목입니다.");
  else if (!TRACKING_PATTERN.test(trackingNumber)) {
    fail("운송장번호", "영문·숫자·.-_ 로 3~64자여야 합니다.");
  } else if (trackingNumber.toUpperCase().startsWith(DEMO_PREFIX)) {
    fail("운송장번호", `"${DEMO_PREFIX}" 로 시작하는 번호는 데모 데이터 전용이라 쓸 수 없습니다.`);
  }

  const modeLabel = clean(raw.mode);
  const mode = MODE_BY_LABEL[modeLabel] || (TRANSIT_TIMES[modeLabel] ? modeLabel : null);
  if (!modeLabel) fail("운송모드", "필수 항목입니다.");
  else if (!mode) fail("운송모드", `알 수 없는 값입니다. (${allowedModes().join(", ")})`);

  const statusLabel = clean(raw.status);
  const status = STATUS_BY_LABEL[statusLabel];
  if (!statusLabel) fail("상태", "필수 항목입니다.");
  else if (!status) fail("상태", `알 수 없는 값입니다. (${allowedStatuses().join(", ")})`);

  const cityOf = (field, value, { required }) => {
    if (clean(value) === "") {
      if (required) fail(field, "필수 항목입니다.");
      return null;
    }
    const point = resolveCity(value);
    if (!point) fail(field, `도시표에 없는 도시입니다: ${clean(value)}`);
    return point;
  };
  const origin = cityOf("출발 도시", raw.origin, { required: true });
  const destination = cityOf("도착 도시", raw.destination, { required: true });
  const currentOverride = cityOf("현재 위치 도시", raw.current, { required: false });

  const dateOf = (field, value, { required }) => {
    if (clean(value) === "" && !(value instanceof Date)) {
      if (required) fail(field, "필수 항목입니다.");
      return null;
    }
    const date = toDate(value);
    if (!date) fail(field, "YYYY-MM-DD 형식이어야 합니다.");
    return date;
  };
  const shippedAt = dateOf("집하일", raw.shippedAt, { required: true });
  const etaInput = dateOf("도착예정일", raw.eta, { required: false });
  const deliveredInput = dateOf("완료일", raw.deliveredAt, { required: false });

  if (shippedAt && shippedAt.getTime() > now.getTime() + 864e5) {
    fail("집하일", "미래 날짜입니다.");
  }
  if (shippedAt && etaInput && etaInput < shippedAt) {
    fail("도착예정일", "집하일보다 빠릅니다.");
  }
  if (deliveredInput && status !== "delivered") {
    fail("완료일", "상태가 배송완료일 때만 입력할 수 있습니다.");
  }
  if (shippedAt && deliveredInput && deliveredInput < shippedAt) {
    fail("완료일", "집하일보다 빠릅니다.");
  }

  const customerName = clean(raw.customerName);
  if (!customerName) fail("고객명", "필수 항목입니다.");
  const customerEmail = clean(raw.customerEmail);
  if (customerEmail && !EMAIL_PATTERN.test(customerEmail)) {
    fail("고객 이메일", "이메일 형식이 아닙니다.");
  }

  if (errors.length > 0) return { doc: null, errors };

  const eta = etaInput || calculateEstimatedArrival(shippedAt, mode, TRANSIT_TIMES);
  const deliveredAt = status === "delivered" ? deliveredInput || eta : null;
  const fallbackCurrent =
    status === "delivered" ? destination : origin;
  const currentLocation = currentOverride || fallbackCurrent;

  const history = [
    {
      location: origin,
      status: "pending",
      description: "엑셀 업로드: 집하",
      timestamp: shippedAt,
    },
  ];
  if (status === "delivered") {
    history.push({
      location: destination,
      status: "delivered",
      description: "엑셀 업로드: 배송 완료",
      timestamp: deliveredAt,
    });
  } else if (status !== "pending") {
    history.push({
      location: currentLocation,
      status,
      description: "엑셀 업로드: 현재 상태",
      timestamp: now,
    });
  }

  const customer = { name: customerName };
  if (customerEmail) customer.email = customerEmail;
  const phone = clean(raw.customerPhone);
  if (phone) customer.phone = phone;

  return {
    errors: [],
    doc: {
      trackingNumber,
      origin,
      destination,
      currentLocation,
      status,
      transportMode: mode,
      shippedAt,
      estimatedDelivery: eta,
      history,
      customer,
    },
  };
}

/**
 * 읽은 행 전체를 검증한다. 파일 안의 운송장번호 중복도 여기서 잡는다.
 * @returns {{docs: object[], errors: object[]}}
 */
function validateRows(rows, now = new Date()) {
  const docs = [];
  const errors = [];
  const seen = new Map();

  for (const row of rows) {
    const result = toShipmentInput(row, now);
    errors.push(...result.errors);
    if (!result.doc) continue;

    const key = result.doc.trackingNumber.toUpperCase();
    if (seen.has(key)) {
      errors.push({
        row: row.rowNumber,
        field: "운송장번호",
        message: `${seen.get(key)}행과 같은 번호입니다.`,
      });
      continue;
    }
    seen.set(key, row.rowNumber);
    docs.push({ ...result.doc, rowNumber: row.rowNumber });
  }
  return { docs, errors };
}

module.exports = {
  COLUMNS,
  MAX_ROWS,
  SHEET_NAME,
  buildTemplate,
  readWorkbook,
  toShipmentInput,
  validateRows,
};
