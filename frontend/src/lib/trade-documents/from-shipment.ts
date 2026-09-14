/**
 * 화물(Shipment) 데이터 → 무역서류 입력 초안.
 *
 * ⚠️ 대화로 확인한 현실: 화물 데이터로 채울 수 있는 건 물류 정보뿐이다.
 *    상업 정보(단가·HS코드·거래조건·수출입자 법인 정보)는 화물에 아예 없어서
 *    전부 수동이다. 이 함수는 "품목 리스트를 다시 안 타이핑해도 되는" 정도의
 *    편의이지, 송장이 저절로 완성되는 게 아니다.
 *
 *    채워지는 것: 추적번호(referenceNo) · 품목 설명/수량/중량/치수 · 운송모드(대략)
 *              · consignee 회사명(고객명, 주소·세금번호는 없음) · 선적/양하 "항"에
 *                화물의 출발/도착 주소 문자열(정확한 항구명이 아닐 수 있다)
 *    안 채워지는 것: shipper 전체, consignee 주소/세금번호, incoterm/결제조건/통화,
 *              품목별 HS코드/단가/포장수/원산지, marks & numbers
 *
 * ⚠️ 이 파일은 `lib/trade-documents` 안에서 독립적이다 — 대시보드 전용 타입
 *    (`app/(dashboard)/dashboard/use-shipment-detail.ts` 의 `ShipmentDetail`)을
 *    끌어오지 않고, 여기 필요한 필드만 구조적으로 정의한다. `lib/` 은 화면(app/)
 *    보다 아래 계층이라 반대 방향 의존을 만들지 않는다 — 호출부에서 실제 화물
 *    객체를 이 모양에 맞춰 넘기면 된다(초과 필드는 무시된다).
 */

import { createEmptyInput, createEmptyItem } from "./types"
import type { ShipMode, TradeDocumentInput, TradeLineItem } from "./types"

export interface ShipmentPrefillItem {
  description?: string | null
  quantity?: number | null
  /** 화물 모델은 순/총중량을 구분하지 않는다 — netWeightKg 자리에 넣고 grossWeightKg 는 비워 둔다 */
  weight?: number | null
  dimensions?: {
    length?: number | null
    width?: number | null
    height?: number | null
  } | null
}

export interface ShipmentPrefillSource {
  trackingNumber: string
  /** backend TRANSPORT_MODES (AIR/SEA/SEA_AIR/TRUCK_DOMESTIC/TRUCK_CROSSBORDER/RAIL/EXPRESS) */
  transportMode?: string | null
  origin?: { address?: string | null } | null
  destination?: { address?: string | null } | null
  customer?: { name?: string | null } | null
  items?: ShipmentPrefillItem[] | null
}

/**
 * 화물의 7가지 운송모드 → 무역서류의 5가지 운송모드.
 * TRUCK_DOMESTIC/TRUCK_CROSSBORDER 는 TRUCK 으로, SEA_AIR 는 SEA 로,
 * EXPRESS 는 COURIER 로 뭉친다 — 손실 매핑이라 필요하면 사용자가 바로 고친다.
 */
const SHIP_MODE_BY_TRANSPORT_MODE: Record<string, ShipMode> = {
  SEA: "SEA",
  AIR: "AIR",
  RAIL: "RAIL",
  TRUCK_DOMESTIC: "TRUCK",
  TRUCK_CROSSBORDER: "TRUCK",
  SEA_AIR: "SEA",
  EXPRESS: "COURIER",
}

const mapShipMode = (transportMode?: string | null): ShipMode =>
  (transportMode && SHIP_MODE_BY_TRANSPORT_MODE[transportMode]) || "SEA"

const numToStr = (n: number | null | undefined): string =>
  n === null || n === undefined ? "" : String(n)

const mapItem = (item: ShipmentPrefillItem, id: string): TradeLineItem => {
  const empty = createEmptyItem(id)
  return {
    ...empty,
    description: item.description ?? "",
    quantity: item.quantity != null ? numToStr(item.quantity) : empty.quantity,
    netWeightKg: numToStr(item.weight),
    lengthCm: numToStr(item.dimensions?.length),
    widthCm: numToStr(item.dimensions?.width),
    heightCm: numToStr(item.dimensions?.height),
  }
}

/** 오늘 날짜, `<input type="date">` 이 받는 형식(YYYY-MM-DD) */
const todayIso = (): string => new Date().toISOString().slice(0, 10)

export function buildInputFromShipment(shipment: ShipmentPrefillSource): TradeDocumentInput {
  const base = createEmptyInput()
  const items =
    shipment.items && shipment.items.length > 0
      ? shipment.items.map((item, index) => mapItem(item, `item-${index + 1}`))
      : base.items

  return {
    ...base,
    invoiceDate: todayIso(),
    referenceNo: shipment.trackingNumber,
    consignee: { ...base.consignee, companyName: shipment.customer?.name ?? "" },
    portOfLoading: shipment.origin?.address ?? "",
    portOfDischarge: shipment.destination?.address ?? "",
    shipMode: mapShipMode(shipment.transportMode),
    items,
  }
}
