/**
 * 운송모드 정의 — backend/src/config/transit-times.js 의 키와 일치해야 한다.
 * 대시보드와 공개 화물추적 페이지가 함께 쓴다.
 */

export type TransportMode =
  | "AIR"
  | "SEA"
  | "SEA_AIR"
  | "TRUCK_DOMESTIC"
  | "TRUCK_CROSSBORDER"
  | "RAIL"
  | "EXPRESS"

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  AIR: "항공",
  SEA: "해상",
  SEA_AIR: "해상-항공",
  TRUCK_DOMESTIC: "육상(국내)",
  TRUCK_CROSSBORDER: "육상(국경)",
  RAIL: "철도",
  EXPRESS: "특송",
}

export type RiskLevel = "정상" | "지연위험" | "지연"

/** 지연 리스크 등급별 배지 스타일 — 대시보드/추적 페이지 공통 */
export const RISK_LEVEL_STYLE: Record<
  RiskLevel,
  { badge: string; description: string }
> = {
  정상: {
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    description: "예상 소요일 대비 정상 범위에서 운송 중입니다.",
  },
  지연위험: {
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
    description: "예상 도착일이 임박했습니다. 지연될 수 있습니다.",
  },
  지연: {
    badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    description: "예상 소요일을 초과했습니다. 담당자에게 문의해 주세요.",
  },
}

export const modeLabel = (mode: string | null | undefined) =>
  (mode && TRANSPORT_MODE_LABELS[mode as TransportMode]) || mode || "—"
