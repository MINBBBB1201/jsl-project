"use client"

import { useState } from "react"
import { LandingNavbar } from "./components/navbar"
import { FeaturesSection } from "./components/features-section"
import { AboutSection } from "./components/about-section"
import { CertificationsBar } from "./components/certifications-bar"
import { ConsultingSection } from "./components/consulting-section"
import { NetworkSection } from "./components/network-section"
import { PricingSection } from "./components/pricing-section"
import { OpsStatusSection } from "./components/ops-status-section"
import { StatsSection } from "./components/stats-section"
import { FaqSection } from "./components/faq-section"
import { CTASection } from "./components/cta-section"
import { ContactSection } from "./components/contact-section"
import { LandingFooter } from "./components/footer"
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from "./components/landing-theme-customizer"
import { JourneyIntro, JourneyYard, JourneyOcean, JourneyPartners, JourneyCta, JourneyPlane, JourneyProgressRail, useJourneyMotion } from "./components/journey-sections"
import { IndustrialJourney } from "./components/industrial-journey"
import { JourneyHeroMotion } from "./components/journey-hero-motion"
import "./journey.css"

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
      <IndustrialJourney />
      <div className="journey-services journey-dark"><FeaturesSection onlyValueAdded /></div>
      <JourneyOcean />
      <div className="journey-network journey-editorial"><NetworkSection /></div>
      <JourneyPlane />
      <div className="journey-about journey-editorial"><AboutSection /><CertificationsBar /></div>
      <JourneyPartners />
      <div className="journey-consulting journey-editorial"><ConsultingSection /></div>
      <div className="journey-operations journey-dark journey-editorial"><OpsStatusSection /><StatsSection /></div>
      <div className="journey-pricing journey-editorial"><PricingSection /></div>
      <div className="journey-faq journey-editorial"><FaqSection /></div>
      <JourneyCta />
      <div className="journey-contact journey-editorial"><CTASection /><ContactSection /></div>
    </main>
    <div className="journey-footer"><LandingFooter /><div className="journey-wordmark" aria-hidden="true">JSL LOGISTICS</div></div>
    <LandingThemeCustomizerTrigger onClick={() => setCustomizerOpen(true)} />
    <LandingThemeCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen}/>
  </div>
}

