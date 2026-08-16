"use client"

import Link from 'next/link'
import { ArrowRight, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DotPattern } from '@/components/dot-pattern'
import { useContent } from '@/config/use-content'
export function HeroSection() {
  const { hero } = useContent()
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-background to-background/80 pt-16 sm:pt-20 pb-20 sm:pb-24">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        {/* Dot pattern overlay using reusable component */}
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Announcement Badge */}
          <div className="mb-8 flex justify-center">
            <Badge variant="outline" className="px-4 py-2 border-foreground">
              <Ship className="w-3 h-3 mr-2" />
              {hero.badge}
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {hero.headlineStart}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}{hero.headlineHighlight}{" "}
            </span>
            {hero.headlineEnd}
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {hero.subheadline}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button variant="brand" size="lg" className="text-base cursor-pointer" asChild>
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base cursor-pointer" asChild>
              <Link href={hero.secondaryCta.href}>
                {hero.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
        {/*
          예전에는 여기에 대시보드 미리보기 이미지가 있었습니다.

          원본 템플릿(shadcnstore)의 스크린샷이라 우리 서비스와 아무 관계가 없는
          화면이었습니다 — "ShadcnStore Admin Dashboard" 제목에 Total Revenue $1,250,
          New Customers 1,234 같은 가짜 수치, 이미 지운 메뉴(Mail·Tasks·Calendar 등)까지
          그대로 노출됐습니다. 실제 화면을 담은 이미지가 준비되면 그때 다시 넣으세요.

          바로 아래 실적 수치(StatsSection)와 파트너사 바(PartnersBar)가 이어지므로
          히어로는 CTA 에서 끝나도 비어 보이지 않습니다.
        */}
      </div>
    </section>
  )
}
