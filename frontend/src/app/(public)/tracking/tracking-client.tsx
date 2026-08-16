"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Loader2,
  MapPin,
  PackageSearch,
  Search,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RISK_LEVEL_STYLE, modeLabel } from "@/lib/transport-modes"
import { useSampleTrackingNumbers, useTracking } from "./use-tracking"

const formatDate = (value: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function ResultCard({
  shipment,
}: {
  shipment: NonNullable<ReturnType<typeof useTracking>["shipment"]>
}) {
  const { delayRisk: risk } = shipment
  const level = risk.level
  const style = level ? RISK_LEVEL_STYLE[level] : null
  const pct = risk.score === null ? null : Math.round(risk.score * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <PackageSearch className="size-5" aria-hidden />
          <span className="font-mono">{shipment.trackingNumber}</span>
          {level && style && (
            <Badge className={cn("border-0", style.badge)}>{level}</Badge>
          )}
        </CardTitle>
        {style && (
          <p className="text-sm text-muted-foreground">{style.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 구간 */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="font-medium">{shipment.origin ?? "—"}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="font-medium">{shipment.destination ?? "—"}</span>
          <Badge variant="outline" className="ms-auto">
            <Truck className="size-3" aria-hidden />
            {modeLabel(shipment.transportMode)}
          </Badge>
        </div>

        {/* 일정 */}
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              집하일
            </dt>
            <dd className="mt-1 font-medium">{formatDate(shipment.shippedAt)}</dd>
          </div>
          <div className="rounded-lg border p-4">
            <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              예상 도착일
            </dt>
            <dd className="mt-1 font-medium">
              {formatDate(shipment.estimatedArrivalAt)}
            </dd>
          </div>
        </dl>

        {/* 경과율 */}
        {pct !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">경과율</span>
              <span className="font-medium tabular-nums">
                {pct}%
                <span className="ms-2 font-normal text-muted-foreground">
                  ({risk.elapsedDays}일 경과 / 표준 {risk.standardDays}일)
                </span>
              </span>
            </div>
            <Progress value={Math.min(pct, 100)} />
            {risk.standardSource === "estimate" && (
              <p className="text-xs text-muted-foreground">
                표준 소요일은 업계 평균 추정치이며 실제 소요 기간과 다를 수
                있습니다.
              </p>
            )}
          </div>
        )}

        {shipment.currentLocation && (
          <p className="text-sm text-muted-foreground">
            현재 위치: {shipment.currentLocation}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function TrackingClient() {
  const { shipment, isLoading, error, searched, track } = useTracking()
  const samples = useSampleTrackingNumbers(4)
  const [value, setValue] = useState("")

  const submit = (next?: string) => {
    const target = next ?? value
    if (next) setValue(next)
    track(target)
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          화물 추적
        </h1>
        <p className="mt-3 text-muted-foreground">
          운송장번호를 입력하시면 현재 운송 상태와 예상 도착일을 확인하실 수
          있습니다.
        </p>
      </header>

      {/* 조회 폼 */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="운송장번호를 입력하세요"
          aria-label="운송장번호"
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} className="cursor-pointer">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          {isLoading ? "조회 중..." : "조회하기"}
        </Button>
      </form>

      {/*
        TODO: 실데이터 연결 후 이 데모 안내 블록과 useSampleTrackingNumbers 훅을
              삭제하세요. 지금은 DEMO- 합성 데이터뿐이라 안내가 필요합니다.
      */}
      <div
        className={cn(
          "mt-4 rounded-lg border border-dashed p-4",
          samples.length === 0 && "hidden"
        )}
      >
        <p className="text-sm text-muted-foreground">
          현재는 데모용 데이터만 등록되어 있습니다. 아래 번호로 조회해 보세요.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {samples.map((tn) => (
            <button
              key={tn}
              type="button"
              onClick={() => submit(tn)}
              disabled={isLoading}
              className="rounded-full border px-3 py-1 font-mono text-xs transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
            >
              {tn}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 */}
      <div className="mt-8">
        {error ? (
          <Card className="border-destructive/50">
            <CardContent className="flex gap-3 p-5">
              <AlertCircle
                className="mt-0.5 size-5 shrink-0 text-destructive"
                aria-hidden
              />
              <div className="space-y-1">
                <p className="font-medium text-destructive">조회 결과가 없습니다</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : shipment ? (
          <ResultCard shipment={shipment} />
        ) : searched ? null : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            운송장번호를 입력하고 조회하기를 눌러주세요.
          </p>
        )}
      </div>
    </div>
  )
}
