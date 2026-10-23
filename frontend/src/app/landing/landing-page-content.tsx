"use client"

import { useState } from "react"
import { LandingNavbar } from "./components/navbar"
import { AboutSection } from "./components/about-section"
import { CertificationsBar } from "./components/certifications-bar"
import { ConsultingSection } from "./components/consulting-section"
import { OpsStatusSection } from "./components/ops-status-section"
import { StatsSection } from "./components/stats-section"
import { FaqSection } from "./components/faq-section"
import { CTASection } from "./components/cta-section"
import { ContactSection } from "./components/contact-section"
import { LandingFooter } from "./components/footer"
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from "./components/landing-theme-customizer"
import { JourneyIntro, JourneyYard, JourneyPartners, JourneyCta, JourneyProgressRail, useJourneyMotion } from "./components/journey-sections"
import { MultimodalJourney } from "./components/multimodal-journey"
import { JourneyHeroMotion } from "./components/journey-hero-motion"
import { JourneyValueAdded } from "./components/journey-value-added"
import { JourneyNetwork } from "./components/journey-network"
import { JourneyPricing } from "./components/journey-pricing"
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
      <JourneyYard />
      <MultimodalJourney />
      {/* The sequence already shows ocean and air, so the separate ocean and plane scenes are gone. */}
      <JourneyValueAdded index={4} total={STOPS} />
      <JourneyNetwork index={5} total={STOPS} />
      <div className="journey-about journey-editorial"><AboutSection /><CertificationsBar /></div>
      <JourneyPartners />
      <div className="journey-consulting journey-editorial"><ConsultingSection /></div>
      <div className="journey-operations journey-dark journey-editorial"><OpsStatusSection /><StatsSection /></div>
      <JourneyPricing index={10} total={STOPS} />
      <div className="journey-faq journey-editorial"><FaqSection /></div>
      <JourneyCta />
      <div className="journey-contact journey-editorial"><CTASection /><ContactSection /></div>
    </main>
    <div className="journey-footer"><LandingFooter /><div className="journey-wordmark" aria-hidden="true">JSL LOGISTICS</div></div>
    <LandingThemeCustomizerTrigger onClick={() => setCustomizerOpen(true)} />
    <LandingThemeCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen}/>
  </div>
}

