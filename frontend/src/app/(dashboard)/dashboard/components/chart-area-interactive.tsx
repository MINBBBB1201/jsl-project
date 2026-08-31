"use client"

import * as React from "react"
import { RotateCcw } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useShipmentTrend, type TrendRange } from "../use-dashboard-summary"

export const description = "일자별 신규 집하 / 배송 완료 추이"

/**
 * 화물 처리 추이 차트.
 *
 * GET /api/shipments/trend 이 날짜별 건수를 한국 시간 기준으로 잘라서 내려준다.
 * 값이 없는 날도 0 으로 채워 오므로 화면에서 빈 날짜를 메울 필요가 없다.
 * (빠진 날을 그대로 두면 차트가 없는 구간을 직선으로 이어 그린다)
 */

const chartConfig = {
  created: {
    label: "신규 집하",
    color: "var(--chart-1)",
  },
  completed: {
    label: "배송 완료",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const RANGE_LABELS: Record<TrendRange, string> = {
  "90d": "최근 3개월",
  "30d": "최근 30일",
  "7d": "최근 7일",
}

const isTrendRange = (value: string): value is TrendRange =>
  value === "7d" || value === "30d" || value === "90d"

/**
 * 서버가 주는 날짜는 한국 시간 기준으로 이미 잘린 "YYYY-MM-DD" 문자열이다.
 * new Date(...) 로 되돌리면 UTC 자정으로 파싱돼, 음수 시간대에서 보는 사람에게는
 * 하루 앞 날짜가 찍힌다. 문자열을 그대로 쪼개서 쓴다.
 */
const splitDayKey = (value: string) => {
  const [year, month, day] = value.split("-")
  return { year, month: Number(month), day: Number(day) }
}
const formatAxisDay = (value: string) => {
  const { month, day } = splitDayKey(value)
  return `${month}/${day}`
}
const formatTooltipDay = (value: string) => {
  const { month, day } = splitDayKey(value)
  return `${month}월 ${day}일`
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<TrendRange>("90d")

  // 모바일로 전환되면 기본 범위를 7일로 좁힙니다.
  // effect + setState 대신 렌더 중 조정하는 React 공식 패턴을 사용합니다.
  // useIsMobile은 항상 false에서 시작하므로 prev 초기값을 false로 두면
  // 기존 effect가 마운트 시 동작하던 것과 동일하게 false→true 전환에서 한 번만 반영됩니다.
  // (전환 시점에만 덮어쓰므로 사용자가 모바일에서 90d를 고른 선택은 유지됩니다.)
  const [prevIsMobile, setPrevIsMobile] = React.useState(false)
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)
    if (isMobile) {
      setTimeRange("7d")
    }
  }

  const { data, isLoading, error, reload } = useShipmentTrend(timeRange)
  const trend = data?.data

  // ToggleGroup 은 선택을 해제할 때 "" 를 넘긴다. 그대로 받으면 범위가 비어
  // 차트가 사라지므로, 아는 값일 때만 반영한다.
  const handleRangeChange = (value: string) => {
    if (isTrendRange(value)) setTimeRange(value)
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>화물 처리 추이</CardTitle>
        <CardDescription>
          {trend ? (
            <>
              <span className="hidden @[540px]/card:block">
                {RANGE_LABELS[timeRange]} 신규 집하 {trend.totals.created}건 · 배송 완료{" "}
                {trend.totals.completed}건
              </span>
              <span className="@[540px]/card:hidden">
                집하 {trend.totals.created} · 완료 {trend.totals.completed}
              </span>
            </>
          ) : (
            <>
              <span className="hidden @[540px]/card:block">
                {RANGE_LABELS[timeRange]} 신규 집하 · 배송 완료 건수
              </span>
              <span className="@[540px]/card:hidden">
                {RANGE_LABELS[timeRange]}
              </span>
            </>
          )}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          {error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reload}
              className="cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              재시도
            </Button>
          )}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={handleRangeChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">최근 3개월</ToggleGroupItem>
            <ToggleGroupItem value="30d">최근 30일</ToggleGroupItem>
            <ToggleGroupItem value="7d">최근 7일</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={handleRangeChange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="기간 선택"
            >
              <SelectValue placeholder="최근 3개월" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                최근 3개월
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                최근 30일
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                최근 7일
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div className="text-destructive flex h-[250px] items-center justify-center text-center text-sm">
            {error}
          </div>
        ) : isLoading || !trend ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            {/*
              두 계열은 서로 다른 사건이라 쌓지 않는다(stackId 없음). 쌓으면
              "집하 4 + 완료 2 = 6" 처럼 읽히는 높이가 나오는데 그런 수치는 없다.
            */}
            <AreaChart data={trend.points}>
              <defs>
                <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-created)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-created)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-completed)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-completed)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatAxisDay}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatTooltipDay(String(value))}
                    indicator="dot"
                  />
                }
              />
              {/*
                type 은 monotone 이다. natural(자연 3차 스플라인)은 점 사이에서
                오버슈트가 나는데, 하루 0~5 건짜리 정수 데이터에서는 그 곡선이
                0 아래로 파고든다 — 건수는 음수가 될 수 없으므로 없는 값을
                그리는 셈이다. monotone 은 주어진 점 밖으로 나가지 않는다.
              */}
              <Area
                dataKey="completed"
                type="monotone"
                fill="url(#fillCompleted)"
                stroke="var(--color-completed)"
              />
              <Area
                dataKey="created"
                type="monotone"
                fill="url(#fillCreated)"
                stroke="var(--color-created)"
              />
              {/* 계열이 둘이라 범례가 없으면 어느 쪽이 집하인지 알 수 없다 */}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
