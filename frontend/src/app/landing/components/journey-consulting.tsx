"use client"

import { useContent } from "@/config/use-content"
import { MonoLabel, OrangeArrowLink, SceneHeader, TextLink, TwoToneHeading } from "./journey-kit"

export function JourneyConsulting({ index, total }: { index: number; total: number }) {
  const { consulting } = useContent()

  return <section id="consulting" className="jk-section jk-paper-2" aria-labelledby="jk-consulting-title">
    {/* consulting.badge is a "New" tag, not a section name. */}
    <SceneHeader path="CONSULTING" index={index} total={total} />
    <div className="jk-section-intro">
      <TwoToneHeading lead={<span id="jk-consulting-title">{consulting.title}</span>} />
      <p className="jk-lead">{consulting.description}</p>
      <div className="jk-actions">
        <OrangeArrowLink href={consulting.detailCta.href}>{consulting.detailCta.label}</OrangeArrowLink>
        <TextLink href={consulting.primaryCta.href}>{consulting.primaryCta.label}</TextLink>
      </div>
    </div>
    <div className="mt-16 grid grid-cols-1 gap-12 border-t border-[var(--jk-rule)] pt-2 lg:grid-cols-2 lg:gap-10">
      {consulting.groups.map(group => <article key={group.id} id={group.id} className="min-w-0">
        <div className="flex min-h-20 items-baseline justify-between gap-4 border-b border-[var(--jk-rule)] py-5">
          <h3 className="text-2xl font-semibold tracking-tight"><TextLink href={`/consulting#${group.id}`}>{group.audience}</TextLink></h3>
        </div>
        <p className="jk-lead mb-6 mt-5">{group.description}</p>
        <ol>
          {group.items.map((item, i) => <li key={item.title} className="grid grid-cols-[36px_24px_minmax(0,1fr)] gap-x-4 border-t border-[var(--jk-rule)] py-5 last:border-b">
            <MonoLabel className="jk-muted">{String(i + 1).padStart(2, "0")}</MonoLabel>
            <item.icon className="mt-0.5 size-5" aria-hidden="true" />
            <div className="min-w-0">
              <h4 className="font-semibold leading-snug">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--jk-ink-2)]">{item.description}</p>
            </div>
          </li>)}
        </ol>
      </article>)}
    </div>
  </section>
}
