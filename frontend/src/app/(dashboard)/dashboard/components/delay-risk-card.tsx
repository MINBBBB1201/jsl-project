"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

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
import { useDelaySummary } from "../use-delay-summary"

/**
 * 지연 예상 건수 카드.
 * GET /api/shipments/delay-summary 의 "지연위험 + 지연" 합계를 보여준다.
 */
export function DelayRiskCard() {
  const { data, isLoading, error, reload } = useDelaySummary()

  const atRiskTotal = data ? data.지연위험 + data.지연 : null

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>지연 예상 건수</CardDescription>

        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : error ? (
            <span className="text-muted-foreground text-lg font-normal">—</span>
          ) : (
            atRiskTotal
          )}
        </CardTitle>

        {!isLoading && !error && data && (
          <CardAction>
            <Badge variant="outline">
              <AlertTriangle />
              지연 {data.지연}
            </Badge>
          </CardAction>
        )}

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
              지연위험 {data?.지연위험} · 지연 {data?.지연}
              <AlertTriangle className="size-4" />
            </div>
            <div className="text-muted-foreground">
              진행 중 {data?.total}건 기준 · 규칙기반 v1
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
