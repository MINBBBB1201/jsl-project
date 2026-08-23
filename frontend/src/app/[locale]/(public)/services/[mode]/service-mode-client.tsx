"use client"

import Image from "next/image"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { StickyScrollReveal } from "@/components/services/sticky-scroll-reveal"
import { useServicePage } from "@/config/use-service-page"
import type { ServiceMode } from "@/config/service-modes"

/**
 * 운송모드 상세 페이지 본문
 *
 * 위에서 아래로 히어로 → (SEA 만) 핵심 역량 → 스티키 스크롤 단계 →
 * (EXPRESS 만) 리드타임 표 → 문의 CTA 순이다. 모드마다 있는 블록이 달라
 * 조건부로 렌더하지만 순서는 다섯 페이지가 같다.
 */
export function ServiceModeClient({ mode }: { mode: ServiceMode }) {
  const page = useServicePage(mode)

  return (
    <>
      {/* ── 히어로 ─────────────────────────────────────────────────── */}
      <section className="bg-brand-navy-deep relative overflow-hidden">
        <Image
          src={page.heroPhoto}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        {/* 사진 위 흰 글자의 대비 확보 — 랜딩 히어로와 같은 스크림 색을 쓴다 */}
        <div
          className="from-brand-navy-deep/85 via-brand-navy-deep/80 to-brand-navy-deep/95 absolute inset-0 bg-gradient-to-b"
          aria-hidden="true"
        />

        <div className="relative container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Link
            href="/landing#features"
            className="text-brand-slate hover:text-white inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {page.backLabel}
          </Link>

          <div className="mt-8 max-w-3xl">
            <p className="text-brand-slate flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <span className="text-brand-orange" aria-hidden="true">◇</span>
              <span className="font-poppins">{page.eyebrow}</span>
            </p>

            <h1 className="mt-6 flex items-center gap-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              <page.icon className="text-brand-orange size-8 shrink-0 sm:size-10" aria-hidden="true" />
              {page.title}
            </h1>

            <p className="text-brand-slate mt-6 max-w-2xl text-base sm:text-lg">
              {page.lead}
            </p>
          </div>

          {/* 지표 — 스위스 조판의 격자 구획선을 stats-section 과 같은 방식으로 쓴다 */}
          {page.stats.length > 0 ? (
            <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/20 pt-8">
              {page.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-poppins tabular-figures text-2xl font-semibold text-white sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dt className="text-brand-slate mt-1 text-xs">{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      {/* ── 핵심 역량 (SEA 전용) ───────────────────────────────────── */}
      {page.capabilities && page.capabilities.length > 0 ? (
        <section className="bg-muted/40 border-b py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              {page.capabilitiesTitle}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="bg-background flex items-start gap-3 rounded-lg border p-5"
                >
                  <Check className="text-brand-orange mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground text-sm">{capability}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── 스티키 스크롤 단계 ─────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              {page.stepsHeading}
            </h2>
            {page.stepsLead ? (
              <p className="text-muted-foreground mt-4 text-base">{page.stepsLead}</p>
            ) : null}
          </div>

          <StickyScrollReveal steps={page.steps} />
        </div>
      </section>

      {/* ── 리드타임 표 (EXPRESS 전용) ─────────────────────────────── */}
      {page.leadTimes ? (
        <section className="bg-muted/40 border-y py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              {page.leadTimes.title}
            </h2>
            {/*
              좁은 화면에서 표가 페이지를 밀지 않도록 표만 따로 가로 스크롤한다.
              열이 다섯 개라 모바일에서는 접히지 않고 넘친다.
            */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    {page.leadTimes.columns.map((column, index) => (
                      <th
                        key={column}
                        scope="col"
                        className={`text-muted-foreground py-3 text-xs font-semibold tracking-wide uppercase ${
                          index === 0 ? "text-start" : "text-end"
                        }`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.leadTimes.rows.map((row) => (
                    <tr key={row[0]} className="border-b last:border-b-0">
                      {row.map((cell, index) => (
                        <td
                          key={index}
                          className={
                            index === 0
                              ? "text-foreground py-4 pe-6 font-medium"
                              : index === row.length - 1
                                ? "font-poppins tabular-figures text-foreground py-4 text-end font-semibold"
                                : "font-poppins tabular-figures text-muted-foreground py-4 text-end"
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 문의 CTA ───────────────────────────────────────────────── */}
      <section className="bg-brand-navy-deep py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {page.cta.title}
            </h2>
            <p className="text-brand-slate mt-4 text-base">{page.cta.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {/*
                문의 폼은 랜딩 하단에 하나뿐이다 (cta-band 등 다른 CTA 도 전부
                여기로 보낸다). 새 폼을 만들지 않고 같은 자리로 보낸다.
              */}
              <Button variant="brand" asChild className="h-11">
                <Link href="/landing#contact">
                  {page.cta.primary}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-11 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/tracking">{page.cta.secondary}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
