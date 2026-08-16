"use client"

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { consulting } from '@/config/landing-content'

export function ConsultingSection() {
  return (
    <section id="consulting" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge className="mb-4">{consulting.badge}</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {consulting.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {consulting.description}
          </p>
        </div>

        {/* 화주 / 포워더 대상 그룹 */}
        <div className="grid gap-8 lg:grid-cols-2">
          {consulting.groups.map((group) => (
            <div key={group.audience} className="space-y-6">
              <div className="border-s-2 border-primary ps-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {group.audience}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {group.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => (
                  <Card key={item.title} className="shadow-xs h-full py-0">
                    <CardContent className="p-5">
                      <div className="mb-3 inline-flex p-2 bg-primary/10 rounded-lg">
                        <item.icon
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <h4 className="font-medium text-foreground mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="outline" className="cursor-pointer" asChild>
            <Link href={consulting.detailCta.href} className="flex items-center">
              {consulting.detailCta.label}
              <ArrowRight className="ms-2 size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="lg" className="cursor-pointer" asChild>
            <a href={consulting.primaryCta.href} className="flex items-center">
              {consulting.primaryCta.label}
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
