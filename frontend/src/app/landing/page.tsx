import type { Metadata } from 'next'
import { LandingPageContent } from './landing-page-content'

// Metadata for the landing page
export const metadata: Metadata = {
  title: 'JSL Logistics - 물류 운영 관리 시스템',
  description: 'JSL Logistics 물류 운영 관리 시스템. 화물 처리, 배송 추적, 운영 지표를 한 곳에서 관리하세요.',
  keywords: ['물류', '배송 관리', 'logistics', 'JSL', '운영 대시보드'],
  openGraph: {
    title: 'JSL Logistics - 물류 운영 관리 시스템',
    description: 'JSL Logistics 물류 운영 관리 시스템. 화물 처리, 배송 추적, 운영 지표를 한 곳에서 관리하세요.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSL Logistics - 물류 운영 관리 시스템',
    description: 'JSL Logistics 물류 운영 관리 시스템. 화물 처리, 배송 추적, 운영 지표를 한 곳에서 관리하세요.',
  },
}

export default function LandingPage() {
  return <LandingPageContent />
}
