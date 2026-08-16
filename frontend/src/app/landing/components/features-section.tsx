"use client"

import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useContent } from '@/config/use-content'

export function FeaturesSection() {
  const { services } = useContent()
  const { modes, valueAdded } = services

  return (
    <section id="features" className="border-b bg-background py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {/* 섹션 머리말 — 가운데 정렬 대신 좌측 정렬. 그리드 축과 맞아 읽는 눈이 덜 움직인다 */}
        <div className="mb-16 max-w-2xl">
          <Badge variant="outline" className="mb-4">{services.badge}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {services.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {services.description}
          </p>
        </div>

        {/*
          5개 운송 모드 — 벤토 그리드

          다섯 개를 같은 크기로 늘어놓으면 "어느 것이 주력인지" 정보가 사라진다.
          물동량이 큰 항공·해상을 넓은 칸에, 나머지 셋을 좁은 칸에 두어
          크기 자체가 위계를 말하게 했다 (lg 6열 기준 3+3 / 2+2+2).

          카드는 그림자 대신 1px 보더만 쓴다. 그림자를 겹쳐 띄우는 것보다
          같은 두께의 선으로 구획하는 편이 이 양식에 맞고, 화면이 조용해진다.
        */}
        <div className="mb-24 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-6">
          {modes.map((mode, index) => {
            const isPrimary = index < 2

            return (
              <article
                key={mode.code}
                /*
                  히어로 벤토그리드의 각 칸이 이 앵커(#air, #sea …)로 들어온다.
                  scroll-mt 는 sticky 헤더에 카드 윗줄이 가려지지 않도록 준 여백이다.
                */
                id={mode.code.toLowerCase()}
                className={cn(
                  "flex scroll-mt-24 flex-col bg-background p-6 sm:p-8",
                  isPrimary ? "lg:col-span-3" : "lg:col-span-2"
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
                    {mode.code}
                  </p>
                  <mode.icon
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className={cn(
                    "mt-3 font-semibold text-foreground",
                    isPrimary ? "text-2xl" : "text-lg"
                  )}
                >
                  {mode.title}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">{mode.summary}</p>

                <ul className="mt-auto space-y-2 pt-6">
                  {mode.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted-foreground">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        {/*
          부가 서비스

          오른쪽에 "창고 재고 관리 화면"이라는 설명을 달고 템플릿 스크린샷을 띄우고
          있었는데, 실제로는 Sarah Johnson·sarah.johnson@example.com 같은 가짜 사용자
          목록에 Enterprise/Professional 요금제와 Paypal·UPI 결제 수단이 담긴 화면이라
          창고 재고와 아무 관계가 없었습니다. 실제 화면 이미지가 준비되면 그때
          2단 배치로 되돌리세요.
        */}
        {/* 머리말과 같은 축(좌측 정렬)에 맞춘다 — 가운데 정렬이 섞이면 그리드가 흐트러진다 */}
        <div className="max-w-3xl space-y-6">
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
