"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { useContent } from '@/config/use-content'
export function AboutSection() {
  const { about } = useContent()
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {about.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            {about.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {about.description}
          </p>
        </div>

        {/* 왜 JSL인가 — 4가지 강점 */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-semibold tracking-tight">
            {about.valuesTitle}
          </h3>
        </div>

        {/*
          TODO: 고객사 실명 공개 여부 컨펌 후 반영
          소개서에는 실명 거래처가 언급돼 있으나 웹사이트 공개 가능 여부가
          확인되지 않아 "글로벌 제조기업"으로 익명화했습니다.
          컨펌 후 실명/로고를 이 섹션 또는 LogoCarousel에 추가하세요.
        */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {about.values.map((value, index) => (
            <Card key={index} className='group shadow-xs py-2'>
              <CardContent className='p-8'>
                <div className='flex flex-col items-center text-center'>
                  <CardDecorator>
                    <value.icon className='h-6 w-6' aria-hidden />
                  </CardDecorator>
                  <h3 className='mt-6 font-medium text-balance'>{value.title}</h3>
                  <p className='text-muted-foreground mt-3 text-sm'>{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-muted-foreground">{about.ctaText}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="cursor-pointer" asChild>
              <a href={about.primaryCta.href}>{about.primaryCta.label}</a>
            </Button>
            <Button size="lg" variant="outline" className="cursor-pointer" asChild>
              <a href={about.secondaryCta.href}>{about.secondaryCta.label}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
