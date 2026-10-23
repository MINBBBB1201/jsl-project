"use client"

import { useState } from "react"
import { LandingNavbar } from "./components/navbar"
import { AboutSection } from "./components/about-section"
import { CertificationsBar } from "./components/certifications-bar"
import { ConsultingSection } from "./components/consulting-section"
import { ContactSection } from "./components/contact-section"
import { LandingFooter } from "./components/footer"
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from "./components/landing-theme-customizer"
import { JourneyIntro, JourneyPartners, JourneyProgressRail, useJourneyMotion } from "./components/journey-sections"
import { MultimodalJourney } from "./components/multimodal-journey"
import { JourneyHeroMotion } from "./components/journey-hero-motion"
import { JourneyValueAdded } from "./components/journey-value-added"
import { JourneyNetwork } from "./components/journey-network"
import { JourneyPricing } from "./components/journey-pricing"
import { JourneyOperations } from "./components/journey-operations"
import { JourneyFaq } from "./components/journey-faq"
import { JourneyClosing } from "./components/journey-closing"
import { JourneyLeadIn } from "./components/journey-lead-in"
import "./journey.css"
import "./components/journey-kit.css"

/** Numbered stops after the hero; the transport sequence carries its own 01–04 counter. */
const STOPS = 12

/** Visual composition only. API clients, translations, forms and internal layouts stay independent. */
export function LandingPageContent() {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const ref = useJourneyMotion()
  return <div className="journey" ref={ref}>
    <LandingNavbar />
    <JourneyProgressRail />
    <main>
      <JourneyHeroMotion />
      <JourneyIntro />
      {/* Replaces the stock yard scene; leads straight into the pinned sequence. */}
      <JourneyLeadIn index={2} total={STOPS} />
      <MultimodalJourney />
      {/* The sequence already shows ocean and air, so the separate ocean and plane scenes are gone. */}
      <JourneyValueAdded index={4} total={STOPS} />
      <JourneyNetwork index={5} total={STOPS} />
      <div className="journey-about journey-editorial"><AboutSection /><CertificationsBar /></div>
      <JourneyPartners />
      <div className="journey-consulting journey-editorial"><ConsultingSection /></div>
      <JourneyOperations index={9} total={STOPS} />
      <JourneyPricing index={10} total={STOPS} />
      <JourneyFaq index={11} total={STOPS} />
      {/* One closing call replaces the two stacked CTA bands; the form itself is unchanged. */}
      <JourneyClosing index={12} total={STOPS} />
      <div className="journey-contact journey-editorial"><ContactSection /></div>
    </main>
    <div className="journey-footer"><LandingFooter /><div className="journey-wordmark" aria-hidden="true">JSL LOGISTICS</div></div>
    <LandingThemeCustomizerTrigger onClick={() => setCustomizerOpen(true)} />
    <LandingThemeCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen}/>
  </div>
}

