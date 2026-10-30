"use client"

import { useState } from "react"
import { LandingNavbar } from "./components/navbar"
import { FeaturesSection } from "./components/features-section"
import { ApprovedCompanySection } from "./components/approved-company-section"
import { CertificationsBar } from "./components/certifications-bar"
import { ConsultingSection } from "./components/consulting-section"
import { ApprovedNetworkSection } from "./components/approved-network-section"
import { PricingSection } from "./components/pricing-section"
import { OpsStatusSection } from "./components/ops-status-section"
import { StatsSection } from "./components/stats-section"
import { FaqSection } from "./components/faq-section"
import { CTASection } from "./components/cta-section"
import { ContactSection } from "./components/contact-section"
import { LandingFooter } from "./components/footer"
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from "./components/landing-theme-customizer"
import { JourneyIntro, JourneyYard, JourneyOcean, JourneyPartners, JourneyCta, JourneyPlane, JourneyProgressRail, useJourneyMotion } from "./components/journey-sections"
import { MultimodalJourney } from "./components/multimodal-journey"
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
      <JourneyIntro index={1} total={11} />
      <JourneyYard />
      <MultimodalJourney />
      <div className="journey-services journey-dark"><FeaturesSection onlyValueAdded /></div>
      <JourneyOcean />
      <ApprovedNetworkSection />
      <JourneyPlane />
      <ApprovedCompanySection previewMedia={process.env.NODE_ENV === "development" ? "/assembly-review/connected-scroll/media/company-reference-9s.jpg" : undefined} />
      {process.env.NODE_ENV === "development" && <p className="px-6 py-3 text-sm">회사소개 이미지는 구도 확인용 외부 참고 매체이며, JSL 현장 또는 운영 배포용 자산이 아닙니다.</p>}
      <div className="journey-about journey-editorial"><CertificationsBar /></div>
      <JourneyPartners />
      <div className="journey-consulting journey-editorial"><ConsultingSection /></div>
      <div className="journey-operations journey-dark journey-editorial"><OpsStatusSection /><StatsSection /></div>
      <div className="journey-pricing journey-editorial"><PricingSection /></div>
      <div className="journey-faq journey-editorial"><FaqSection /></div>
      <JourneyCta />
      <div className="journey-contact journey-editorial"><CTASection /><ContactSection /></div>
    </main>
    <div className="journey-footer"><LandingFooter logoSurface="light" /><div className="journey-wordmark" aria-hidden="true">JSL LOGISTICS</div></div>
    <LandingThemeCustomizerTrigger onClick={() => setCustomizerOpen(true)} />
    <LandingThemeCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen}/>
  </div>
}

