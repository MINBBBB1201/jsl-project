"use client"

import React from 'react'
import { LandingNavbar } from './components/navbar'
import { HeroSection } from './components/hero-section'
import { StatsSection } from './components/stats-section'
import { FeaturesSection } from './components/features-section'
import { ConsultingSection } from './components/consulting-section'
import { NetworkSection } from './components/network-section'
import { PricingSection } from './components/pricing-section'
import { CTASection } from './components/cta-section'
import { ContactSection } from './components/contact-section'
import { FaqSection } from './components/faq-section'
import { LandingFooter } from './components/footer'
import { LandingThemeCustomizer, LandingThemeCustomizerTrigger } from './components/landing-theme-customizer'
import { AboutSection } from './components/about-section'

export function LandingPageContent() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNavbar />

      {/*
        Main Content

        아래 섹션은 실제 콘텐츠가 없어 일시적으로 제외했습니다.
        컴포넌트 파일은 components/ 에 그대로 남아 있으니 콘텐츠 확보 후 다시 추가하면 됩니다.
          - LogoCarousel        : 실제 파트너사/고객사 로고 확보 후
          - TestimonialsSection : 실제 고객 후기 확보 후
          - BlogSection         : 실제 게시글 확보 후
      */}
      <main>
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <FeaturesSection />
        <ConsultingSection />
        <NetworkSection />
        <PricingSection />
        <FaqSection />
        <CTASection />
        <ContactSection />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Theme Customizer */}
      <LandingThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <LandingThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </div>
  )
}
