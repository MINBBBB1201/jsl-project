"use client"

import { useCallback } from "react"

import { request, useAsyncResource } from "./use-async-resource"
import type { DelayRisk } from "./use-delay-summary"
import type { TransportMode } from "@/lib/transport-modes"

/**
 * 화물 단건 상세.
 *
 * GET /api/shipments/:trackingNumber 하나만 쓴다. 이 응답에 history 가 이미
 * 들어 있어 /:trackingNumber/history 를 따로 부를 필요가 없다.
 *
 * ⚠️ 이 훅이 목록(useShipmentList)과 다른 점은 고객 정보가 딸려 온다는 것이다.
 *    목록 응답에는 customer 가 없다(개인정보 최소제공). 그래서 이 타입으로
 *    받은 데이터를 목록 쪽 컴포넌트에 그대로 흘려보내지 않도록 주의한다 —
 *    노출은 상세 Drawer 안에서만 한다.
 */

export interface ShipmentCustomer {
  name: string
  email: string
  phone?: string
}

export interface ShipmentHistoryEntry {
  _id?: string
  status: string
  description?: string
  timestamp: string
  location?: { address?: string }
}

export interface ShipmentDetail {
  _id: string
  trackingNumber: string
  status: string
  transportMode: TransportMode | null
  shippedAt: string | null
  estimatedArrivalAt: string | null
  estimatedDelivery: string
  createdAt: string
  updatedAt: string
  origin?: { address?: string }
  destination?: { address?: string }
  currentLocation?: { address?: string }
  /** 인증된 내부 상세 조회에서만 내려온다 */
  customer?: ShipmentCustomer
  history?: ShipmentHistoryEntry[]
  delayRisk: DelayRisk
}

/**
 * @param trackingNumber null 이면 조회하지 않는다.
 *
 * 호출부가 Drawer 가 닫혀 있을 때 이 훅을 아예 마운트하지 않는 것이 원칙이지만,
 * 여기서도 한 번 더 막는다 — 훅이 마운트되자마자 요청을 보내는 구조라
 * (use-async-resource.ts) 가드가 호출부에만 있으면 조건이 하나 바뀌는 순간
 * 조용히 불필요한 요청이 나간다.
 */
export function useShipmentDetail(trackingNumber: string | null) {
  const fetcher = useCallback(async () => {
    if (!trackingNumber) return null
    const json = await request<{ data: ShipmentDetail }>(
      `/api/shipments/${encodeURIComponent(trackingNumber)}`
    )
    return json.data
  }, [trackingNumber])

  return useAsyncResource(fetcher, "화물 정보를 불러오지 못했습니다.")
}
