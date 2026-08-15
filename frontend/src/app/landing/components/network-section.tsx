"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { network } from '@/config/landing-content'

export function NetworkSection() {
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

        {/* 거점 그리드 */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {network.items.map((office) => (
            <Card key={office.city} className="shadow-xs py-2">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <CardDecorator>
                      <office.icon className="h-6 w-6" aria-hidden />
                    </CardDecorator>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {office.city}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-1">
                    {office.cityEn}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {office.role} · {office.headcount}명
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
          5개 거점 총 인력 약 {network.totalHeadcount}명
        </p>
      </div>
    </section>
  )
}
