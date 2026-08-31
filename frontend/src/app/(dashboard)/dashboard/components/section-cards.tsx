"use client"

import * as React from "react"
import { Package, RotateCcw, TrendingDown, TrendingUp, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DelayRiskCard } from "./delay-risk-card"
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
    <Badge variant="outline">
      <Icon />
      {isUp ? "+" : ""}
      {value}
      {unit}
    </Badge>
  )
}

/**
 * 카드 한 장. 로딩·에러 표시는 DelayRiskCard 와 같은 모양으로 맞춘다
 * (스켈레톤 → 값, 에러면 "—" + 재시도 버튼 + 본문에 사유).
 */
function StatCard({
  description,
  value,
  badge,
  footerTitle,
  footerIcon,
  footerNote,
  isLoading,
  error,
  reload,
}: {
  description: string
  value: React.ReactNode
  badge?: React.ReactNode
  footerTitle: React.ReactNode
  footerIcon: React.ReactNode
  footerNote: string
  isLoading: boolean
  error: string | null
  reload: () => void
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{description}</CardDescription>

        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : error ? (
            <span className="text-muted-foreground text-lg font-normal">—</span>
          ) : (
            value
          )}
        </CardTitle>

        {!isLoading && !error && badge ? <CardAction>{badge}</CardAction> : null}

        {error && (
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={reload}
              className="cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              재시도
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {error ? (
          <div className="text-destructive line-clamp-2">{error}</div>
        ) : isLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <>
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footerTitle}
              {footerIcon}
            </div>
            <div className="text-muted-foreground">{footerNote}</div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

const formatCount = (value: number) => value.toLocaleString("ko-KR")

export function SectionCards() {
  const { data, isLoading, error, reload } = useDashboardSummary()

  const summary = data?.data
  const onTime = summary?.onTime

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        description="처리 화물 건수"
        value={summary ? formatCount(summary.processed.current) : null}
        badge={
          <ChangeBadge value={summary?.processed.changeRate ?? null} unit="%" />
        }
        footerTitle={
          summary?.processed.changeRate === null
            ? "이전 30일 비교 데이터 없음"
            : `이전 30일 ${formatCount(summary?.processed.previous ?? 0)}건`
        }
        footerIcon={<Package className="size-4" />}
        footerNote="최근 30일 누적 화물 처리 건수"
        isLoading={isLoading}
        error={error}
        reload={reload}
      />

      <StatCard
        description="온타임 배송률"
        // 완료 건이 없으면 비율을 만들지 않는다 (0으로 나누지 않는다 — 서버가 null 로 내려준다)
        value={onTime?.rate === null ? "—" : `${onTime?.rate}%`}
        badge={<ChangeBadge value={onTime?.changePoint ?? null} unit="%p" />}
        footerTitle={
          onTime && onTime.delivered > 0
            ? `정시 ${formatCount(onTime.onTimeCount)} · 지연 ${formatCount(onTime.lateCount)}`
            : "최근 30일 완료 건 없음"
        }
        footerIcon={<TrendingUp className="size-4" />}
        footerNote={
          onTime && onTime.delivered > 0
            ? `최근 30일 완료 ${formatCount(onTime.delivered)}건 · 약속 기일 내 완료 비율`
            : "약속 기일 내 완료된 배송 비율"
        }
        isLoading={isLoading}
        error={error}
        reload={reload}
      />

      <StatCard
        description="활성 배송 건수"
        value={summary ? formatCount(summary.active.current) : null}
        badge={
          <ChangeBadge value={summary?.active.changeRate ?? null} unit="%" />
        }
        footerTitle="현재 운송 중"
        footerIcon={<Truck className="size-4" />}
        footerNote="집하 완료 후 배송 진행 중인 건수 (완료·예외 제외)"
        isLoading={isLoading}
        error={error}
        reload={reload}
      />

      <DelayRiskCard />
    </div>
  )
}
