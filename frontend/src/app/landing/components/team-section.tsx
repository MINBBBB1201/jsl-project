"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { departments } from '@/config/landing-content'

export function TeamSection() {
  return (
    <section id="team" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {departments.badge}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            {departments.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {departments.description}
          </p>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {departments.items.map((dept) => (
            <Card key={dept.name} className="shadow-xs py-2">
              <CardContent className="p-4">
                <div className="text-center">
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <CardDecorator>
                      <dept.icon className="h-6 w-6" aria-hidden />
                    </CardDecorator>
                  </div>

                  {/* Name and Role */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {dept.name}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-3">
                    {dept.role}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {dept.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
