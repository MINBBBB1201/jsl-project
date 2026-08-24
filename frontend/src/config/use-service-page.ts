"use client"

import { useMessages } from "next-intl"
import type { StaticImageData } from "next/image"
import { PlaneTakeoff, Ship, TrainFront, Truck, Zap, type LucideIcon } from "lucide-react"

import airPhoto from "@/assets/transport/air.jpg"
import expressPhoto from "@/assets/transport/express.jpg"
import railPhoto from "@/assets/transport/rail.jpg"
import seaPhoto from "@/assets/transport/sea.jpg"
import truckPhoto from "@/assets/transport/truck.jpg"
import containerYard from "@/assets/landing/container-yard.jpg"
import warehouseOps from "@/assets/landing/warehouse-ops.jpg"
import type { ServiceMode } from "@/config/service-modes"

/**
 * 운송모드 상세 페이지(/services/{mode}) 콘텐츠 조립기
 *
 * use-content.ts 와 같은 방식이다 — 문구는 messages/{locale}.json 에서, 아이콘과
 * 사진처럼 언어와 무관한 것은 여기서 붙인다. 랜딩 전체를 조립하는 use-content 와
 * 나눠 둔 이유는 상세 페이지가 랜딩 콘텐츠를 하나도 쓰지 않기 때문이다. 한 훅에
 * 넣으면 상세 페이지를 열 때마다 쓰지 않는 랜딩 열두 섹션 분량이 함께 만들어진다.
 */

const MODE_ICONS: Record<ServiceMode, LucideIcon> = {
  air: PlaneTakeoff,
  sea: Ship,
  truck: Truck,
  rail: TrainFront,
  express: Zap,
}

/**
 * 단계별 사진
 *
 * 큐레이션된 사진이 여덟 장뿐이라 SEA 8단계에 한 장씩 새로 붙일 수는 없다.
 * 대신 각 단계가 실제로 벌어지는 장소에 맞춰 가진 사진을 배치했다 —
 * SEA 는 창고 → 트럭 → 부두 → 항공으로 이어져 화물이 실제로 지나는 순서와 맞고,
 * RAIL 은 Route C(Sea & Rail)에서만 바다 사진으로 바뀐다.
 *
 * 사진이 연달아 같아지는 구간이 있는데(예: TRUCK 1~3단계) 의도한 것이다.
 * 바뀌는 정보는 사진이 아니라 그 위에 얹히는 단계 판(StepPlate)이 맡는다.
 *
 * ⚠️ 길이가 messages 의 steps 개수와 반드시 같아야 한다. 아래 조립부에서
 *    개수가 어긋나면 곧바로 던진다 — 사진이 밀려 엉뚱한 단계에 붙는 것보다
 *    빌드가 깨지는 편이 낫다.
 */
const STEP_PHOTOS: Record<ServiceMode, StaticImageData[]> = {
  air: [airPhoto, airPhoto, warehouseOps],
  sea: [
    warehouseOps, // 상해 CFS 입고
    truckPhoto, // 상차 · 출하준비
    truckPhoto, // 상해 CFS 출하
    truckPhoto, // 위해 도착
    containerYard, // CY 반입
    seaPhoto, // Ferry 출항
    seaPhoto, // 인천 · 평택 도착
    airPhoto, // 공항창고 입고
  ],
  truck: [truckPhoto, truckPhoto, truckPhoto, warehouseOps],
  rail: [railPhoto, railPhoto, railPhoto, seaPhoto],
  express: [expressPhoto, airPhoto, expressPhoto],
}

/** 히어로 배경 — 모드 대표 사진 */
const HERO_PHOTOS: Record<ServiceMode, StaticImageData> = {
  air: airPhoto,
  sea: seaPhoto,
  truck: truckPhoto,
  rail: railPhoto,
  express: expressPhoto,
}

interface RawStep {
  title: string
  time?: string
  body?: string
  items?: string[]
  note?: string
}

interface RawMode {
  eyebrow: string
  stats: { value: string; label: string }[]
  steps: RawStep[]
  capabilitiesTitle?: string
  capabilities?: string[]
  stepsHeading?: string
  stepsLead?: string
  leadTimes?: { title: string; columns: string[]; rows: string[][] }
}

export function useServicePage(mode: ServiceMode) {
  const messages = useMessages() as unknown as Record<string, never>
  const m = messages as unknown as {
    services: { modes: Record<string, { title: string; summary: string }> }
    servicePages: {
      backLabel: string
      stepsHeading: string
      cta: { title: string; body: string; primary: string; secondary: string }
      modes: Record<string, RawMode>
    }
  }

  const code = mode.toUpperCase()
  const page = m.servicePages.modes[code]
  const base = m.services.modes[code]
  const photos = STEP_PHOTOS[mode]

  if (page.steps.length !== photos.length) {
    throw new Error(
      `[use-service-page] ${mode}: 단계 ${page.steps.length}개에 사진 ${photos.length}장 — ` +
        "STEP_PHOTOS 를 messages 의 steps 개수와 맞출 것"
    )
  }

  return {
    code,
    icon: MODE_ICONS[mode],
    heroPhoto: HERO_PHOTOS[mode],
    eyebrow: page.eyebrow,
    /*
      제목과 리드는 랜딩 아코디언과 같은 문자열을 쓴다. 상세 페이지용 문구를
      따로 두면 같은 서비스를 두 가지로 소개하게 되고 번역도 두 벌이 된다.
    */
    title: base.title,
    lead: base.summary,
    stats: page.stats,
    capabilitiesTitle: page.capabilitiesTitle,
    capabilities: page.capabilities,
    /* SEA 만 "SEA-AIR 8단계 프로세스" 처럼 고유 제목을 갖는다 */
    stepsHeading: page.stepsHeading ?? m.servicePages.stepsHeading,
    stepsLead: page.stepsLead,
    steps: page.steps.map((step, index) => ({ ...step, photo: photos[index] })),
    leadTimes: page.leadTimes,
    backLabel: m.servicePages.backLabel,
    cta: m.servicePages.cta,
  }
}
