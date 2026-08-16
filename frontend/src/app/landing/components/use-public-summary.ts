"use client"

import * as React from "react"

import { API_BASE_URL } from "@/lib/api"

export interface PublicSummary {
  inTransit: number
  normal: number
  atRisk: number
  delayed: number
  onTimeRate: number | null
  /** demo = 시드 합성 데이터, live = 실제 데이터, mixed = 섞임, empty = 데이터 없음 */
  dataSource: "demo" | "live" | "mixed" | "empty"
  updatedAt: string
}

/**
 * 랜딩 히어로의 운영 현황 패널 데이터.
 *
 * 대시보드용 /delay-summary 는 로그인이 필요하므로 공개 집계 엔드포인트를 쓴다.
 * 등급별 건수만 내려오고 화물 단위 정보는 없다.
 *
 * 히어로는 첫 화면이라 실패해도 페이지가 멈추면 안 된다. 에러는 상태로만 알리고
 * 화면 쪽에서 패널만 조용히 접는다.
 */
export function usePublicSummary() {
  const [data, setData] = React.useState<PublicSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isError, setIsError] = React.useState(false)

  React.useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shipments/public-summary`, {
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)

        if (controller.signal.aborted) return

        if (!res.ok || !json?.success) {
          setIsError(true)
          return
        }

        setData(json.data as PublicSummary)
      } catch {
        if (!controller.signal.aborted) setIsError(true)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return { data, isLoading, isError }
}
