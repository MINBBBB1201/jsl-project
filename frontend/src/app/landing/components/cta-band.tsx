"use client"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useContent } from "@/config/use-content"

/**
 * 다크 CTA 밴드 (3단계)
 *
 * ── 자리 ────────────────────────────────────────────────────────────────
 * 서비스 아코디언과 컨설팅 사이다. 두 가지를 동시에 노린 자리다.
 *
 * 하나는 명암 리듬이다. Why JSL(다크) 다음으로 About → Features → Consulting →
 * Network → Pricing → FAQ → CTA → Contact 까지 여덟 섹션이 전부 밝아서, 페이지
 * 후반부가 한 덩어리로 늘어졌다. 그 구간 앞머리에 어두운 띠를 하나 끼운다.
 * (stats-section.tsx 에 적어 둔 것과 같은 이유다 — 자리를 옮길 때는 어두운
 * 섹션끼리 맞닿지 않는지 먼저 확인할 것.)
 *
 * 다른 하나는 문맥이다. 5개 모드를 다 읽은 직후가 "그래서 우리 화물은 어느
 * 모드죠?" 하고 물을 마음이 가장 큰 지점이다. 컨설팅 섹션 뒤로 내리면 바로
 * 아래 컨설팅 CTA 와 버튼이 겹쳐 두 번 조르는 꼴이 된다.
 *
 * ── 왜 아래 CTASection 과 겹치지 않나 ───────────────────────────────────
 * CTASection 은 페이지를 닫는 큰 마무리다 — 배지·신뢰 지표·버튼 두 개가
 * 달린 한 화면짜리 블록이다. 이쪽은 한 줄짜리 띠이고 버튼도 하나다. 스크롤을
 * 멈추게 하는 것이 아니라 지나가는 길에 문을 하나 열어 두는 역할이다.
 *
 * ── 도트 패턴 ───────────────────────────────────────────────────────────
 * globals.css 에 유틸리티로 만들지 않고 여기 인라인으로 둔다. 예전에 있던
 * 범용 bg-brand-dots 를 지운 이유가 "있으면 결국 여기저기 덧대게 된다" 였다
 * (globals.css 의 bg-blueprint 주석). 이 무늬는 이 띠 하나를 위한 것이라
 * 컴포넌트 밖으로 꺼내지 않는다.
 *
 * 오른쪽에서 왼쪽으로 사라지게 마스크를 씌운다. 글자 뒤에까지 점이 깔리면
 * 대비가 떨어지고, 어차피 무늬는 버튼 쪽 여백을 채우려고 넣은 것이다.
 */

/** 점 간격. 이보다 촘촘하면 무늬가 아니라 질감으로 뭉개진다 */
const DOT_GAP = "22px"

export function CtaBand() {
  const { ctaBand } = useContent()

  return (
    /*
      배경은 테마에 무관하게 고정인 --brand-navy-deep. --background 계열을 쓰면
      다크모드에서 띠가 배경에 녹아 리듬이 사라진다 (stats-section 과 같은 판단).
    */
    <section
      aria-labelledby="cta-band-title"
      className="bg-brand-navy-deep relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--brand-orange) 1.5px, transparent 1.5px)",
          backgroundSize: `${DOT_GAP} ${DOT_GAP}`,
          opacity: 0.22,
          maskImage:
            "linear-gradient(to left, black 0%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(to left, black 0%, transparent 62%)",
        }}
      />

      {/*
        위아래 얇은 흰 알파 선. --border 는 라이트 모드에서 밝은 회색이라 이
        배경 위에서는 보이지 않는다 (stats-section 과 같은 처리).
      */}
      <div className="relative border-y border-white/10">
        <div className="container mx-auto px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-xl">
              <h2
                id="cta-band-title"
                className="text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl"
              >
                {ctaBand.title}
              </h2>
              {/*
                보조 문장은 흰색 대신 --brand-slate 로 뺀다. 어두운 바탕에서
                흰색을 두 단계로 늘어놓으면 위계가 뭉개진다.
              */}
              <p className="text-brand-slate mt-3 text-sm text-pretty sm:text-base">
                {ctaBand.description}
              </p>
            </div>

            {/*
              알약 버튼. Button 기본은 rounded-md 라 여기서만 rounded-full 로
              덮는다 (cn 의 tailwind-merge 가 뒤엣것을 남긴다).
              페이지 안 앵커라 next/link 가 아니라 a 를 쓴다 — 다른 섹션 CTA 와
              같은 방식이다.
            */}
            <Button
              variant="brand"
              size="lg"
              className="group h-12 shrink-0 cursor-pointer rounded-full px-8 text-base font-semibold"
              asChild
            >
              <a href={ctaBand.cta.href}>
                {ctaBand.cta.label}
                <ArrowRight
                  className="ms-1 size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
