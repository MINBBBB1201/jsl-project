"use client"

import { useCallback } from "react"

import { request, useAsyncResource } from "./use-async-resource"

// 운송모드/등급 정의는 공개 추적 페이지와 공유한다
export {
  TRANSPORT_MODE_LABELS,
  type TransportMode,
  type RiskLevel,
} from "@/lib/transport-modes"

import type { TransportMode, RiskLevel } from "@/lib/transport-modes"

export interface DelaySummary {
  total: number
  정상: number
  지연위험: number
  지연: number
  updatedAt: string
  meta: {
    totalShipments: number
    deliveredExcluded: number
    unscorable: number
    method: string
    note: string
  }
}

export interface DelayRisk {
  score: number | null
  level: RiskLevel | null
  elapsedDays: number | null
  standardDays: number | null
  /** "estimate" 면 업계 평균 추정치, "company-profile" 이면 실측 */
  standardSource: string | null
  skipped: string | null
}

export interface RiskShipment {
  _id: string
  trackingNumber: string
  transportMode: TransportMode
  status: string
  shippedAt: string
  estimatedArrivalAt: string | null
  origin?: { address?: string }
  destination?: { address?: string }
  // customer 는 목록 응답에서 제외된다 (개인정보 최소제공 — shipment.controller.js 참고)
  delayRisk: DelayRisk
}

/** 지연 리스크 등급별 집계 */
export function useDelaySummary() {
  const fetcher = useCallback(
    () => request<DelaySummary>("/api/shipments/delay-summary"),
    []
  )
  return useAsyncResource(fetcher, "지연 집계를 불러오지 못했습니다.")
}

/** 지연위험 + 지연 화물 목록 (경과율 높은 순) */
export function useRiskShipments(limit = 8) {
  const fetcher = useCallback(async () => {
    // 두 등급을 각각 조회한 뒤 경과율 순으로 합친다
    const levels: RiskLevel[] = ["지연", "지연위험"]
    const responses = await Promise.all(
      levels.map((level) =>
        request<{ data: RiskShipment[] }>(
          `/api/shipments?riskLevel=${encodeURIComponent(level)}&limit=${limit}`
        )
      )
    )

    return responses
      .flatMap((r) => r.data)
      .sort((a, b) => (b.delayRisk.score ?? 0) - (a.delayRisk.score ?? 0))
      .slice(0, limit)
  }, [limit])

  return useAsyncResource(fetcher, "지연 화물 목록을 불러오지 못했습니다.")
}
