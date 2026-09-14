/**
 * 무역서류 백엔드(`/api/trade-documents`, Phase 2a)와 주고받는 타입.
 *
 * `./types.ts` 의 `TradeDocumentInput` 은 폼(화면) 모양이다 — 숫자를 String 으로
 * 들고 있고, 문서 종류를 "invoice"/"packing" 으로 구분한다(1단계 공개 생성기 유산).
 * 여기 타입들은 서버가 실제로 저장·응답하는 모양이다 — 숫자는 Number/null,
 * 문서 종류는 백엔드 enum(`commercial_invoice`/`packing_list`/`proforma_invoice`).
 * 둘을 오가는 변환은 `./serialize.ts` · `./deserialize.ts` 가 맡는다.
 *
 * ⚠️ 필드는 `backend/src/models/trade-document.model.js` 와 같아야 한다.
 *    (config/trade-documents.js 의 enum 이 프론트 types.ts 를 복제한 것과 반대 방향의
 *    동기화 — 여기서는 백엔드 스키마를 프론트가 따라간다)
 */

import type { Currency, Incoterm, PaymentTerm, ShipMode, TradeParty, Unit } from "./types"

export const API_TRADE_DOCUMENT_TYPES = [
  "commercial_invoice",
  "packing_list",
  "proforma_invoice",
] as const
export type ApiTradeDocumentType = (typeof API_TRADE_DOCUMENT_TYPES)[number]

export const TRADE_DOCUMENT_STATUSES = ["draft", "issued", "superseded"] as const
export type TradeDocumentStatus = (typeof TRADE_DOCUMENT_STATUSES)[number]

/** 품목 한 줄 — 서버 저장 모양. 빈 값은 0 이 아니라 null(= 미입력)이다. */
export interface TradeLineItemApi {
  hsCode: string
  description: string
  origin: string
  quantity: number
  unit: Unit
  unitPrice: number | null
  packages: number | null
  netWeightKg: number | null
  grossWeightKg: number | null
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
}

/**
 * 서버가 들고 있는(그리고 생성·수정 요청에 보내는) 입력 스냅샷.
 *
 * `invoiceNo` 는 요청에 없다 — 서버가 `documentNo` 로 관리하고, 응답에만
 * `input.invoiceNo` 로 채워 넣어 준다(PDF 컴포넌트가 그대로 먹을 수 있게).
 */
export interface TradeDocumentApiInput {
  invoiceDate: string
  referenceNo: string
  shipper: TradeParty
  consignee: TradeParty
  countryOfOrigin: string
  countryOfDestination: string
  portOfLoading: string
  portOfDischarge: string
  shipMode: ShipMode
  incoterm: Incoterm
  incotermPlace: string
  paymentTerm: PaymentTerm
  currency: Currency
  marksAndNumbers: string
  items: TradeLineItemApi[]
  /** 응답에서만 내려온다. 요청 바디에는 넣지 않는다(보내도 서버가 무시한다). */
  invoiceNo?: string
}

/** 개정 체인 한 칸의 요약. 단건/발행 응답에 함께 온다. */
export interface TradeDocumentVersionSummary {
  id: string
  version: number
  status: TradeDocumentStatus
  documentNo: string | null
  issuedAt: string | null
  createdAt: string
}

/** 무역서류 레코드 (목록/단건/생성/수정 응답의 `data`) */
export interface TradeDocumentRecord {
  id: string
  type: ApiTradeDocumentType
  documentNo: string | null
  status: TradeDocumentStatus
  shipmentId: string | null
  revisionRootId: string | null
  version: number
  previousVersionId: string | null
  supersededById: string | null
  createdBy: string | null
  issuedBy: string | null
  issuedAt: string | null
  createdAt: string
  updatedAt: string
  input: TradeDocumentApiInput
}
