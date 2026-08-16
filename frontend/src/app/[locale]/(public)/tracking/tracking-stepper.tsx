"use client"

import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  Check,
  Clock,
  FileCheck2,
  Flag,
  Package,
  Truck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/transport-modes"

/**
 * 화물 진행 단계 표시
 *
 * 집하 → 운송중 → 통관 → 배송완료 4단계로 보여 준다.
 *
 * ⚠️ 백엔드 status 에는 통관 전용 값이 없다(pending / in_transit /
 *    out_for_delivery / delivered / exception / delayed). 그래서 도착지에서
 *    배송 단계로 넘어간 out_for_delivery 를 "통관 완료 후 국내 배송" 으로 보고
 *    통관 단계에 매핑한다. 통관 상태를 별도로 관리하게 되면 이 표를 고치면 된다.
 */
const STEP_KEYS = ["pickup", "inTransit", "customs", "delivered"] as const
type StepKey = (typeof STEP_KEYS)[number]

/** 아직 도달하지 않은/진행 중인 단계에 쓰는 아이콘. 지난 단계는 체크 표시로 바뀐다. */
const STEP_ICONS: Record<StepKey, LucideIcon> = {
  pickup: Package,
  inTransit: Truck,
  customs: FileCheck2,
  delivered: Flag,
}

const STATUS_TO_STEP: Record<string, number> = {
  pending: 0,
  in_transit: 1,
  delayed: 1,
  exception: 1,
  out_for_delivery: 2,
  delivered: 3,
}

type Tone = "normal" | "warning" | "danger"

/**
 * 단계 색상은 지연 리스크에서 정한다.
 * 등급 배지(RISK_LEVEL_STYLE)와 같은 색 계열을 써서 화면 안에서 신호가 어긋나지 않게 한다.
 */
const toneOf = (status: string, level: RiskLevel | null): Tone => {
  if (status === "exception" || status === "delayed" || level === "지연") return "danger"
  if (level === "지연위험") return "warning"
  return "normal"
}

const TONE_STYLE: Record<Tone, { fill: string; line: string; text: string; ring: string }> = {
  normal: {
    fill: "bg-emerald-500 text-white dark:bg-emerald-600",
    line: "bg-emerald-500 dark:bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
  },
  warning: {
    fill: "bg-amber-500 text-white dark:bg-amber-600",
    line: "bg-amber-500 dark:bg-amber-600",
    text: "text-amber-700 dark:text-amber-400",
    ring: "ring-amber-500/30",
  },
  danger: {
    fill: "bg-red-500 text-white dark:bg-red-600",
    line: "bg-red-500 dark:bg-red-600",
    text: "text-red-700 dark:text-red-400",
    ring: "ring-red-500/30",
  },
}

export function TrackingStepper({
  status,
  riskLevel,
}: {
  status: string
  riskLevel: RiskLevel | null
}) {
  const t = useTranslations("tracking")

  const currentIndex = STATUS_TO_STEP[status] ?? 0
  const tone = toneOf(status, riskLevel)
  const style = TONE_STYLE[tone]
  const isException = status === "exception"

  return (
    <section aria-label={t("stepsTitle")} className="rounded-lg border p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        {t("stepsTitle")}
      </h3>

      <ol className="flex flex-col gap-0 sm:flex-row">
        {STEP_KEYS.map((key, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const isReached = isDone || isCurrent
          const Icon = isDone ? Check : STEP_ICONS[key]

          return (
            <li
              key={key}
              className="flex flex-1 gap-3 sm:flex-col sm:gap-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* 아이콘 + 연결선 */}
              <div className="flex flex-col items-center sm:w-full sm:flex-row">
                {/* 모바일(세로)에서는 왼쪽 열에 선이 세로로 이어진다 */}
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-0.5 flex-1 rounded-full sm:block",
                    index === 0 && "invisible",
                    isReached ? style.line : "bg-border"
                  )}
                />
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isReached
                      ? cn(style.fill, "border-transparent")
                      : "border-dashed bg-muted text-muted-foreground",
                    isCurrent && cn("ring-4", style.ring)
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-0.5 flex-1 rounded-full sm:block",
                    index === STEP_KEYS.length - 1 && "invisible",
                    isDone ? style.line : "bg-border"
                  )}
                />
                {/* 세로 배치용 연결선 */}
                <span
                  aria-hidden
                  className={cn(
                    "w-0.5 flex-1 rounded-full sm:hidden",
                    index === STEP_KEYS.length - 1 && "invisible",
                    isDone ? style.line : "bg-border"
                  )}
                />
              </div>

              {/* 라벨 */}
              <div className="pb-6 sm:pb-0 sm:mt-2 sm:text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isReached ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(`steps.${key}`)}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    isCurrent ? style.text : "text-muted-foreground"
                  )}
                >
                  {isDone ? t("stepDone") : isCurrent ? t("stepCurrent") : t("stepPending")}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      {/*
        경고 문구는 실제로 늦은 경우(danger)에만 띄운다. 지연"위험"은 카드 상단의
        등급 설명이 이미 "도착일이 임박했다"고 알려 주므로, 여기서 또 쓰면
        아직 늦지 않은 화물을 늦은 것처럼 말하게 된다. 단계 색(주황)으로만 표시한다.
      */}
      {tone === "danger" && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-red-500/40 p-3 text-sm text-red-700 sm:mt-4 dark:text-red-400">
          {isException ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {isException ? t("exceptionNote") : t("stepDelayNote")}
        </p>
      )}
    </section>
  )
}
