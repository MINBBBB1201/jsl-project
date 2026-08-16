"use client"

import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useContent } from '@/config/use-content'

export function FeaturesSection() {
  const { services } = useContent()
  const { modes, valueAdded } = services

  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">{services.badge}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {services.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {services.description}
          </p>
        </div>

        {/* 5개 운송 모드 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-24">
          {modes.map((mode) => (
            <Card key={mode.code} className="shadow-xs h-full py-0">
              <CardContent className="p-6 flex h-full flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                    <mode.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-widest text-primary">
                      {mode.code}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {mode.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {mode.summary}
                </p>

                <ul className="space-y-2 mt-auto">
                  {mode.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted-foreground">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/*
          부가 서비스

          오른쪽에 "창고 재고 관리 화면"이라는 설명을 달고 템플릿 스크린샷을 띄우고
          있었는데, 실제로는 Sarah Johnson·sarah.johnson@example.com 같은 가짜 사용자
          목록에 Enterprise/Professional 요금제와 Paypal·UPI 결제 수단이 담긴 화면이라
          창고 재고와 아무 관계가 없었습니다. 실제 화면 이미지가 준비되면 그때
          2단 배치로 되돌리세요.
        */}
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {valueAdded.title}
            </h3>
            <p className="text-muted-foreground text-base text-pretty">
              {valueAdded.description}
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {valueAdded.items.map((feature, index) => (
              <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                <div className="mt-0.5 flex shrink-0 items-center justify-center">
                  <feature.icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button size="lg" className="cursor-pointer" asChild>
              <a href={valueAdded.primaryCta.href} className='flex items-center'>
                {valueAdded.primaryCta.label}
                <ArrowRight className="ms-2 size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="cursor-pointer" asChild>
              <a href={valueAdded.secondaryCta.href}>
                {valueAdded.secondaryCta.label}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
