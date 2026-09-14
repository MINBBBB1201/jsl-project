import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { DocumentGeneratorClient } from './document-generator-client'

/**
 * 무역서류 생성기 (1단계 — 공개 preview).
 *
 * 푸터 고객지원 열에서 링크된다 (config/use-content.ts). hs-code · tracking ·
 * container-planner 와 같은 자리다 — 넷 다 로그인 없이 쓰는 자가 도구다.
 *
 * 이 단계는 방문자가 직접 입력한 값으로만 서류를 만든다. 실제 화물(Shipment)
 * 기록과 연결하는 로그인 전용 버전은 2단계에서 /dashboard 안에 따로 만든다.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'documentGenerator' })
  return {
    title: `${t('title')} - JSL Logistics`,
    description: t('subtitle'),
  }
}

export default async function DocumentGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <DocumentGeneratorClient />
}
