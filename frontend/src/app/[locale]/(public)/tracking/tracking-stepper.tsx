"use client"

import { useTranslations } from "next-intl"
import { motion, type Variants } from "framer-motion"
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
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { DATE_FALLBACK, formatDate } from "./format-date"

/**
 * 화물 진행 단계 표시
 *
 * 집하 → 운송중 → 통관 → 배송완료 4단계를 세로 타임라인으로 보여 준다.
 * (shadcn-timeline 스타일: 왼쪽에 노드+연결선, 오른쪽에 라벨·상태·날짜)
 *
 * ⚠️ 백엔드 status 에는 통관 전용 값이 없다(pending / in_transit /
 *    out_for_delivery / delivered / exception / delayed). 그래서 도착지에서
 *    배송 단계로 넘어간 out_for_delivery 를 "통관 완료 후 국내 배송" 으로 보고
 *    통관 단계에 매핑한다. 통관 상태를 별도로 관리하게 되면 이 표를 고치면 된다.
 *
 * ⚠️ 화면 크기와 상관없이 항상 세로 한 가지 레이아웃이다. 예전에는 데스크톱에서
 *    가로 스텝퍼로 바뀌었는데, 단계마다 날짜 줄이 붙으면서 가로 배치에서는
 *    글자가 서로 밀려 읽기 어려워졌다.
 *
 * ⚠️ 단계별 개별 타임스탬프는 백엔드에 없다. shipment 가 가진 날짜는 shippedAt 과
 *    estimatedArrivalAt 둘뿐이라 첫 단계(집하)와 마지막 단계(배송완료)에만 날짜가
 *    붙는다. 가운데 두 단계는 상태 텍스트만 나온다 — 없는 날짜를 지어내지 않는다.
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

/** 마운트 애니메이션 — 항목이 아래에서 위로 순차 등장한다 */
const ITEM_OFFSET_Y = 12
const ITEM_STAGGER = 0.08
const ITEM_DURATION = 0.35
/** 큐빅 베지어 네 점. 빠르게 나갔다가 끝에서 길게 감속한다 */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
/** 진행 중인 노드에서 링이 한 바퀴 퍼져 나가는 데 걸리는 시간(초) */
const PULSE_DURATION = 2.4

export function TrackingStepper({
  status,
  riskLevel,
  shippedAt,
  estimatedArrivalAt,
}: {
  status: string
  riskLevel: RiskLevel | null
  shippedAt: string | null
  estimatedArrivalAt: string | null
}) {
  const t = useTranslations("tracking")
  const reduced = usePrefersReducedMotion()

  const currentIndex = STATUS_TO_STEP[status] ?? 0
  const tone = toneOf(status, riskLevel)
  const style = TONE_STYLE[tone]
  const isException = status === "exception"

  /*
    동작 줄이기를 variants 안쪽 값에 녹인다. usePrefersReducedMotion 은
    useSyncExternalStore 라 하이드레이션 첫 렌더에서 서버 스냅샷(false)을
    돌려주는데, 그 한 프레임 사이에 framer-motion 이 트윈을 시작해 버리면
    두 번째 렌더에서 true 가 와도 진행 중인 트윈은 멈추지 않는다.
    거리·시간을 0 으로 두면 이미 시작된 트윈도 다음 렌더에서 최종 상태로 스냅한다.
    (lib/landing-motion.ts 에 같은 이유로 같은 처리가 있다.)
  */
  const list: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduced ? 0 : ITEM_STAGGER },
    },
  }

  const item: Variants = {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : ITEM_OFFSET_Y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : ITEM_DURATION, ease: EASE_OUT },
    },
  }

  return (
    <section aria-label={t("stepsTitle")} className="rounded-lg border p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        {t("stepsTitle")}
      </h3>

      <motion.ol variants={list} initial="hidden" animate="visible">
        {STEP_KEYS.map((key, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const isReached = isDone || isCurrent
          const isLast = index === STEP_KEYS.length - 1
          const Icon = isDone ? Check : STEP_ICONS[key]

          // 날짜가 있는 단계는 첫 번째(집하)와 마지막(배송완료)뿐이다.
          const date = formatDate(
            index === 0 ? shippedAt : isLast ? estimatedArrivalAt : null
          )
          const hasDate = date !== DATE_FALLBACK

          return (
            <motion.li
              key={key}
              variants={item}
              className="flex gap-4"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* 노드 + 연결선 */}
              <div className="flex flex-col items-center">
                <span className="relative flex size-9 shrink-0 items-center justify-center">
                  {/*
                    진행 중인 노드에서 퍼져 나가는 링. 노드와 같은 톤 색으로 시작해
                    투명해지며 사라진다. 동작 줄이기에서는 아예 그리지 않는다 —
                    무한 반복이라 "최종 상태로 스냅" 시킬 곳이 없다.
                  */}
                  {isCurrent && !reduced && (
                    <motion.span
                      aria-hidden
                      className={cn("absolute inset-0 rounded-full", style.line)}
                      animate={{ scale: [1, 1.7], opacity: [0.35, 0] }}
                      transition={{
                        duration: PULSE_DURATION,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-full border transition-colors",
                      isReached
                        ? cn(style.fill, "border-transparent")
                        : "border-dashed bg-muted text-muted-foreground",
                      isCurrent && cn("ring-4", style.ring)
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                </span>
                {/* 마지막 단계 아래로는 이어질 곳이 없다 */}
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "w-0.5 flex-1 rounded-full",
                      isDone ? style.line : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* 라벨 + 상태 + 날짜 */}
              <div className={cn("min-w-0 flex-1 pt-1.5", !isLast && "pb-6")}>
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
                {hasDate && (
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {/*
                      눈으로는 단계 라벨 바로 아래라 날짜만 있어도 읽히지만,
                      스크린리더로는 무슨 날짜인지 알 수 없어 라벨을 붙여 준다.
                    */}
                    <span className="sr-only">
                      {index === 0 ? t("shippedAt") : t("estimatedArrival")}:{" "}
                    </span>
                    {date}
                  </p>
                )}
              </div>
            </motion.li>
          )
        })}
      </motion.ol>

      {/*
        경고 문구는 실제로 늦은 경우(danger)에만 띄운다. 지연"위험"은 카드 상단의
        등급 설명이 이미 "도착일이 임박했다"고 알려 주므로, 여기서 또 쓰면
        아직 늦지 않은 화물을 늦은 것처럼 말하게 된다. 단계 색(주황)으로만 표시한다.
      */}
      {tone === "danger" && (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-red-500/40 p-3 text-sm text-red-700 dark:text-red-400">
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
