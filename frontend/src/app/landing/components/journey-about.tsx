"use client"

import { useContent } from "@/config/use-content"
import { MonoLabel, OrangeArrowLink, SceneHeader, TextLink, TwoToneHeading } from "./journey-kit"

export function JourneyAbout({ index, total }: { index: number; total: number }) {
  const { about, certifications } = useContent()

  return <section id="about" className="jk-section jk-paper" aria-labelledby="jk-about-title">
    <SceneHeader path={about.badge.toUpperCase()} index={index} total={total} />
    <div className="jk-network-grid">
      <div className="jk-section-intro">
        <TwoToneHeading lead={<span id="jk-about-title">{about.title}</span>} />
        <p className="jk-lead">{about.description}</p>
        <div className="jk-actions">
          <OrangeArrowLink href={about.primaryCta.href}>{about.primaryCta.label}</OrangeArrowLink>
          <TextLink href={about.secondaryCta.href}>{about.secondaryCta.label}</TextLink>
        </div>
        <p className="jk-note">{about.ctaText}</p>
      </div>
      <ol className="jk-rows jk-rows-compact mt-0">
        {about.values.map((value, i) => <li key={value.title}>
          <MonoLabel>{String(i + 1).padStart(2, "0")}</MonoLabel>
          <h3 className="flex items-center gap-4"><value.icon className="size-5 shrink-0" aria-hidden="true" />{value.title}</h3>
          <p>{value.description}</p>
        </li>)}
      </ol>
    </div>
    <section aria-label={certifications.ariaLabel} className="jk-paper-2 mt-20 border-y border-[var(--jk-rule)] py-2">
      <ul className="grid grid-cols-2 divide-x divide-y divide-[var(--jk-rule)] lg:grid-cols-4 lg:divide-y-0">
        {certifications.items.map(item => <li key={item.title} className="flex min-w-0 flex-col gap-2 px-4 py-5 sm:px-6">
          <item.icon className="size-5" aria-hidden="true" />
          <p className="text-sm font-semibold leading-snug">{item.title}</p>
          <p className="jk-mono jk-muted tabular-nums break-words">{item.subtitle}</p>
        </li>)}
      </ul>
    </section>
  </section>
}
