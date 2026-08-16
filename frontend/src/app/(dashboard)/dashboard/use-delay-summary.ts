"use client"

import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"
import { authHeaders } from "@/lib/auth"

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

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

// 대시보드 조회 API 는 로그인 필수라 토큰을 함께 보낸다
const request = async <T,>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() })
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.error ?? `요청이 실패했습니다. (HTTP ${res.status})`)
  }
  return json as T
}

/**
 * 비동기 로딩 공통 훅.
 *
 * 초기 상태가 이미 isLoading: true 라, effect 안에서 동기적으로 setState 를
 * 부르지 않는다 (react-hooks/set-state-in-effect). 재조회할 때만 로딩 상태를
 * 다시 세운다.
 */
function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  fallbackMessage: string
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: true,
    error: null,
  })

  // fetcher 는 호출부에서 useCallback 으로 고정해야 매 렌더 재조회되지 않는다
  const run = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await fetcher()
        if (signal?.aborted) return
        setState({ data: result, isLoading: false, error: null })
      } catch (error) {
        if (signal?.aborted) return
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : fallbackMessage,
        })
      }
    },
    [fetcher, fallbackMessage]
  )

  useEffect(() => {
    const controller = new AbortController()
    // run 은 async 라 첫 문장이 await 다. setState 는 fetch 가 끝난 뒤에만
    // 호출되므로 규칙이 경고하는 "동기 setState 로 인한 연쇄 렌더" 는 없다.
    // (린트가 함수 경계를 넘어 추적하면서 나는 오탐)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(controller.signal)
    return () => controller.abort()
  }, [run])

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    run()
  }, [run])

  return { ...state, reload }
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
