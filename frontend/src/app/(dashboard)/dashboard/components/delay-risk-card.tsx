"use client"

import { KpiCell } from "./kpi-cell"
import { useDelaySummary } from "../use-delay-summary"

/**
 * 지연 예상 건수 칸.
 * GET /api/shipments/delay-summary 의 "지연위험 + 지연" 합계를 보여준다.
 * 지표 패널(KpiPanel)의 마지막 칸이다.
 */
export function DelayRiskCard() {
  const { data, isLoading, error, reload } = useDelaySummary()

  const atRiskTotal = data ? data.지연위험 + data.지연 : null

  return (
    <KpiCell
      label="지연 예상 건수"
      value={atRiskTotal}
      unit="건"
      // 지연 예상이 있을 때만 주황 점과 주황 숫자로 띄운다. 0 이면 다른 칸과 같다.
      alert={Boolean(atRiskTotal)}
      delta={data ? `지연 ${data.지연}` : null}
      footerTitle={`지연위험 ${data?.지연위험 ?? 0} · 지연 ${data?.지연 ?? 0}`}
      footerNote={`진행 중 ${data?.total ?? 0}건 기준 · 규칙기반 v1`}
      isLoading={isLoading}
      error={error}
      reload={reload}
    />
  )
}
