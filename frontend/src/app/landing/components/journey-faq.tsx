"use client"

import { useContent } from "@/config/use-content"
import { SceneHeader, TwoToneHeading, MonoLabel, OrangeArrowLink } from "./journey-kit"

/**
 * Questions as a numbered log. Native <details> gives keyboard and screen-reader behaviour
 * without script, and every answer stays in the document for search and find-in-page.
 */
export function JourneyFaq({ index, total }: { index: number; total: number }) {
  const { faq } = useContent()
  return <section id="faq" className="jk-section jk-paper-2" aria-labelledby="jk-faq-title">
    <SceneHeader path={String(faq.badge).toUpperCase()} index={index} total={total} />
    <div className="jk-split">
      <div className="jk-section-intro">
        <TwoToneHeading lead={<span id="jk-faq-title">{faq.title}</span>} />
        <p className="jk-lead">{faq.description}</p>
        <p className="jk-lead">{faq.contactPrompt}</p>
        <div className="jk-actions"><OrangeArrowLink href={faq.contactCta.href}>{faq.contactCta.label}</OrangeArrowLink></div>
      </div>
      <div className="jk-log">
        {faq.items.map((item, i) => <details key={item.value} name="jsl-faq">
          <summary><MonoLabel>{String(i + 1).padStart(2, "0")}</MonoLabel><span>{item.question}</span><span className="jk-log-mark" aria-hidden="true" /></summary>
          <p>{item.answer}</p>
        </details>)}
      </div>
    </div>
  </section>
}
