"use client"

import Link from 'next/link'
import { ArrowRight, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useContent } from '@/config/use-content'
import { HeroTransportBento } from './hero-transport-bento'

/**
 * 히어로
 *
 * 카피를 위에 한 덩어리로 두고, 그 아래를 5개 운송모드 사진 벤토그리드가
 * 가로로 꽉 채운다. 예전에는 좌우 2단(카피 | 운영현황 패널)이었는데, 이 회사가
 * 파는 것을 한 화면에서 가장 빨리 알리는 것은 숫자가 아니라 "우리가 다루는
 * 다섯 가지 운송 수단"이라 사진에 자리를 내줬다. 운영현황 패널은 없애지 않고
 * 바로 아래 독립 섹션(OpsStatusSection)으로 옮겼다.
 *
 * 배경 격자(bg-blueprint)는 그대로 둔다. 사진 칸 사이의 여백에서만 보여
 * 페이지 전체를 묶는 바탕 역할을 한다. 예전 SVG 노선도(HeroRouteLines)는
 * 사진과 겹치면 둘 다 읽히지 않아 걷어냈다.
 */
export function HeroSection() {
  const { hero } = useContent()

  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b bg-background pt-14 pb-16 sm:pt-16 sm:pb-20"
    >
      {/* 배경 — 격자 */}
      <div className="bg-blueprint absolute inset-0" aria-hidden="true" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
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

        {/* 5개 운송모드 */}
        <div className="mt-12 sm:mt-14">
          <HeroTransportBento modes={hero.bento.modes} />
        </div>
      </div>
    </section>
  )
}
