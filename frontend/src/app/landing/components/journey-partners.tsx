"use client"

import Image from "next/image"
import { useContent } from "@/config/use-content"
import { SceneHeader, TwoToneHeading } from "./journey-kit"

export function JourneyPartners() {
  const { partners } = useContent()

  return <section className="jk-section jk-sea" aria-labelledby="jk-partners-title">
    <SceneHeader path={partners.title.toUpperCase()} />
    <div className="jk-split">
      <div className="jk-section-intro">
        <TwoToneHeading lead={<span id="jk-partners-title">{partners.title}</span>} />
        <p className="jk-lead">{partners.description}</p>
      </div>
      <div>
        {partners.groups.map(group => <div key={group.label} className="grid gap-6 border-t border-[var(--jk-sea-rule)] py-7 sm:grid-cols-[minmax(9rem,.55fr)_minmax(0,1.45fr)] sm:gap-8">
          <h3 className="jk-mono text-[var(--jk-ink-2)]">{group.label}</h3>
          {/* Logos keep their own proportions under a shared height cap instead of fixed cells. */}
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
            {group.items.map(item => <li key={item.name} className="flex min-h-12 items-center">
              {item.logo ? <span className={item.logo.patch ? "inline-flex items-center justify-center rounded-[3px] bg-white px-2.5 py-1.5" : "inline-flex items-center justify-center"}>
                <Image src={item.logo.src} alt={item.name} width={item.logo.width} height={item.logo.height} unoptimized className="h-9 w-auto max-w-[180px] object-contain" />
              </span> : <span>{item.name}</span>}
            </li>)}
          </ul>
        </div>)}
      </div>
    </div>
    <p className="jk-note">{partners.note}</p>
  </section>
}
