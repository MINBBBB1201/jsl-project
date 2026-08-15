"use client"

import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Image3D } from '@/components/image-3d'
import { services } from '@/config/landing-content'

const { modes, valueAdded } = services

export function FeaturesSection() {
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

        {/* Second Feature Section - Flipped Layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Left Content */}
          <div className="space-y-6 order-2 lg:order-1">
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

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
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

          {/* Right Image */}
          <Image3D
            lightSrc="/feature-2-light.png"
            darkSrc="/feature-2-dark.png"
            alt="창고 재고 관리 화면"
            direction="right"
            className="order-1 lg:order-2"
          />
        </div>
      </div>
    </section>
  )
}
