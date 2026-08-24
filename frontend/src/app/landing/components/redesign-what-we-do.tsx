"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { PlaneTakeoff, Ship, Truck, type LucideIcon } from "lucide-react"
import type { StaticImageData } from "next/image"

import { useContent } from "@/config/use-content"
import { TRANSPORT_PHOTOS } from "./transport-photos"
import { useRevealMotion } from "@/lib/landing-motion"

/**
 * What We Do — 3열 사진 카드 그리드
 *
 * ── 카드 구조 (1단계에서 확정, 손대지 않음) ─────────────────────────────
 * 카드 한 장은 겹쳐 쌓은 네 겹이다.
 *   1) 사진이 칸을 꽉 채운다 (200px 높이)
 *   2) 아래에서 위로 어두워지는 그라디언트 스크림 — 사진이 밝아도 글자가 읽힌다
 *   3) 좌하단 제목 + 설명 한 줄
 *   4) 우상단 흰 원형 아이콘 배지. 카드 모서리에 살짝 걸치게 빼 둔다
 *
 * 배지가 모서리 밖으로 나가야 해서 바깥 li 에는 overflow-hidden 을 걸지
 * 않는다. 사진의 둥근 모서리는 안쪽 상자가 따로 자른다 — 한 요소에 둘 다
 * 맡기면 배지가 잘린다.
 *
 * ── 색 ──────────────────────────────────────────────────────────────────
 * 섹션 배경은 bg-muted/40 — 요금·인증 섹션과 같은 농도의 옅은 틴트다. 흰
 * 배경과 다크 띠 사이에서 한 단 낮은 밝기를 만들어 카드가 떠 보인다.
 * 스크림과 카드 안 보조 글자는 다크 띠 전용 한 쌍(--brand-navy-deep /
 * --brand-slate)을 써서 히어로·Why JSL 과 어두운 톤을 맞췄다.
 * neutral-* 회색조는 1단계 placeholder 였고 전부 걷어냈다.
 *
 * ── 사진 ────────────────────────────────────────────────────────────────
 * 세 장 모두 서로 다른 사진이고 히어로·Why JSL 과도 겹치지 않는다.
 * 1단계에서는 회색조라 중복이 눈에 띄지 않았지만 컬러로 바뀌면 바로 보인다.
 */

interface CardAsset {
  photo: StaticImageData
  icon: LucideIcon
}

/** 사진·아이콘은 언어와 무관해서 컴포넌트가 들고 있다 (문구만 messages 에서) */
const CARD_ASSETS: CardAsset[] = [
  { photo: TRANSPORT_PHOTOS.AIR, icon: PlaneTakeoff },
  { photo: TRANSPORT_PHOTOS.SEA, icon: Ship },
  { photo: TRANSPORT_PHOTOS.TRUCK, icon: Truck },
]

export function RedesignWhatWeDo() {
  const { redesign } = useContent()
  const { whatWeDo } = redesign
  const { reveal, parent, up } = useRevealMotion()

  return (
    <section id="what-we-do" className="bg-muted/40 py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={parent} {...reveal} className="max-w-2xl">
          <motion.p
            variants={up}
            className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase"
          >
            {/* 마름모만 브랜드 오렌지 — 라벨 전체를 물들이면 제목보다 눈이 먼저 간다 */}
            <span className="text-brand-orange" aria-hidden="true">◇</span>
            <span className="font-poppins">{whatWeDo.eyebrow}</span>
          </motion.p>
          <motion.h2
            variants={up}
            className="text-foreground mt-4 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {whatWeDo.title}
          </motion.h2>
        </motion.div>

        {/*
          카드는 머리말과 별도의 리빌 컨테이너다. 하나로 묶으면 제목이 화면에
          들어오는 순간 카드까지 순번이 시작돼, 카드가 아직 화면 밖인데 이미
          애니메이션이 끝나 있다.
        */}
        <motion.ul
          variants={parent}
          {...reveal}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {whatWeDo.cards.map((card, i) => {
            const asset = CARD_ASSETS[i]
            return (
              <motion.li key={card.title} variants={up} className="relative">
                {/* 사진 + 스크림 + 글자 — 둥근 모서리는 여기서만 자른다 */}
                <div className="relative h-[200px] overflow-hidden rounded-xl">
                  <Image
                    src={asset.photo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <div
                    className="from-brand-navy-deep/90 via-brand-navy-deep/35 absolute inset-0 bg-gradient-to-t to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-sm font-bold text-white">{card.title}</p>
                    <p className="text-brand-slate mt-1 text-[11px]">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* 모서리에 걸치는 원형 배지 */}
                <span className="bg-card ring-border absolute -top-3 -right-3 flex size-12 items-center justify-center rounded-full shadow-sm ring-1">
                  <asset.icon className="text-primary size-5" aria-hidden="true" />
                </span>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
