"use client"

import Image from "next/image"
import { motion } from "framer-motion"

import { TRANSPORT_PHOTOS } from "./transport-photos"
import { useRevealMotion } from "@/lib/landing-motion"

/**
 * 히어로 — 랜딩 리디자인 1단계
 *
 * ⚠️ 1단계는 구조와 애니메이션만 검증한다. 색은 회색조 placeholder 이고 카피는
 *    [PLACEHOLDER: …] 다. 브랜드 컬러(네이비/오렌지)와 실제 문구·사진은 2단계.
 *
 * ── 구조 ────────────────────────────────────────────────────────────────
 * 풀블리드 사진 위에 카피가 바로 얹힌다. 상단 유틸리티바도, 슬라이더 화살표도
 * 두지 않는다 — 첫 화면에서 눈이 헤드라인 말고 다른 곳으로 갈 이유를 만들지
 * 않는다. 헤드라인은 두 줄로 끊고 크기를 절제해서(5xl 상한) 사진을 덮지 않게
 * 한다. 맨 아래는 얇은 선 하나로 카피와 갈라 놓은 인라인 통계 3개다.
 *
 * ── 사진 ────────────────────────────────────────────────────────────────
 * 새 스톡사진을 받지 않고 이미 있는 src/assets/transport/air.jpg 를 쓴다
 * (Unsplash License, 출처는 transport-photos.ts 주석 참고). grayscale 을
 * 걸어 두는 것은 1단계 규칙이자, 색이 빠져야 레이아웃과 타이밍만 보이기
 * 때문이다. 2단계에서 회사소개서 실사진으로 갈면서 필터를 걷으면 된다.
 *
 * ── 텍스트가 opacity 0 에서 시작하는 것에 대해 ──────────────────────────
 * bento-grid.tsx 는 히어로에서 페이드를 일부러 뺐다. 사진이 LCP 대상인데
 * opacity:0 이 서버 HTML 에 찍히면 측정이 JS 실행까지 밀리기 때문이다.
 * 여기서는 LCP 대상인 배경 사진이 애니메이션 밖에 있고(priority 로 즉시 그린다)
 * 카피 블록만 페이드하므로 그 문제를 피한다. 다만 JS 가 실패하면 카피가 보이지
 * 않는 것은 여전하므로, 2단계 전에 한 번 판단이 필요하다.
 */
export function RedesignHero() {
  const { reveal, parent, up } = useRevealMotion()

  return (
    <section id="hero" className="relative isolate overflow-hidden">
      {/* 배경 사진 — 애니메이션 대상이 아니다 (LCP) */}
      <Image
        src={TRANSPORT_PHOTOS.AIR}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover grayscale"
      />
      {/*
        스크림. 사진 위 흰 글자의 대비를 확보한다. 아래쪽을 더 어둡게 해서
        통계 스트립이 사진의 밝은 부분에 걸려도 읽힌다.
      */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-neutral-950/65 to-neutral-950/85"
        aria-hidden="true"
      />

      <div className="relative container mx-auto px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <motion.div variants={parent} {...reveal} className="max-w-3xl">
          <motion.p
            variants={up}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-300 uppercase"
          >
            <span aria-hidden="true">◇</span>
            [PLACEHOLDER: EYEBROW 라벨]
          </motion.p>

          {/*
            절제된 크기. 화면을 꽉 채우는 거대한 헤드라인 대신 3xl~5xl 에서
            멈추고, 줄바꿈을 직접 잡아 두 줄로 읽히게 한다.
          */}
          <motion.h1
            variants={up}
            className="mt-6 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl"
          >
            [PLACEHOLDER: 헤드라인 1행]
            <br />
            [PLACEHOLDER: 헤드라인 2행]
          </motion.h1>

          <motion.p
            variants={up}
            className="mt-6 max-w-xl text-base text-neutral-300 sm:text-lg"
          >
            [PLACEHOLDER: 서브헤드 한 줄]
          </motion.p>

          {/*
            버튼은 shadcn Button 대신 중립색 앵커다. Button 의 기본 variant 는
            브랜드 토큰(primary/brand-cta)을 끌어와서 1단계 회색조 규칙과
            어긋난다. 2단계에서 Button 으로 갈아끼우면 된다.
          */}
          <motion.div variants={up} className="mt-9 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              [PLACEHOLDER: 주 CTA]
            </a>
            <a
              href="#what-we-do"
              className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              [PLACEHOLDER: 보조 CTA]
            </a>
          </motion.div>

          {/* 얇은 구분선 + 인라인 통계 3개 */}
          <motion.dl
            variants={up}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/20 pt-8"
          >
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <dt className="text-[11px] tracking-[0.14em] text-neutral-400 uppercase">
                  [PLACEHOLDER: 라벨 {n}]
                </dt>
                <dd className="tabular-figures mt-1 text-2xl font-semibold text-white">
                  [PLACEHOLDER: 수치]
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>
    </section>
  )
}
