/**
 * 폼(TradeDocumentInput, 숫자=String) → API 요청 바디(TradeDocumentApiInput, 숫자=Number|null).
 *
 * 백엔드 컨트롤러(`normalizeInput`)도 문자열을 방어적으로 정규화하긴 하지만,
 * 클라이언트가 미리 같은 규칙으로 변환해 보내면 네트워크를 타기 전에 타입이
 * 확정된다. `parseAmount` 는 백엔드의 `num()` 과 규칙이 같다 — 빈 문자열/공백은
 * null, 숫자로 못 바꾸면 null(에러를 던지지 않는다). draft 저장은 미완성 입력도
 * 허용해야 하므로(작성 중인 서류) 여기서 막지 않는다 — 검증은 `validateInput` 이
 * 별도로 한다.
 */

import { parseAmount } from "./totals"
import type { TradeDocumentInput, TradeLineItem } from "./types"
import type { TradeDocumentApiInput, TradeLineItemApi } from "./api-types"

const toApiItem = (item: TradeLineItem): TradeLineItemApi => ({
  hsCode: item.hsCode,
  description: item.description,
  origin: item.origin,
  quantity: parseAmount(item.quantity) ?? 0,
  unit: item.unit,
  unitPrice: parseAmount(item.unitPrice),
  packages: parseAmount(item.packages),
  netWeightKg: parseAmount(item.netWeightKg),
  grossWeightKg: parseAmount(item.grossWeightKg),
  lengthCm: parseAmount(item.lengthCm),
  widthCm: parseAmount(item.widthCm),
  heightCm: parseAmount(item.heightCm),
})

/** invoiceNo 는 담지 않는다 — 서버에서 documentNo 가 그 자리를 대신한다. */
export function toApiInput(input: TradeDocumentInput): TradeDocumentApiInput {
  return {
    invoiceDate: input.invoiceDate,
    referenceNo: input.referenceNo,
    shipper: { ...input.shipper },
    consignee: { ...input.consignee },
    countryOfOrigin: input.countryOfOrigin,
    countryOfDestination: input.countryOfDestination,
    portOfLoading: input.portOfLoading,
    portOfDischarge: input.portOfDischarge,
    shipMode: input.shipMode,
    incoterm: input.incoterm,
    incotermPlace: input.incotermPlace,
    paymentTerm: input.paymentTerm,
    currency: input.currency,
    marksAndNumbers: input.marksAndNumbers,
    items: input.items.map(toApiItem),
  }
}
