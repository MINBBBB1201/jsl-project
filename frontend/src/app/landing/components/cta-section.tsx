"use client"

import React from 'react'
import { ArrowRight, TrendingUp, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useContent } from '@/config/use-content'
const indicatorDotColors = [
  'bg-green-600 dark:bg-green-400',
  'bg-blue-600 dark:bg-blue-400',
  'bg-purple-600 dark:bg-purple-400',
]

export function CTASection() {
  const { cta } = useContent()
  return (
    <section className='py-16 lg:py-24 bg-muted/80'>
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <div className='space-y-8'>
              {/* Badge and Highlights */}
              <div className='flex flex-col items-center gap-4'>
                <Badge variant='outline' className='flex items-center gap-2'>
                  <TrendingUp className='size-3' />
                  {cta.badge}
                </Badge>

                <div className='text-muted-foreground flex flex-wrap items-center justify-center gap-4 text-sm'>
                  {cta.highlights.map((highlight, index) => (
                    <React.Fragment key={highlight}>
                      {index > 0 && <Separator orientation='vertical' className='!h-4' />}
                      <span className='flex items-center gap-1'>
                        {index === 0 && <div className='size-2 rounded-full bg-green-500' />}
                        {highlight}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className='space-y-6'>
                <h2 className='text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
                  {cta.headlineStart}
                  <span className='flex sm:inline-flex justify-center'>
                    {/*
                      강조는 그라데이션 글자가 아니라 밑줄 한 줄로 한다.
                      그라데이션 텍스트는 읽기 대비를 떨어뜨리면서 의미도 더하지 않는다.
                      대신 브랜드 오렌지를 얇은 규칙선으로 써서 신호로만 남긴다.
                    */}
                    <span className='relative mx-2'>
                      {cta.headlineHighlight}
                      <span
                        className='absolute start-0 -bottom-1 h-0.5 w-full bg-brand-cta'
                        aria-hidden='true'
                      />
                    </span>
                    {cta.headlineEnd}
                  </span>
                </h2>

                <p className='text-muted-foreground mx-auto max-w-2xl text-balance lg:text-xl'>
                  {cta.description}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className='flex flex-col justify-center gap-4 sm:flex-row sm:gap-6'>
                <Button variant='brand' size='lg' className='cursor-pointer px-8 py-6 text-lg font-medium' asChild>
                  <a href={cta.primaryCta.href}>
                    <Package className='me-2 size-5' />
                    {cta.primaryCta.label}
                  </a>
                </Button>
                <Button variant='outline' size='lg' className='cursor-pointer px-8 py-6 text-lg font-medium group' asChild>
                  <a href={cta.secondaryCta.href}>
                    {cta.secondaryCta.label}
                    <ArrowRight className='ms-2 size-4 transition-transform group-hover:translate-x-1' />
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className='text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm'>
                {cta.trustIndicators.map((indicator, index) => (
                  <div key={indicator} className='flex items-center gap-2'>
                    <div
                      className={`size-2 rounded-full me-1 ${
                        indicatorDotColors[index % indicatorDotColors.length]
                      }`}
                    />
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
