"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CoverageGlobe } from '@/components/landing/coverage-globe'
import { useContent } from '@/config/use-content'

/**
 * 글로벌 네트워크
 *
 * 위쪽은 본사 ↔ 지사 연결 도식, 아래쪽은 거점별 상세 카드다.
 *
 * ⚠️ 도식이 카드를 대체하지 않는다. 도식은 관계(어디가 중심이고 어디로
 *    이어지는가)만 말하고, 역할·인원·설명 같은 실제 내용은 카드에 있다.
 *    도식만 남기면 그 내용이 사라진다.
 */
export function NetworkSection() {
  const { network } = useContent()

  const hub = network.items.find((office) => office.isHq)
  const spokes = network.items.filter((office) => !office.isHq)
  return (
    <section id="network" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {network.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            {network.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {network.description}
          </p>
        </div>

        {/*
          커버리지 지구본.

          sm 미만에서는 감춘다. 작은 화면에서 지구본을 줄이면 거점 다섯 점이
          서로 붙어 무엇을 가리키는지 알 수 없고, WebGL 을 켜는 비용만 남는다 —
          읽히지 않는 그림을 띄우느니 아래 카드만 보여주는 편이 낫다.
          카드에 같은 정보가 다 있다. (연결선 도식 때부터 같은 원칙이다.)

          WebGL 을 못 쓰는 환경에서는 CoverageGlobe 가 기존 NetworkBeams 도식으로
          알아서 되돌린다.
        */}
        {hub ? (
          <div className="mx-auto mb-16 max-w-4xl max-sm:hidden">
            <CoverageGlobe
              hub={hub}
              spokes={spokes}
              headcountUnit={network.headcountUnit}
              label={network.title}
            />
          </div>
        ) : null}

        {/* 거점 그리드 */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {network.items.map((office) => (
            <Card key={office.city} className="shadow-xs py-2">
              <CardContent className="p-4">
                {/*
                  아이콘의 점무늬 배경(CardDecorator)을 걷어냈다 — about 섹션과 같은
                  이유다. 더불어 다섯 칸에 똑같이 붙어 있던 지도핀을 본사/지사로
                  갈랐다. 같은 아이콘이 다섯 번 반복되면 아무것도 구분하지 못하는
                  장식이지만, 갈라 두면 아이콘 자체가 "어디가 본사인가"를 말한다.
                */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <office.icon className="size-7 text-primary" aria-hidden />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {office.city}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-1">
                    {office.cityEn}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {office.role} · {office.headcount}{network.headcountUnit}
                  </p>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {office.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 총 인력 */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {network.totalLabel}
        </p>
      </div>
    </section>
  )
}
