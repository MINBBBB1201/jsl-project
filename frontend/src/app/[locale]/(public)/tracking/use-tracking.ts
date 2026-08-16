"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { API_BASE_URL } from "@/lib/api"
import type { RiskLevel, TransportMode } from "@/lib/transport-modes"

export interface TrackedShipment {
  trackingNumber: string
  transportMode: TransportMode | null
  status: string
  origin: string | null
  destination: string | null
  currentLocation: string | null
  shippedAt: string | null
  estimatedArrivalAt: string | null
  delayRisk: {
    level: RiskLevel | null
    score: number | null
    elapsedDays: number | null
    standardDays: number | null
    standardSource: string | null
    skipped: string | null
  }
}

/**
 * 안내용 예시 운송장번호를 실제 DB 에서 가져온다.
 *
 * TODO: 실제 배송 데이터가 연결되면 이 훅과 화면의 데모 안내 블록을 삭제하세요.
 *       (지금은 `DEMO-` 합성 데이터뿐이라 안내가 없으면 뭘 넣을지 알 수 없다.
 *        번호를 하드코딩하지 않는 이유는 시드를 다시 돌리면 접미사가 바뀌기 때문.)
 */
export function useSampleTrackingNumbers(count = 4) {
  const [samples, setSamples] = useState<string[]>([])

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments?limit=${count}`)
      const json = await res.json().catch(() => null)
      if (signal?.aborted || !res.ok || !json?.success) return
      setSamples(
        (json.data as { trackingNumber: string }[])
          .map((s) => s.trackingNumber)
          .filter(Boolean)
          .slice(0, count)
      )
    } catch {
      // 예시 번호는 부가 정보라 실패해도 조회 기능은 그대로 쓸 수 있다
    }
  }, [count])

  useEffect(() => {
    const controller = new AbortController()
    // load 는 async 라 setState 가 await 이후에만 일어난다 (동기 setState 아님)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return samples
}

export function useTracking() {
  const t = useTranslations("tracking")
  const [shipment, setShipment] = useState<TrackedShipment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const track = useCallback(async (trackingNumber: string) => {
    const trimmed = trackingNumber.trim()
    if (!trimmed) {
      setError(t("errorEmpty"))
      setShipment(null)
      setSearched(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setShipment(null)

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shipments/track/${encodeURIComponent(trimmed)}`
      )
      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        setError(
          json?.error ??
            json?.errors?.[0]?.msg ??
            `조회에 실패했습니다. (HTTP ${res.status})`
        )
        return
      }

      setShipment(json.data as TrackedShipment)
    } catch (err) {
      setError(
        err instanceof Error ? `${t("errorNetwork")} (${err.message})` : t("errorNetwork")
      )
    } finally {
      setIsLoading(false)
      setSearched(true)
    }
  }, [t])

  return { shipment, isLoading, error, searched, track }
}
