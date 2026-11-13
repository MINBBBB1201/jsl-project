"use client"

import { useContent } from "@/config/use-content"
import { SceneHeader, TwoToneHeading, MonoLabel, OrangeArrowLink, TextLink } from "./journey-kit"

/**
 * One closing call before the contact form, replacing the two stacked CTA bands. The band's
 * headline leads; the longer CTA's description, actions and highlights follow as a manifest.
 */
export function JourneyClosing({ index, total }: { index: number; total: number }) {
  const { ctaBand, cta } = useContent()
  return <section className="jk-section jk-sea jk-closing" aria-labelledby="jk-closing-title">
    <SceneHeader path="NEXT SHIPMENT" index={index} total={total} />
    <TwoToneHeading lead={<span id="jk-closing-title">{ctaBand.title}</span>} className="jk-closing-heading" />
    <p className="jk-lead">{cta.description}</p>
    <div className="jk-actions">
      <OrangeArrowLink href={cta.primaryCta.href}>{cta.primaryCta.label}</OrangeArrowLink>
      <TextLink href={cta.secondaryCta.href}>{cta.secondaryCta.label}</TextLink>
    </div>
    <ul className="jk-inline-list">
      {[...cta.highlights, ...cta.trustIndicators].map((item, i) => <li key={`${i}-${item}`}><MonoLabel>{item}</MonoLabel></li>)}
    </ul>
  </section>
}
