"use client"

import Image from "next/image"

import { useContent } from "@/config/use-content"
import { HeroRoute } from "./hero-route"
import { LANDING_PHOTOS } from "./landing-photos"

/**
 * 히어로 — 랜딩 리디자인
 *
 * ── 구조 (1단계에서 확정, 손대지 않음) ──────────────────────────────────
 * 풀블리드 사진 위에 카피가 바로 얹힌다. 상단 유틸리티바도, 슬라이더 화살표도
 * 두지 않는다 — 첫 화면에서 눈이 헤드라인 말고 다른 곳으로 갈 이유를 만들지
 * 않는다. 헤드라인은 두 줄로 끊고 크기를 절제해서(5xl 상한) 사진을 덮지 않게
 * 한다. 맨 아래는 얇은 선 하나로 카피와 갈라 놓은 인라인 통계 3개다.
 *
 * ── 여기에는 스크롤 리빌이 없다 (의도) ─────────────────────────────────
 * opacity:0 이 서버 HTML 인라인 스타일로 찍히면 LCP 대상인 헤드라인이
 * 하이드레이션 전까지 보이지 않는다 (실측 2106ms). 히어로는 처음부터 화면
 * 안에 있어 "스크롤해야 나타나는" 연출이 연출로 기능하지도 않는다. 그래서
 * 첫 페인트부터 최종 상태로 그린다. 스크롤 리빌은 실제로 스크롤해야 닿는
 * 아래 두 섹션(What We Do · Why JSL)에만 남겼다.
 *
 * ── 색 ──────────────────────────────────────────────────────────────────
 * 스크림과 보조 글자는 다크 띠 전용 한 쌍(--brand-navy-deep / --brand-slate)을
 * 쓴다. Stats·Partners 섹션과 같은 값이라 페이지 전체의 어두운 톤이 하나로
 * 맞는다. neutral-* 회색조는 1단계 placeholder 였고 전부 걷어냈다.
 *
 * 주 CTA 는 --brand-cta 다. 브랜드 원색 --brand-orange(#e87000) 위에 흰 글자를
 * 올리면 대비가 3.11:1 로 WCAG AA 에 못 미쳐, 흰 글자를 올릴 수 있게 낮춘
 * 별도 토큰이 이미 정의돼 있다 (globals.css 주석 참고). 오렌지 배경에 글자를
 * 올리는 자리에는 --brand-orange 를 쓰지 말 것.
 *
 * ── 사진 ────────────────────────────────────────────────────────────────
 * hero-port-dusk.jpg — 해질녘 항만. 어두워서 스크림 위 흰 글자가 잘 읽히고,
 * 크레인 조명의 주황이 브랜드 오렌지와 같은 계열이라 CTA 와 색이 따로 놀지
 * 않는다. 출처·라이선스는 landing-photos.ts 주석에 있다.
 *
 * ── 항로 애니메이션 (3단계) ────────────────────────────────────────────
 * 오른쪽 여백에 점선 경로 + 움직이는 마커를 얹는다. 카피가 차지하는
 * max-w-3xl 바깥이고 lg 부터만 그린다 — 자세한 제약은 hero-route.tsx 에.
 * 위 "여기에는 스크롤 리빌이 없다" 원칙은 그대로다. 이 장식은 화면에 들어와
 * 있는지와 무관하게 처음부터 그려지고, LCP 대상인 헤드라인을 가리지 않는다.
 */
export function RedesignHero() {
  const { redesign } = useContent()
  const { hero } = redesign

  return (
    <section id="hero" className="relative isolate overflow-hidden">
      {/* 배경 사진 — LCP 대상이라 priority 로 즉시 받는다 */}
      <Image
        src={LANDING_PHOTOS.heroPortDusk}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/*
        스크림. 사진 위 흰 글자의 대비를 확보한다. 아래쪽을 더 어둡게 해서
        통계 스트립이 사진의 밝은 부분(크레인 조명)에 걸려도 읽힌다.
      */}
      <div
        className="from-brand-navy-deep/75 via-brand-navy-deep/70 to-brand-navy-deep/90 absolute inset-0 bg-gradient-to-b"
        aria-hidden="true"
      />

      <HeroRoute />

      <div className="relative container mx-auto px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-brand-slate flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
            {/* 마름모만 브랜드 오렌지 — 라벨 전체를 물들이면 눈이 헤드라인보다 여기로 간다 */}
            <span className="text-brand-orange" aria-hidden="true">◇</span>
            <span className="font-poppins">{hero.eyebrow}</span>
          </p>

          {/*
            절제된 크기. 화면을 꽉 채우는 거대한 헤드라인 대신 3xl~5xl 에서
            멈추고, 줄바꿈을 직접 잡아 두 줄로 읽히게 한다.
          */}
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
            {hero.headline1}
            <br />
            {hero.headline2}
          </h1>

          <p className="text-brand-slate mt-6 max-w-xl text-base sm:text-lg">
            {hero.subheadline}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={hero.primaryCta.href}
              className="bg-brand-cta text-brand-cta-foreground hover:bg-brand-orange-deep inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold transition-colors"
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {hero.secondaryCta.label}
            </a>
          </div>

          {/* 얇은 구분선 + 인라인 통계 3개 */}
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/20 pt-8">
            {hero.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-brand-slate text-[11px] tracking-[0.14em] uppercase">
                  {stat.label}
                </dt>
                <dd className="tabular-figures mt-1 text-2xl font-semibold text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
