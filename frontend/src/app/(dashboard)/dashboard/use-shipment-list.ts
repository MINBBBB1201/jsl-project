"use client"

import { useCallback } from "react"

import { request, useAsyncResource } from "./use-async-resource"
import type { RiskShipment } from "./use-delay-summary"
import type { RiskLevel, TransportMode } from "@/lib/transport-modes"

/**
 * 화물 목록 조회 훅.
 *
 * 새 엔드포인트를 만들지 않고 GET /api/shipments 를 그대로 쓴다. 그쪽이 이미
 * status / transportMode / riskLevel 필터와 sortBy / sortOrder / page / limit 을
 * 지원한다 (shipment.controller.js getAllShipments).
 *
 * ⚠️ 필터·정렬·페이지는 전부 서버가 처리한다. 한 번 받아서 화면에서 거르면
 *    pagination.total 이 실제 건수와 어긋나고, 216건 중 앞의 50건 안에서만
 *    필터가 도는 조용한 거짓말이 된다.
 */

/** Shipment 스키마의 status enum (shipment.model.js 와 일치해야 한다) */
export const SHIPMENT_STATUSES = [
  "pending",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "delayed",
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

/**
 * 정렬 가능한 컬럼.
 *
 * sortBy 는 서버가 받은 값을 그대로 mongo sort 에 넘기므로, 화면에서 의미가
 * 분명한 날짜 필드만 연다. delayRiskScore 로 정렬하고 싶어질 수 있는데 그건
 * 저장된 스냅샷이라 시간이 지나면 낡은 값이다 (shipment.model.js 주석 참고).
 *
 * createdAt(등록일)은 넣지 않는다. 서버 기본 정렬이긴 하지만 목록에 그 컬럼이
 * 없어서, 한 번 다른 컬럼으로 정렬하면 되돌아올 방법이 사라진다. 컬럼을
 * 추가하는 대신 기본 정렬을 화면에 있는 집하일로 맞췄다.
 */
export const SORTABLE_FIELDS = ["shippedAt", "estimatedDelivery"] as const

export type SortableField = (typeof SORTABLE_FIELDS)[number]

export type SortOrder = "asc" | "desc"

/** 목록 응답 한 건. 지연 리스크 목록과 같은 문서라 그 타입을 늘려 쓴다. */
export interface ShipmentListItem extends RiskShipment {
  /**
   * 약속 기일. required 필드라 항상 채워져 있다.
   * (estimatedArrivalAt 은 shippedAt + transportMode 가 있을 때만 pre-save 훅이
   *  채우는 파생값이라 비어 있을 수 있다)
   */
  estimatedDelivery: string
  createdAt: string
}

export interface ShipmentListParams {
  /** 빈 문자열이면 필터를 걸지 않는다 */
  status: ShipmentStatus | ""
  transportMode: TransportMode | ""
  riskLevel: RiskLevel | ""
  sortBy: SortableField
  sortOrder: SortOrder
  page: number
  limit: number
}

export interface ShipmentListResponse {
  data: ShipmentListItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export function useShipmentList(params: ShipmentListParams) {
  // ⚠️ 객체를 그대로 의존성에 넣으면 매 렌더 새 참조라 fetcher 가 계속 새로
  //    만들어지고, useAsyncResource 의 effect 가 무한히 재조회한다.
  //    원시값으로 풀어서 넘긴다.
  const { status, transportMode, riskLevel, sortBy, sortOrder, page, limit } = params

  const fetcher = useCallback(() => {
    const query = new URLSearchParams()
    if (status) query.set("status", status)
    if (transportMode) query.set("transportMode", transportMode)
    if (riskLevel) query.set("riskLevel", riskLevel)
    query.set("sortBy", sortBy)
    query.set("sortOrder", sortOrder)
    query.set("page", String(page))
    query.set("limit", String(limit))

    return request<ShipmentListResponse>(`/api/shipments?${query.toString()}`)
  }, [status, transportMode, riskLevel, sortBy, sortOrder, page, limit])

  return useAsyncResource(fetcher, "화물 목록을 불러오지 못했습니다.")
}
