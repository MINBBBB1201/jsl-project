import { parseAmount } from "./totals"
import type { TradeDocumentInput } from "./types"

/**
 * 입력 검증.
 *
 * 서류로 나가면 곤란한 것만 막는다 — 회사명 없는 송장, 수량 0 인 품목처럼
 * 받는 쪽에서 되돌려 보낼 값들이다. HS코드·중량·치수는 비워도 서류는 성립하므로
 * (포장명세서 합계에서 "-" 로 빠질 뿐) 필수로 잡지 않는다.
 *
 * 메시지 키만 돌려주고 문구는 화면에서 번역한다 — 폼 UI 는 4개 로케일을 따른다.
 */

export interface ValidationErrors {
  invoiceNo?: string
  invoiceDate?: string
  shipperCompanyName?: string
  shipperAddress?: string
  consigneeCompanyName?: string
  consigneeAddress?: string
  countryOfOrigin?: string
  countryOfDestination?: string
  /** 품목 id → 필드 → 메시지 키 */
  items: Record<string, Partial<Record<"description" | "quantity" | "unitPrice", string>>>
  /** 품목이 하나도 없을 때 */
  itemsEmpty?: string
}

const required = (value: string) => value.trim() === ""

/** 0 보다 큰 수여야 하는 값 */
const notPositive = (raw: string) => {
  const value = parseAmount(raw)
  return value === null || value <= 0
}

/** 0 이상이어야 하는 값 (단가 0 은 무상 샘플 선적에서 실제로 쓰인다) */
const negativeOrEmpty = (raw: string) => {
  const value = parseAmount(raw)
  return value === null || value < 0
}

export function validateInput(input: TradeDocumentInput): ValidationErrors {
  const errors: ValidationErrors = { items: {} }

  if (required(input.invoiceNo)) errors.invoiceNo = "errors.required"
  if (required(input.invoiceDate)) errors.invoiceDate = "errors.required"

  if (required(input.shipper.companyName)) errors.shipperCompanyName = "errors.required"
  if (required(input.shipper.address)) errors.shipperAddress = "errors.required"
  if (required(input.consignee.companyName))
    errors.consigneeCompanyName = "errors.required"
  if (required(input.consignee.address)) errors.consigneeAddress = "errors.required"

  if (required(input.countryOfOrigin)) errors.countryOfOrigin = "errors.required"
  if (required(input.countryOfDestination))
    errors.countryOfDestination = "errors.required"

  if (input.items.length === 0) {
    errors.itemsEmpty = "errors.itemsEmpty"
  }

  for (const item of input.items) {
    const itemErrors: ValidationErrors["items"][string] = {}
    if (required(item.description)) itemErrors.description = "errors.required"
    if (notPositive(item.quantity)) itemErrors.quantity = "errors.positive"
    // 무상 샘플은 단가 0 으로 나가므로 0 을 막지 않는다. 음수와 빈 칸만 막는다.
    if (negativeOrEmpty(item.unitPrice)) itemErrors.unitPrice = "errors.nonNegative"

    if (Object.keys(itemErrors).length > 0) errors.items[item.id] = itemErrors
  }

  return errors
}

export function hasBlockingErrors(errors: ValidationErrors): boolean {
  const { items, ...rest } = errors
  if (Object.values(rest).some(Boolean)) return true
  return Object.keys(items).length > 0
}
