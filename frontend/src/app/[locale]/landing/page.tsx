import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LandingPageContent } from '@/app/landing/landing-page-content'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })

  const title = `JSL Logistics — ${t('headlineHighlight')}`
  return {
    title,
    description: t('subheadline'),
    openGraph: { title, description: t('subheadline'), type: 'website' },
    twitter: { card: 'summary_large_image', title, description: t('subheadline') },
  }
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LandingPageContent />
}
