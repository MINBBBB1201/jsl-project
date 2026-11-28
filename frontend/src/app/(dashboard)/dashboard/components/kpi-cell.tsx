"use client"

import * as React from "react"
import { Activity, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 대시보드 상단 지표 패널.
 *
 * 랜딩의 "운영 현황" 패널(app/landing/components/hero-ops-panel.tsx)과 같은 짜임을
 * 쓴다: 테두리 한 줄짜리 패널, 머리줄(제목 · 오른쪽에 보조 정보), 세로선으로 나눈
 * 칸, 칸마다 작은 라벨 → 큰 숫자와 작은 단위. 공개 화면에서 본 패널을 로그인 뒤에도
 * 같은 모양으로 만나게 하려는 것이다. 그 컴포넌트를 직접 쓰지 않는 이유는 저쪽이
 * next-intl 번역 메시지에 기대고, 칸마다 재시도·에러 표시가 없기 때문이다.
 *
 * 로딩·에러 처리는 그대로다 (스켈레톤 → 값, 에러면 "—" + 재시도 + 사유).
 */
export function KpiPanel({
  title,
  meta,
  children,
}: {
  title: string
  /** 머리줄 오른쪽 끝의 보조 정보 (집계 시각 등) */
  meta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section aria-label={title} className="bg-card border">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Activity className="text-muted-foreground size-4" aria-hidden />
          <h2 className="text-sm font-medium">{title}</h2>
        </div>
        {meta ? (
          <span className="text-muted-foreground text-[11px] tracking-wide tabular-nums">
            {meta}
          </span>
        ) : null}
      </div>
      {/* gap-px 사이로 바탕(--border)이 비쳐 칸 사이 선이 된다. 줄이 바뀌어도 선이 맞는다 */}
      <div className="bg-border grid gap-px sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  )
}

export function KpiCell({
  label,
  value,
  unit,
  delta,
  alert,
  footerTitle,
  footerNote,
  isLoading,
  error,
  reload,
}: {
  label: string
  value: React.ReactNode
  /** 숫자 뒤에 작게 붙는 단위 */
  unit?: string
  /** 라벨 줄 오른쪽 끝에 작게 붙는 증감·보조 수치. 색은 주지 않는다 */
  delta?: React.ReactNode
  /** 조치가 필요한 값이면 라벨 앞에 주황 점을 찍고 숫자를 주황 글자색으로 쓴다 */
  alert?: boolean
  footerTitle: React.ReactNode
  footerNote: React.ReactNode
  isLoading: boolean
  error: string | null
  reload: () => void
}) {
  return (
    <div className="bg-card flex min-w-0 flex-col p-4 sm:p-5">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {alert ? (
            <span className="bg-brand-orange size-1.5 rounded-full" aria-hidden />
          ) : null}
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
        </div>
        {error ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            className="-my-1.5 h-7 cursor-pointer px-2"
          >
            <RotateCcw className="size-3.5" />
            재시도
          </Button>
        ) : !isLoading && delta ? (
          <span className="text-muted-foreground shrink-0 text-[11px] tracking-wide whitespace-nowrap tabular-nums">
            {delta}
          </span>
        ) : null}
      </div>

      <p className="mt-2 flex min-h-9 items-baseline gap-1">
        {isLoading ? (
          <Skeleton className="h-8 w-20 self-center rounded-none" />
        ) : error ? (
          <span className="text-muted-foreground text-2xl">—</span>
        ) : (
          <>
            <span
              className={cn(
                "font-poppins text-3xl leading-none font-semibold tabular-nums",
                alert && "text-brand-orange-deep"
              )}
            >
              {value}
            </span>
            {unit ? <span className="text-muted-foreground text-xs">{unit}</span> : null}
          </>
        )}
      </p>

      <div className="mt-3 space-y-0.5 text-[13px]">
        {error ? (
          <div className="text-destructive line-clamp-2">{error}</div>
        ) : isLoading ? (
          <Skeleton className="h-4 w-40 rounded-none" />
        ) : (
          <>
            <div className="line-clamp-1 font-medium">{footerTitle}</div>
            <div className="text-muted-foreground text-xs leading-relaxed">{footerNote}</div>
          </>
        )}
      </div>
    </div>
  )
}
