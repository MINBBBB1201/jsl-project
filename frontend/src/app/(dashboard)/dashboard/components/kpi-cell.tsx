"use client"

import * as React from "react"
import { RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 대시보드 상단 지표 띠의 칸 하나.
 *
 * 예전에는 칸마다 둥근 카드(그림자 + 아래에서 위로 옅어지는 그라디언트)였다.
 * shadcn 대시보드 예제 그대로라 템플릿처럼 보여서, 한 장의 띠를 1px 선으로
 * 나누는 모양으로 바꿨다. 칸은 KpiStrip 안에 넣어야 선이 생긴다.
 *
 * 로딩·에러 처리는 그대로다 (스켈레톤 → 값, 에러면 "—" + 재시도 + 사유).
 */
export function KpiStrip({ children }: { children: React.ReactNode }) {
  // gap-px 사이로 바탕(--border)이 비쳐 칸 사이 선이 된다. 줄이 바뀌어도 선이 맞는다.
  return (
    <div className="bg-border grid gap-px overflow-hidden rounded-md border sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  )
}

export function KpiCell({
  label,
  value,
  badge,
  footerTitle,
  footerNote,
  isLoading,
  error,
  reload,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  badge?: React.ReactNode
  footerTitle: React.ReactNode
  footerNote: React.ReactNode
  isLoading: boolean
  error: string | null
  reload: () => void
  valueClassName?: string
}) {
  return (
    <div className="bg-card flex min-w-0 flex-col gap-3 p-5">
      <div className="flex min-h-6 items-start justify-between gap-2">
        <span className="text-muted-foreground text-sm">{label}</span>
        {error ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            className="-my-1 h-7 cursor-pointer px-2"
          >
            <RotateCcw className="size-3.5" />
            재시도
          </Button>
        ) : !isLoading && badge ? (
          badge
        ) : null}
      </div>

      <div className="text-3xl font-semibold tracking-tight tabular-nums">
        {isLoading ? (
          <Skeleton className="h-9 w-20 rounded-sm" />
        ) : error ? (
          <span className="text-muted-foreground text-lg font-normal">—</span>
        ) : (
          <span className={cn(valueClassName)}>{value}</span>
        )}
      </div>

      <div className="space-y-0.5 text-sm">
        {error ? (
          <div className="text-destructive line-clamp-2">{error}</div>
        ) : isLoading ? (
          <Skeleton className="h-4 w-40 rounded-sm" />
        ) : (
          <>
            <div className="line-clamp-1 font-medium">{footerTitle}</div>
            <div className="text-muted-foreground">{footerNote}</div>
          </>
        )}
      </div>
    </div>
  )
}
