"use client"

import Link from 'next/link'
import { ArrowRight, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useContent } from '@/config/use-content'
import { HeroOpsPanel } from './hero-ops-panel'
import { HeroRouteLines } from './hero-route-lines'

/**
 * 히어로
 *
 * 조판은 스위스 양식의 비대칭 2단 그리드다. 가운데 정렬로 모든 요소를 쌓으면
 * 위계가 크기 하나로만 표현되는데, 좌우로 나누면 "주장(카피)"과 "증거(데이터)"가
 * 나란히 놓여 관계가 드러난다.
 *
 * 배경은 블루프린트 격자 + 거점 노선 도해. 둘 다 아주 옅어서 본문 대비를
 * 건드리지 않는다. 예전의 오렌지 글로우(blur-3xl)는 걷어냈다 — 색으로 만든
 * 깊이감은 정보를 담지 않는다.
 */
export function HeroSection() {
  const { hero } = useContent()

  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b bg-background pt-16 pb-16 sm:pt-20 sm:pb-20"
    >
      {/* 배경 — 격자 */}
      <div className="bg-blueprint absolute inset-0" aria-hidden="true" />

      {/*
        배경 — 거점 노선 도해 (데스크톱에서만).
        오른쪽 절반을 덮되 운영 현황 패널이 그 위에 불투명하게 올라가므로
        패널 주변에서만 선이 보인다. 레이어가 겹치면서 깊이가 생긴다.
      */}
      <HeroRouteLines className="pointer-events-none absolute -top-16 right-0 hidden h-[640px] w-[860px] text-brand-navy lg:block dark:text-foreground" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* 좌: 카피 */}
          <div className="lg:col-span-7">
            <Badge variant="outline" className="mb-6 border-foreground px-3 py-1.5">
              <Ship className="mr-2 size-3" aria-hidden="true" />
              {hero.badge}
            </Badge>

            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
              {hero.headlineStart}
              {/*
                강조는 색이 아니라 굵기와 규칙선으로 준다.
                예전에는 그라데이션 글자였는데, 대비를 떨어뜨리면서
                "무엇이 중요한가"를 더 잘 알려주지도 않았다.
              */}
              <span className="relative mx-2 inline-block whitespace-nowrap">
                {hero.headlineHighlight}
                <span
                  className="absolute inset-x-0 -bottom-1 h-1 bg-brand-cta"
                  aria-hidden="true"
                />
              </span>
              {hero.headlineEnd}
            </h1>

            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              {hero.subheadline}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button variant="brand" size="lg" className="cursor-pointer text-base" asChild>
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="cursor-pointer text-base" asChild>
                <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>

          {/* 우: 실제 운영 데이터 */}
          <div className="lg:col-span-5">
            <HeroOpsPanel />
          </div>
        </div>
      </div>
    </section>
  )
}
