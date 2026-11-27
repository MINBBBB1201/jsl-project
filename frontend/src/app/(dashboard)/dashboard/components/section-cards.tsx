"use client"

import * as React from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DelayRiskCard } from "./delay-risk-card"
import { KpiCell, KpiStrip } from "./kpi-cell"
import { useDashboardSummary } from "../use-dashboard-summary"

/**
 * 대시보드 상단 KPI 카드.
 *
 * 앞의 3개는 GET /api/shipments/dashboard-summary 하나로 채운다. 카드마다 따로
 * 부르면 같은 화면에 서로 다른 시각의 스냅샷이 섞인다.
 * 마지막 지연 예상 건수는 /delay-summary 를 쓰는 별도 카드다.
 */

/**
 * 이전 구간 대비 증감 배지.
 *
 * ⚠️ 값이 null 이면 아무것도 렌더하지 않는다. 비교할 이전 구간 데이터가 없다는
 *    뜻이라, 여기서 0% 나 임의의 숫자를 채우면 실적처럼 읽힌다. 빈 자리가 낫다.
 *
 * unit 이 "%p" 인 것은 비율(온타임 배송률)의 변화다. 96.4% → 98.0% 를 "+1.7%"
 * 로 적으면 98.0 인지 96.4 의 1.7% 증가인지 읽는 사람이 구분할 수 없다.
 */
function ChangeBadge({
  value,
  unit,
}: {
  value: number | null
  unit: "%" | "%p"
}) {
  if (value === null) return null

  const isUp = value >= 0
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    <Badge variant="outline" className="rounded-sm font-normal tabular-nums">
      <Icon />
      {isUp ? "+" : ""}
      {value}
      {unit}
    </Badge>
  )
}

const formatCount = (value: number) => value.toLocaleString("ko-KR")

/**
 * 지표를 계산한 시각. 서버 응답의 updatedAt 을 한국 시간으로 적는다.
 * 값이 언제 것인지 모르면 숫자를 믿고 판단하기 어렵다.
 */
const stampFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function SummaryStamp({ updatedAt }: { updatedAt?: string }) {
  const date = updatedAt ? new Date(updatedAt) : null
  const valid = date && !Number.isNaN(date.getTime())

  return (
    <p className="text-muted-foreground mb-2 flex justify-between gap-2 text-xs">
      <span>최근 30일 기준</span>
      {valid ? (
        <span className="tabular-nums">
          집계 <time dateTime={updatedAt}>{stampFormatter.format(date)}</time> KST
        </span>
      ) : null}
    </p>
  )
}

export function SectionCards() {
  const { data, isLoading, error, reload } = useDashboardSummary()

  const summary = data?.data
  const onTime = summary?.onTime

  return (
    <section aria-label="주요 지표">
      <SummaryStamp updatedAt={data?.updatedAt} />
      <KpiStrip>
        <KpiCell
          label="처리 화물 건수"
          value={summary ? formatCount(summary.processed.current) : null}
          badge={
            <ChangeBadge value={summary?.processed.changeRate ?? null} unit="%" />
          }
          footerTitle={
            summary?.processed.changeRate === null
              ? "이전 30일 비교 데이터 없음"
              : `이전 30일 ${formatCount(summary?.processed.previous ?? 0)}건`
          }
          footerNote="최근 30일 누적 화물 처리 건수"
          isLoading={isLoading}
          error={error}
          reload={reload}
        />

        <KpiCell
          label="온타임 배송률"
          // 완료 건이 없으면 비율을 만들지 않는다 (0으로 나누지 않는다 — 서버가 null 로 내려준다)
          value={onTime?.rate === null ? "—" : `${onTime?.rate}%`}
          badge={<ChangeBadge value={onTime?.changePoint ?? null} unit="%p" />}
          footerTitle={
            onTime && onTime.delivered > 0
              ? `정시 ${formatCount(onTime.onTimeCount)} · 지연 ${formatCount(onTime.lateCount)}`
              : "최근 30일 완료 건 없음"
          }
          footerNote={
            onTime && onTime.delivered > 0
              ? `최근 30일 완료 ${formatCount(onTime.delivered)}건 · 약속 기일 내 완료 비율`
              : "약속 기일 내 완료된 배송 비율"
          }
          isLoading={isLoading}
          error={error}
          reload={reload}
        />

        <KpiCell
          label="활성 배송 건수"
          value={summary ? formatCount(summary.active.current) : null}
          badge={
            <ChangeBadge value={summary?.active.changeRate ?? null} unit="%" />
          }
          footerTitle="현재 운송 중"
          footerNote="집하 완료 후 배송 진행 중인 건수 (완료·예외 제외)"
          isLoading={isLoading}
          error={error}
          reload={reload}
        />

        <DelayRiskCard />
      </KpiStrip>
    </section>
  )
}
