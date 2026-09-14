/**
 * API 응답(TradeDocumentApiInput, 숫자=Number|null) → 폼(TradeDocumentInput, 숫자=String).
 *
 * serialize.ts 의 반대 방향. 저장된 서류를 편집 화면에 다시 올릴 때 쓴다.
 * 품목에는 API 가 안 갖고 있는 client 전용 `id`(React key)를 새로 붙인다.
 */

import { createEmptyItem } from "./types"
import type { TradeDocumentInput, TradeLineItem } from "./types"
import type { TradeDocumentApiInput, TradeLineItemApi } from "./api-types"

/** null/undefined 는 빈 칸("")으로 — 0 과 "미입력"을 섞지 않는다 */
const numToStr = (n: number | null | undefined): string =>
  n === null || n === undefined ? "" : String(n)

const fromApiItem = (item: TradeLineItemApi, id: string): TradeLineItem => ({
  id,
  hsCode: item.hsCode,
  description: item.description,
  origin: item.origin,
  quantity: numToStr(item.quantity),
  unit: item.unit,
  unitPrice: numToStr(item.unitPrice),
  packages: numToStr(item.packages),
  netWeightKg: numToStr(item.netWeightKg),
  grossWeightKg: numToStr(item.grossWeightKg),
  lengthCm: numToStr(item.lengthCm),
  widthCm: numToStr(item.widthCm),
  heightCm: numToStr(item.heightCm),
})

export function fromApiInput(api: TradeDocumentApiInput): TradeDocumentInput {
  const items =
    api.items.length > 0
      ? api.items.map((item, index) => fromApiItem(item, `item-${index + 1}`))
      : [createEmptyItem("item-1")]

  return {
    invoiceNo: api.invoiceNo ?? "",
    invoiceDate: api.invoiceDate,
    referenceNo: api.referenceNo,
    shipper: { ...api.shipper },
    consignee: { ...api.consignee },
    countryOfOrigin: api.countryOfOrigin,
    countryOfDestination: api.countryOfDestination,
    portOfLoading: api.portOfLoading,
    portOfDischarge: api.portOfDischarge,
    shipMode: api.shipMode,
    incoterm: api.incoterm,
    incotermPlace: api.incotermPlace,
    paymentTerm: api.paymentTerm,
    currency: api.currency,
    marksAndNumbers: api.marksAndNumbers,
    items,
  }
}
