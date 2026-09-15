const mongoose = require("mongoose");

const {
  TRADE_DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  INCOTERMS,
  PAYMENT_TERMS,
  CURRENCIES,
  UNITS,
  SHIP_MODES,
} = require("../config/trade-documents");

/**
 * 무역서류 (상업송장 · 포장명세서 · 프로포마 인보이스).
 *
 * ── 왜 Shipment 를 확장하지 않고 별도 컬렉션인가 ────────────────────────
 *  - 화물 1건에 서류는 여러 장 나온다 (CI + PL, 개정본, 분할선적 송장…).
 *  - 발행된 서류는 얼어야 한다. 은행·세관에 낸 송장인데 나중에 화물 정보를
 *    고쳤다고 서류 내용이 바뀌면 안 된다. 그래서 input 을 스냅샷으로 복사해
 *    들고 있고, shipmentId 는 추적용 soft link 로만 둔다(join 해서 렌더하지 않음).
 *  - 상업 정보(단가·HS코드·거래조건·수출입자 법인)는 물류 데이터가 아니라
 *    Shipment 에 둘 자리가 없다.
 *
 * ── input 스냅샷 ──────────────────────────────────────────────────────
 *  프론트 공개 생성기(Phase 1)의 TradeDocumentInput 과 같은 모양이다. 다만
 *  Phase 1 폼은 숫자를 String 으로 들고 있고("1." 같은 입력 중 상태), 저장할
 *  때는 Number 로 정규화한다. invoiceNo 는 저장하지 않는다 — documentNo 가
 *  authoritative 이고, 응답을 만들 때 toClientJSON 이 input.invoiceNo 로 넣어준다.
 *
 * ── 개정본 체인 ──────────────────────────────────────────────────────
 *  issued 문서를 고치려면 revise → input 을 복사한 새 draft(version+1)를 만든다.
 *  같은 revisionRootId 안에서 issued(superseded 아님) 문서는 최대 1개.
 */

const partySchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, maxlength: 200, default: "" },
    address: { type: String, trim: true, maxlength: 500, default: "" },
    contact: { type: String, trim: true, maxlength: 300, default: "" },
    taxId: { type: String, trim: true, maxlength: 100, default: "" },
  },
  { _id: false },
);

/** 0 이상만 허용. 빈 값(미입력)은 null 로 들어온다 — 0 과 구분해야 포장명세서 합계가 맞다. */
const nonNegative = { type: Number, min: 0, default: null };

const lineItemSchema = new mongoose.Schema(
  {
    hsCode: { type: String, trim: true, maxlength: 20, default: "" },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    origin: { type: String, trim: true, maxlength: 100, default: "" },
    quantity: { type: Number, min: 0, default: 0 },
    unit: { type: String, enum: UNITS, default: "PCS" },
    unitPrice: nonNegative,
    packages: nonNegative,
    netWeightKg: nonNegative,
    grossWeightKg: nonNegative,
    lengthCm: nonNegative,
    widthCm: nonNegative,
    heightCm: nonNegative,
  },
  { _id: false },
);

const inputSchema = new mongoose.Schema(
  {
    invoiceDate: { type: String, trim: true, maxlength: 20, default: "" }, // ISO date 문자열 (Phase 1 과 동일하게 문자열로)
    referenceNo: { type: String, trim: true, maxlength: 100, default: "" },

    shipper: { type: partySchema, default: () => ({}) },
    consignee: { type: partySchema, default: () => ({}) },

    countryOfOrigin: { type: String, trim: true, maxlength: 100, default: "" },
    countryOfDestination: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    portOfLoading: { type: String, trim: true, maxlength: 100, default: "" },
    portOfDischarge: { type: String, trim: true, maxlength: 100, default: "" },

    shipMode: { type: String, enum: SHIP_MODES, default: "SEA" },
    incoterm: { type: String, enum: INCOTERMS, default: "FOB" },
    incotermPlace: { type: String, trim: true, maxlength: 100, default: "" },
    paymentTerm: { type: String, enum: PAYMENT_TERMS, default: "T/T" },
    currency: { type: String, enum: CURRENCIES, default: "USD" },
    marksAndNumbers: { type: String, trim: true, maxlength: 2000, default: "" },

    items: { type: [lineItemSchema], default: [] },
  },
  { _id: false },
);

const tradeDocumentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: TRADE_DOCUMENT_TYPES,
      required: true,
      index: true,
    },

    /** issue 시점에 Counter 로 부여. draft 는 미설정(unset). */
    documentNo: { type: String },

    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: "draft",
      index: true,
    },

    // ── 개정본 체인 ──────────────────────────────────────────────
    /** 최초 버전의 _id. 최초 문서는 자기 자신을 가리킨다(pre-save 에서 설정). */
    revisionRootId: { type: mongoose.Schema.Types.ObjectId, index: true },
    version: { type: Number, default: 1, min: 1 },
    previousVersionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    supersededById: { type: mongoose.Schema.Types.ObjectId, default: null },

    input: { type: inputSchema, default: () => ({}) },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issuedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// 한 체인 안에서 version 은 유일하다 (구조 무결성).
tradeDocumentSchema.index({ revisionRootId: 1, version: 1 }, { unique: true });

// 같은 documentNo 는 개정본끼리 공유하지만(CI-2026-0042 Rev.1 = 같은 번호),
// 한 (번호, version) 쌍이 둘일 수는 없다. draft 는 번호가 없어 인덱스에서 빠진다.
// sparse 대신 partial: sparse 는 명시적 null 도 인덱싱해 draft 끼리 충돌한다.
tradeDocumentSchema.index(
  { documentNo: 1, version: 1 },
  {
    unique: true,
    partialFilterExpression: { documentNo: { $type: "string" } },
  },
);
tradeDocumentSchema.index({ createdAt: -1 });

// 최초 저장 시 revisionRootId 를 자기 _id 로.
tradeDocumentSchema.pre("save", function setRevisionRoot(next) {
  if (!this.revisionRootId) this.revisionRootId = this._id;
  next();
});

tradeDocumentSchema.methods.isEditable = function isEditable() {
  return this.status === "draft";
};

/**
 * 프론트(공개 생성기와 같은 PDF 컴포넌트)가 그대로 먹을 수 있는 모양으로.
 * input 에는 저장하지 않는 invoiceNo 를 documentNo 로 채워 넣는다.
 */
tradeDocumentSchema.methods.toClientJSON = function toClientJSON() {
  const input = this.input.toObject ? this.input.toObject() : { ...this.input };
  return {
    id: this._id.toString(),
    type: this.type,
    documentNo: this.documentNo ?? null,
    status: this.status,
    shipmentId: this.shipmentId ? this.shipmentId.toString() : null,
    revisionRootId: this.revisionRootId ? this.revisionRootId.toString() : null,
    version: this.version,
    previousVersionId: this.previousVersionId
      ? this.previousVersionId.toString()
      : null,
    supersededById: this.supersededById ? this.supersededById.toString() : null,
    createdBy: this.createdBy ? this.createdBy.toString() : null,
    issuedBy: this.issuedBy ? this.issuedBy.toString() : null,
    issuedAt: this.issuedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    input: { ...input, invoiceNo: this.documentNo || "" },
  };
};

module.exports = mongoose.model("TradeDocument", tradeDocumentSchema);
