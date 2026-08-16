"use client"

import { ArrowRight, Mail } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/i18n/navigation'
import { useContent } from '@/config/use-content'

export function ConsultingClient() {
  const { company, consulting } = useContent()
  const { page, groups } = consulting

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* 머리말 */}
      <header className="mx-auto max-w-3xl text-center">
        <Badge className="mb-4">{page.eyebrow}</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{page.lead}</p>
        <p className="mt-3 text-sm text-muted-foreground">{page.note}</p>
      </header>

      <Separator className="my-12" />

      {/* 대상별 서비스 */}
      <div className="space-y-14">
        {groups.map((group) => (
          // id 는 메가메뉴의 화주/포워더 진입 링크(/consulting#shipper, #forwarder)가 가리키는 앵커다.
          // scroll-mt 는 sticky 헤더에 제목이 가려지지 않도록 준 여백이다.
          <section key={group.audience} id={group.id} className="scroll-mt-24">
            <div className="border-s-2 border-primary ps-4">
              <h2 className="text-xl font-semibold text-foreground">
                {group.audience}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {group.items.map((item) => (
                <Card key={item.title} className="h-full py-0 shadow-xs">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-3 inline-flex w-fit rounded-lg bg-primary/10 p-2">
                      <item.icon
                        className="h-5 w-5 text-primary"
                        aria-hidden="true"
                      />
                    </div>

                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    {item.subtitle && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    )}

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Separator className="my-12" />

      {/* 문의 CTA */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">{page.contact.title}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            {page.contact.description}
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="brand" className="cursor-pointer">
              <Link href="/landing#contact">
                {page.contact.primaryCta.label}
                <ArrowRight className="ms-2 size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="cursor-pointer">
              <a href={`mailto:${company.contact.email}`}>
                <Mail className="me-2 size-4" aria-hidden />
                {company.contact.email}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
