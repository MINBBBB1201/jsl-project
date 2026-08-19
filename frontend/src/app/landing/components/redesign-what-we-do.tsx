"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { PlaneTakeoff, Ship, Truck, type LucideIcon } from "lucide-react"
import type { StaticImageData } from "next/image"

import { TRANSPORT_PHOTOS } from "./transport-photos"
import { useRevealMotion } from "@/lib/landing-motion"

/**
 * What We Do — 3열 사진 카드 그리드 (랜딩 리디자인 1단계)
 *
 * ⚠️ 1단계는 구조와 애니메이션만. 색은 회색조, 카피는 [PLACEHOLDER: …] 다.
 *
 * ── 카드 구조 ───────────────────────────────────────────────────────────
 * 카드 한 장은 겹쳐 쌓은 네 겹이다.
 *   1) 사진이 칸을 꽉 채운다 (200px 높이)
 *   2) 아래에서 위로 어두워지는 그라디언트 스크림 — 사진이 밝아도 글자가 읽힌다
 *   3) 좌하단 제목 + 설명 한 줄
 *   4) 우상단 흰 원형 아이콘 배지. 카드 모서리에 살짝 걸치게 빼 둔다
 *
 * 배지가 모서리 밖으로 나가야 해서 바깥 <li> 에는 overflow-hidden 을 걸지
 * 않는다. 사진의 둥근 모서리는 안쪽 상자가 따로 자른다 — 한 요소에 둘 다
 * 맡기면 배지가 잘린다.
 *
 * 아이콘은 새 라이브러리를 들이지 않고 기존과 같은 lucide 에서 골랐다.
 */

interface Card {
  photo: StaticImageData
  icon: LucideIcon
}

const CARDS: Card[] = [
  { photo: TRANSPORT_PHOTOS.AIR, icon: PlaneTakeoff },
  { photo: TRANSPORT_PHOTOS.SEA, icon: Ship },
  { photo: TRANSPORT_PHOTOS.TRUCK, icon: Truck },
]

export function RedesignWhatWeDo() {
  const { reveal, parent, up } = useRevealMotion()

  return (
    <section id="what-we-do" className="bg-neutral-50 py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={parent} {...reveal} className="max-w-2xl">
          <motion.p
            variants={up}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase"
          >
            <span aria-hidden="true">◇</span>
            [PLACEHOLDER: EYEBROW 라벨]
          </motion.p>
          <motion.h2
            variants={up}
            className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl"
          >
            [PLACEHOLDER: 섹션 제목]
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
          {CARDS.map((card, i) => (
            <motion.li key={i} variants={up} className="relative">
              {/* 사진 + 스크림 + 글자 — 둥근 모서리는 여기서만 자른다 */}
              <div className="relative h-[200px] overflow-hidden rounded-xl">
                <Image
                  src={card.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover grayscale"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-sm font-bold text-white">
                    [PLACEHOLDER: 카드 제목 {i + 1}]
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-300">
                    [PLACEHOLDER: 카드 설명 한 줄]
                  </p>
                </div>
              </div>

              {/* 모서리에 걸치는 원형 배지 */}
              <span className="absolute -top-3 -right-3 flex size-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
                <card.icon className="size-5 text-neutral-700" aria-hidden="true" />
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
