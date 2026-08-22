"use client"

import { useMessages } from "next-intl"
import { Activity } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCountUp } from "@/hooks/use-count-up"
import type { PublicSummary } from "./use-public-summary"

/**
 * 히어로 운영 현황 패널
 *
 * 예전 이 자리에는 템플릿 관리자 화면 스크린샷이 박혀 있었다. 정적 이미지 대신
 * 실제 API(/api/shipments/public-summary)를 읽는 컴포넌트를 둔다. 화면에 보이는
 * 숫자가 실제로 동작하는 시스템에서 나온다는 것 자체가 이 회사가 파는 것이다.
 *
 * 조판은 계기판이 아니라 시간표에 가깝게 잡았다 — 격자 구획선, 좌측 정렬 라벨,
 * 고정폭 숫자. 색은 등급 표시 점에만 쓴다.
 */

type Tone = "normal" | "atRisk" | "delayed"

const TONE_DOT: Record<Tone, string> = {
  normal: "bg-emerald-500",
  atRisk: "bg-amber-500",
  delayed: "bg-red-500",
}

function Metric({
  label,
  value,
  tone,
  unit,
}: {
  label: string
  value: number | null
  tone?: Tone
  unit: string
}) {
  const ref = useCountUp(value)

  return (
    <div className="border-r border-b p-4 last:border-r-0 sm:p-5">
      <div className="flex items-center gap-1.5">
        {tone && (
          <span
            className={cn("size-1.5 rounded-full", TONE_DOT[tone])}
            aria-hidden
          />
        )}
        <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-1">
        {/*
          카운트업 중에는 span 의 textContent 를 직접 바꾼다.
          초기값 0 은 애니메이션이 시작되기 전 한 프레임 동안만 보인다.
        */}
        <span ref={ref} className="tabular-figures font-poppins text-2xl font-semibold sm:text-3xl">
          0
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </p>
    </div>
  )
}

interface HeroOpsPanelProps {
  data: PublicSummary | null
  isLoading: boolean
}

/**
 * 데이터를 직접 받아오지 않고 props 로 받는다.
 *
 * 예전에는 여기서 usePublicSummary 를 호출하고 isError 면 null 을 돌려줬는데,
 * 그러면 패널만 사라지고 감싸고 있는 섹션의 상하 패딩(약 97px)은 그대로 남아
 * 첫 화면 근처에 빈 흰 띠가 생겼다. 조회 실패 여부를 아는 쪽이 섹션 전체를
 * 접어야 해서 호출을 OpsStatusSection 으로 올렸다.
 */
export function HeroOpsPanel({ data, isLoading }: HeroOpsPanelProps) {
  const messages = useMessages() as unknown as Record<string, Record<string, string>>
  const t = messages.heroPanel
  const risk = messages.riskLevels

  return (
    <div className="rounded-lg border bg-card">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{t.title}</span>
        </div>
        {!isLoading && data && (
          <span className="text-[11px] tracking-wide text-muted-foreground">
            {t.inTransitLabel} {data.inTransit}
            {t.unit}
          </span>
        )}
      </div>

      {/* 수치 격자 */}
      <div
        className={cn(
          "grid grid-cols-2 border-b sm:grid-cols-4",
          isLoading && "animate-pulse"
        )}
        aria-busy={isLoading}
      >
        <Metric
          label={risk.normal}
          value={data?.normal ?? null}
          tone="normal"
          unit={t.unit}
        />
        <Metric
          label={risk.atRisk}
          value={data?.atRisk ?? null}
          tone="atRisk"
          unit={t.unit}
        />
        <Metric
          label={risk.delayed}
          value={data?.delayed ?? null}
          tone="delayed"
          unit={t.unit}
        />
        <Metric
          label={t.onTimeRate}
          value={data?.onTimeRate ?? null}
          unit="%"
        />
      </div>

      {/* 주석 — 합성 데이터를 실적처럼 보이게 두지 않는다 */}
      <p className="px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground sm:px-5">
        {data?.dataSource === "demo" || data?.dataSource === "mixed"
          ? t.demoNote
          : t.liveNote}
      </p>
    </div>
  )
}
