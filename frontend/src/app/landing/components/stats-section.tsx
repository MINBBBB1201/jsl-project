"use client"

import { Card, CardContent } from '@/components/ui/card'
import { DotPattern } from '@/components/dot-pattern'
import { stats, monthlyVolumes, volumesHeading } from '@/config/landing-content'

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16 relative">
      {/* Background with transparency */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/20" />
      <DotPattern className="opacity-75" size="md" fadeStyle="circle" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center bg-background/60 backdrop-blur-sm border-border/50 py-0"
            >
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {stat.value}
                  </h3>
                  <p className="font-semibold text-foreground">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 월간 처리 물동량 */}
        <div className="mt-10 md:mt-12">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              {volumesHeading.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {volumesHeading.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {monthlyVolumes.map((volume) => (
              <Card
                key={volume.mode}
                className="bg-background/60 backdrop-blur-sm border-border/50 py-0"
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                    <volume.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wider text-primary">
                      {volume.mode}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {volume.value}
                      <span className="ms-1 text-sm font-medium text-muted-foreground">
                        {volume.unit}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
