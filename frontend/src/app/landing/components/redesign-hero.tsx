"use client"

import Image from "next/image"

import { TRANSPORT_PHOTOS } from "./transport-photos"

/**
 * 히어로 — 랜딩 리디자인 1단계
 *
 * ⚠️ 1단계는 구조만 검증한다. 색은 회색조 placeholder 이고 카피는
 *    [PLACEHOLDER: …] 다. 브랜드 컬러(네이비/오렌지)와 실제 문구·사진은 2단계.
 *
 * ── 구조 ────────────────────────────────────────────────────────────────
 * 풀블리드 사진 위에 카피가 바로 얹힌다. 상단 유틸리티바도, 슬라이더 화살표도
 * 두지 않는다 — 첫 화면에서 눈이 헤드라인 말고 다른 곳으로 갈 이유를 만들지
 * 않는다. 헤드라인은 두 줄로 끊고 크기를 절제해서(5xl 상한) 사진을 덮지 않게
 * 한다. 맨 아래는 얇은 선 하나로 카피와 갈라 놓은 인라인 통계 3개다.
 *
 * ── 여기에는 스크롤 리빌이 없다 (의도) ─────────────────────────────────
 * 처음에는 아래 두 섹션과 같은 framer-motion 리빌을 걸었는데 걷어냈다.
 *
 *   · opacity:0 이 서버 HTML 인라인 스타일로 찍힌다. 그러면 LCP 대상인 헤드라인이
 *     하이드레이션이 끝날 때까지 보이지 않는다 — 로컬 프로덕션 빌드에서 완전히
 *     보이기까지 2.1초가 걸렸고, JS 가 실패하면 카피가 아예 남지 않는다.
 *   · 히어로는 처음부터 화면 안에 있다. "스크롤해야 나타나는" 연출은 여기서
 *     연출로 기능하지 않고 지연으로만 남는다.
 *
 * 그래서 이 섹션은 첫 페인트부터 최종 상태로 그린다. 스크롤 리빌은 실제로
 * 스크롤해야 닿는 아래 두 섹션(What We Do · Why JSL)에만 남겼다.
 * 되돌리려면 lib/landing-motion.ts 의 useRevealMotion 을 다시 붙이면 되지만,
 * 위 두 가지 대가를 먼저 확인할 것.
 *
 * ── 사진 ────────────────────────────────────────────────────────────────
 * 새 스톡사진을 받지 않고 이미 있는 src/assets/transport/air.jpg 를 쓴다
 * (Unsplash License, 출처는 transport-photos.ts 주석 참고). grayscale 을
 * 걸어 두는 것은 1단계 규칙이자, 색이 빠져야 레이아웃만 보이기 때문이다.
 * 2단계에서 회사소개서 실사진으로 갈면서 필터를 걷으면 된다.
 */
export function RedesignHero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      {/* 배경 사진 — LCP 대상이라 priority 로 즉시 받는다 */}
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
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-neutral-300 uppercase">
            <span aria-hidden="true">◇</span>
            [PLACEHOLDER: EYEBROW 라벨]
          </p>

          {/*
            절제된 크기. 화면을 꽉 채우는 거대한 헤드라인 대신 3xl~5xl 에서
            멈추고, 줄바꿈을 직접 잡아 두 줄로 읽히게 한다.
          */}
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
            [PLACEHOLDER: 헤드라인 1행]
            <br />
            [PLACEHOLDER: 헤드라인 2행]
          </h1>

          <p className="mt-6 max-w-xl text-base text-neutral-300 sm:text-lg">
            [PLACEHOLDER: 서브헤드 한 줄]
          </p>

          {/*
            버튼은 shadcn Button 대신 중립색 앵커다. Button 의 기본 variant 는
            브랜드 토큰(primary/brand-cta)을 끌어와서 1단계 회색조 규칙과
            어긋난다. 2단계에서 Button 으로 갈아끼우면 된다.
          */}
          <div className="mt-9 flex flex-wrap gap-3">
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
          </div>

          {/* 얇은 구분선 + 인라인 통계 3개 */}
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/20 pt-8">
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
          </dl>
        </div>
      </div>
    </section>
  )
}
