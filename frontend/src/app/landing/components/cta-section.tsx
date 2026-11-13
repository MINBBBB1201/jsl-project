"use client"

import { ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContent } from '@/config/use-content'

export function CTASection() {
  const { cta } = useContent()
  return (
    <section className='py-16 lg:py-24 bg-muted/80'>
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <div className='space-y-8'>
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

                <ul role='list' className='text-muted-foreground flex flex-col items-center justify-center gap-y-2 text-sm leading-relaxed sm:flex-row sm:flex-wrap'>
                  {cta.highlights.map((highlight, index) => (
                    <li key={highlight} className={`px-4 ${index > 0 ? 'sm:border-s sm:border-border' : ''}`}>
                      {highlight}
                    </li>
                  ))}
                </ul>
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

              {/* Supporting facts use the same typography as the service details. */}
              <ul role='list' className='text-muted-foreground flex flex-col items-center justify-center gap-y-2 text-sm leading-relaxed sm:flex-row sm:flex-wrap'>
                {cta.trustIndicators.map((indicator, index) => (
                  <li key={indicator} className={`px-4 ${index > 0 ? 'sm:border-s sm:border-border' : ''}`}>
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
