"use client"

import { useCallback } from "react"

import { request, useAsyncResource } from "./use-async-resource"

/**
 * 대시보드 KPI 카드 / 트렌드 차트용 훅.
 *
 * 서버가 이미 계산해 내려준 값을 그대로 쓴다. 화면에서 다시 계산하면 같은
 * 수치를 두 군데서 정의하게 되고, 한쪽만 고쳤을 때 카드와 차트가 어긋난다.
 */

/** 이전 구간과 비교한 증감률(%). 비교 대상이 없으면 null 이라 배지를 감춰야 한다. */
export interface PeriodComparison {
  current: number
  previous: number
  changeRate: number | null
}

export interface OnTimeSummary {
  /** 0~100. 판정 가능한 완료 건이 없으면 null */
  rate: number | null
  delivered: number
  onTimeCount: number
  lateCount: number
  previousRate: number | null
  /** 비율의 변화는 상대 증감률이 아니라 퍼센트포인트 차이다 */
  changePoint: number | null
}

export interface DashboardSummary {
  data: {
    windowDays: number
    processed: PeriodComparison
    active: PeriodComparison
    onTime: OnTimeSummary
  }
  updatedAt: string
  meta: {
    totalShipments: number
    windowStart: string
    previousWindowStart: string
    /** 완료 시각을 무엇으로 판단했는지 — history 가 정확, updatedAt 은 근사치 */
    completedAtSource: {
      history: number
      updatedAt: number
      unresolved: number
    }
    completedAtNote: string
    activePreviousNote: string
    note: string
  }
}

export type TrendRange = "7d" | "30d" | "90d"

export interface TrendPoint {
  /** 한국 시간 기준 YYYY-MM-DD */
  date: string
  /** 그날 새로 등록된 화물 */
  created: number
  /** 그날 배송 완료된 화물 */
  completed: number
}

export interface ShipmentTrend {
  data: {
    range: TrendRange
    days: number
    timezone: string
    from: string | null
    to: string | null
    points: TrendPoint[]
    totals: { created: number; completed: number }
  }
  updatedAt: string
}

/** 상단 KPI 카드 3개(처리 건수 / 온타임 배송률 / 활성 배송 건수)용 집계 */
export function useDashboardSummary() {
  const fetcher = useCallback(
    () => request<DashboardSummary>("/api/shipments/dashboard-summary"),
    []
  )
  return useAsyncResource(fetcher, "대시보드 집계를 불러오지 못했습니다.")
}

/** 일자별 신규 집하 / 배송 완료 추이 */
export function useShipmentTrend(range: TrendRange) {
  const fetcher = useCallback(
    () => request<ShipmentTrend>(`/api/shipments/trend?range=${range}`),
    [range]
  )
  return useAsyncResource(fetcher, "화물 추이를 불러오지 못했습니다.")
}
