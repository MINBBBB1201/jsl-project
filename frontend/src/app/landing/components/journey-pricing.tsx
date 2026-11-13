"use client"

import { useContent } from "@/config/use-content"
import { SceneHeader, TwoToneHeading, MonoLabel, OrangeArrowLink, TextLink } from "./journey-kit"

/**
 * Engagement types as one comparison sheet instead of three pricing cards. Columns share
 * the same rows (scope, terms, what is included, next step), so the plans read side by
 * side like a rate sheet. The recommended column is marked by a rule, not a raised card.
 */
export function JourneyPricing({ index, total }: { index: number; total: number }) {
  const { plans } = useContent()
  return <section id="pricing" className="jk-section jk-paper" aria-labelledby="jk-pricing-title">
    <SceneHeader path={plans.badge.toUpperCase()} index={index} total={total} />
    <div className="jk-section-intro">
      <TwoToneHeading lead={<span id="jk-pricing-title">{plans.title}</span>} />
      <p className="jk-lead">{plans.description}</p>
    </div>
    <div className="jk-sheet" role="list">
      {plans.items.map((plan, i) => <article key={plan.name} role="listitem" className={plan.popular ? "jk-sheet-col is-marked" : "jk-sheet-col"}>
        <MonoLabel>{String(i + 1).padStart(2, "0")}</MonoLabel>
        <h3>{plan.name}</h3>
        <p className="jk-sheet-scope">{plan.description}</p>
        <div className="jk-sheet-terms"><strong>{plan.priceLabel}</strong><span>{plan.priceCaption}</span></div>
        <ul>
          {plan.includesPrevious ? <li className="jk-sheet-inherit">{plan.includesPrevious}</li> : null}
          {plan.features.map(feature => <li key={feature}>{feature}</li>)}
        </ul>
        {plan.popular ? <OrangeArrowLink href="#contact">{plan.cta}</OrangeArrowLink> : <TextLink href="#contact">{plan.cta}</TextLink>}
      </article>)}
    </div>
    <p className="jk-note-line">{plans.note} <TextLink href={plans.noteCta.href}>{plans.noteCta.label}</TextLink></p>
  </section>
}
