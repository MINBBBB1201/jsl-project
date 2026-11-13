"use client"

import { useContent } from "@/config/use-content"
import { SceneHeader, TwoToneHeading, MonoLabel, OrangeArrowLink, TextLink } from "./journey-kit"

/**
 * Value-added services as a numbered operations list. It follows the transport sequence on
 * the same white ground, so the services read as the next leg of the journey rather than a
 * separate dark card block.
 */
export function JourneyValueAdded({ index, total }: { index: number; total: number }) {
  const { services } = useContent()
  const { valueAdded } = services
  return <section id="features-value-added" className="jk-section jk-paper" aria-labelledby="jk-value-title">
    <SceneHeader path="VALUE-ADDED SERVICES" index={index} total={total} />
    <div className="jk-split">
      <div className="jk-section-intro">
        <TwoToneHeading lead={<span id="jk-value-title">{valueAdded.title}</span>} />
        <p className="jk-lead">{valueAdded.description}</p>
        <div className="jk-actions">
          <OrangeArrowLink href={valueAdded.primaryCta.href}>{valueAdded.primaryCta.label}</OrangeArrowLink>
          <TextLink href={valueAdded.secondaryCta.href}>{valueAdded.secondaryCta.label}</TextLink>
        </div>
      </div>
      <ol className="jk-rows jk-rows-compact">
        {valueAdded.items.map((item, i) => <li key={item.title}>
          <MonoLabel>{String(i + 1).padStart(2, "0")}</MonoLabel>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </li>)}
      </ol>
    </div>
  </section>
}
