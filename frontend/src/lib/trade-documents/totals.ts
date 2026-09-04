import type { TradeDocumentInput, TradeLineItem } from "./types"

/**
 * 합계 계산.
 *
 * 순수 함수로 둔다 — 폼(실시간 재계산)과 PDF 두 군데서 같은 값을 써야 하는데,
 * 각자 계산하면 화면의 총액과 서류의 총액이 어긋날 수 있다. 통관 서류에서
 * 그건 그냥 틀린 서류다.
 */

/**
 * 숫자 입력 파싱.
 *
 * ⚠️ 빈 칸("")은 0 이 아니라 null 이다. Number("") === 0 을 그대로 쓰면
 *    "입력하지 않음" 과 "0 을 입력함" 이 구분되지 않아, 아무것도 안 적은
 *    중량 합계가 0kg 으로 서류에 찍힌다. 아래 hasAny* 플래그로 구분한다.
 */
export const parseAmount = (raw: string): number | null => {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/** 파싱 실패·빈 값은 0 으로 (합계에 더할 때만 쓴다) */
const num = (raw: string): number => parseAmount(raw) ?? 0

/** 한 줄의 금액 = 수량 × 단가 */
export const lineAmount = (item: TradeLineItem): number =>
  num(item.quantity) * num(item.unitPrice)

/** 한 줄의 부피(CBM) = L×W×H(cm) ÷ 1,000,000 × 포장수 */
export const lineVolumeCbm = (item: TradeLineItem): number => {
  const l = num(item.lengthCm)
  const w = num(item.widthCm)
  const h = num(item.heightCm)
  if (l <= 0 || w <= 0 || h <= 0) return 0
  return (l * w * h * Math.max(num(item.packages), 0)) / 1_000_000
}

export interface TradeTotals {
  /** 상업송장 */
  totalQuantity: number
  subtotal: number
  total: number
  /** 포장명세서 */
  totalPackages: number
  totalNetWeightKg: number
  totalGrossWeightKg: number
  totalVolumeCbm: number
  /**
   * 값이 하나라도 입력됐는지. 전부 비어 있으면 합계 0 이 아니라 "—" 로
   * 보여줘야 한다 — 0kg 짜리 화물은 없다.
   */
  hasNetWeight: boolean
  hasGrossWeight: boolean
  hasVolume: boolean
}

export function computeTotals(input: TradeDocumentInput): TradeTotals {
  let totalQuantity = 0
  let subtotal = 0
  let totalPackages = 0
  let totalNetWeightKg = 0
  let totalGrossWeightKg = 0
  let totalVolumeCbm = 0
  let hasNetWeight = false
  let hasGrossWeight = false
  let hasVolume = false

  for (const item of input.items) {
    totalQuantity += num(item.quantity)
    subtotal += lineAmount(item)
    totalPackages += num(item.packages)

    if (parseAmount(item.netWeightKg) !== null) {
      hasNetWeight = true
      totalNetWeightKg += num(item.netWeightKg)
    }
    if (parseAmount(item.grossWeightKg) !== null) {
      hasGrossWeight = true
      totalGrossWeightKg += num(item.grossWeightKg)
    }

    const volume = lineVolumeCbm(item)
    if (volume > 0) {
      hasVolume = true
      totalVolumeCbm += volume
    }
  }

  return {
    totalQuantity,
    subtotal,
    // 1단계에는 운임·보험료 같은 가산 항목이 없어 소계와 총액이 같다.
    // 그래도 서류에 두 줄이 다 나가므로 필드를 나눠 둔다 — 나중에 가산 항목이
    // 생겼을 때 총액의 의미가 조용히 바뀌지 않도록.
    total: subtotal,
    totalPackages,
    totalNetWeightKg,
    totalGrossWeightKg,
    totalVolumeCbm,
    hasNetWeight,
    hasGrossWeight,
    hasVolume,
  }
}

/**
 * 금액 표기.
 *
 * 원·엔은 소수점을 쓰지 않는다(최소 단위가 1). 달러·유로는 두 자리까지.
 * 통관 서류에서 "1,240.00 KRW" 같은 표기는 실무자가 보면 바로 어색하다.
 */
const ZERO_DECIMAL_CURRENCIES = new Set(["KRW", "JPY", "VND"])

export const formatMoney = (value: number, currency: string): string => {
  const digits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** 수량·중량 표기 — 불필요한 소수점 0 을 붙이지 않는다 */
export const formatNumber = (value: number, maxDigits = 3): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: maxDigits })
