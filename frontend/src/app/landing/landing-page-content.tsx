"use client"

import React from 'react'
import { LandingNavbar } from './components/navbar'
import { RedesignHero } from './components/redesign-hero'
import { RedesignWhatWeDo } from './components/redesign-what-we-do'
import { RedesignWhyJsl } from './components/redesign-why-jsl'
import { OpsStatusSection } from './components/ops-status-section'
import { StatsSection } from './components/stats-section'
import { PartnersBar } from './components/partners-bar'
import { CertificationsBar } from './components/certifications-bar'
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
        {/*
          ── 랜딩 리디자인 1단계 (구조/애니메이션만, 브랜딩은 2단계) ──────
          HeroSection 을 RedesignHero 가 대체하고, RedesignWhatWeDo ·
          RedesignWhyJsl 이 아래에 새로 붙는다. AboutSection 과 FeaturesSection
          은 그대로 남는다 — 셋은 역할이 다르다 (티저 / 통계·인증 요약 /
          회사 상세 소개 / 서비스 상세).
          hero-section.tsx 는 지우지 않고 남겨 뒀다 (LogoCarousel 등과 같은
          방식). 되돌리려면 import 와 이 자리만 원래대로 돌리면 된다.
        */}
        <RedesignHero />
        <OpsStatusSection />
        <StatsSection />
        <PartnersBar />
        {/*
          다크 블록(통계 + 파트너)이 끝나는 자리. 규모 → 협력사 → 인증까지가
          하나의 신뢰 서사라 여기서 밝은 톤으로 이어받는다.
          자리를 옮길 때는 명암 리듬을 먼저 확인할 것 (partners-bar.tsx 주석 참고).
        */}
        <CertificationsBar />
        {/*
          What We Do(밝음) → Why JSL(어두움) → About(밝음) → Features(밝음).
          위쪽 다크 블록(통계+파트너바)과 떨어져 있어 어두운 띠가 연달아 붙지
          않고, 기존 교차 리듬에 하나가 더 끼는 형태다.
        */}
        <RedesignWhatWeDo />
        <RedesignWhyJsl />
        {/*
          AboutSection 은 원래 자리(FeaturesSection 바로 앞)로 되돌렸다.
          Why JSL 스플릿과 역할이 다르다 — 저쪽은 통계·인증 요약이고 여기는
          회사 상세 소개다. 새로 만든 두 섹션이 위쪽 빈자리를 차지했을 뿐,
          About 과 Features 의 이웃 관계는 그대로다.
        */}
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
