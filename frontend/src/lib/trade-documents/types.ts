/**
 * 무역서류(상업송장 · 포장명세서) 입력 모델.
 *
 * 두 문서는 같은 선적 건을 다른 관점에서 적은 것이라 입력을 공유한다.
 * 상업송장은 "얼마짜리 물건인가"(단가·금액·결제조건), 포장명세서는
 * "어떻게 포장돼 있는가"(중량·부피·포장수)를 본다. 그래서 품목 한 줄이
 * 상업 정보와 포장 정보를 함께 들고 있고, 문서를 만들 때 각자 필요한
 * 열만 골라 쓴다.
 *
 * ⚠️ 1단계는 공개 preview 라 실제 화물(Shipment) 데이터와 연결되지 않는다.
 *    referenceNo 는 자유 입력 텍스트일 뿐이며 존재 여부를 확인하지 않는다.
 */

export type TradeDocumentType = "invoice" | "packing"

/**
 * Incoterms 2020 중 실무에서 자주 쓰는 것들.
 * 서류에 그대로 찍히는 값이라 코드 그대로 둔다 (번역하지 않는다).
 */
export const INCOTERMS = [
  "EXW",
  "FCA",
  "FOB",
  "CFR",
  "CIF",
  "DAP",
  "DDP",
] as const
export type Incoterm = (typeof INCOTERMS)[number]

/** 결제조건. 역시 서류 표기 그대로다. */
export const PAYMENT_TERMS = [
  "T/T",
  "L/C",
  "D/P",
  "D/A",
  "Open Account",
  "Cash in Advance",
] as const
export type PaymentTerm = (typeof PAYMENT_TERMS)[number]

/** 통화 코드(ISO 4217). 금액 옆에 코드로 찍는다 — 기호는 통화별로 겹쳐서 쓰지 않는다. */
export const CURRENCIES = ["USD", "EUR", "KRW", "CNY", "JPY", "VND"] as const
export type Currency = (typeof CURRENCIES)[number]

/** 수량 단위. 무역서류에서 흔히 쓰는 약어를 그대로 쓴다. */
export const UNITS = ["PCS", "SET", "BOX", "CTN", "PLT", "KG", "M", "M2", "M3"] as const
export type Unit = (typeof UNITS)[number]

/** 운송모드 — 서류에는 영문으로 찍힌다 */
export const SHIP_MODES = ["SEA", "AIR", "RAIL", "TRUCK", "COURIER"] as const
export type ShipMode = (typeof SHIP_MODES)[number]

/** 당사자(수출자 / 수입자) */
export interface TradeParty {
  companyName: string
  address: string
  contact: string
  /** 사업자번호 · VAT · EORI 등. 선택 */
  taxId: string
}

/**
 * 품목 한 줄.
 *
 * 숫자도 문자열로 들고 있다 — 폼에서 칸을 비운 상태("")나 입력 도중("1.")을
 * number 로는 표현할 수 없고, Number("") 가 0 이라 타이핑 중에 "0보다 커야
 * 합니다" 같은 에러가 튀어나온다. 계산·PDF 생성 시점에 한 번만 숫자로 바꾼다.
 * (components/container-planner/cargo-form.tsx 와 같은 관례)
 */
export interface TradeLineItem {
  id: string
  /** 상업 정보 */
  hsCode: string
  description: string
  origin: string
  quantity: string
  unit: Unit
  unitPrice: string
  /** 포장 정보 — 포장명세서에서 쓴다. 비워 두면 합계에서 빠진다. */
  packages: string
  netWeightKg: string
  grossWeightKg: string
  lengthCm: string
  widthCm: string
  heightCm: string
}

export interface TradeDocumentInput {
  /** 문서 정보 */
  invoiceNo: string
  invoiceDate: string
  /** 참조/추적번호 — 자유 입력. 실제 화물 DB 와 대조하지 않는다. */
  referenceNo: string

  shipper: TradeParty
  consignee: TradeParty

  /** 배송조건 */
  countryOfOrigin: string
  countryOfDestination: string
  portOfLoading: string
  portOfDischarge: string
  shipMode: ShipMode
  incoterm: Incoterm
  /** Incoterms 뒤에 붙는 지명 (예: FOB Busan 의 "Busan") */
  incotermPlace: string
  paymentTerm: PaymentTerm
  currency: Currency
  /** 포장 겉면 표기. 포장명세서에만 나간다. 선택 */
  marksAndNumbers: string

  items: TradeLineItem[]
}

export const EMPTY_PARTY: TradeParty = {
  companyName: "",
  address: "",
  contact: "",
  taxId: "",
}

export const createEmptyItem = (id: string): TradeLineItem => ({
  id,
  hsCode: "",
  description: "",
  origin: "",
  quantity: "1",
  unit: "PCS",
  unitPrice: "",
  packages: "1",
  netWeightKg: "",
  grossWeightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
})

export const createEmptyInput = (): TradeDocumentInput => ({
  invoiceNo: "",
  invoiceDate: "",
  referenceNo: "",
  shipper: { ...EMPTY_PARTY },
  consignee: { ...EMPTY_PARTY },
  countryOfOrigin: "",
  countryOfDestination: "",
  portOfLoading: "",
  portOfDischarge: "",
  shipMode: "SEA",
  incoterm: "FOB",
  incotermPlace: "",
  paymentTerm: "T/T",
  currency: "USD",
  marksAndNumbers: "",
  items: [createEmptyItem("item-1")],
})
