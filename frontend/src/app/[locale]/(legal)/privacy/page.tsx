import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { LegalArticle } from '@/components/legal/legal-article'
import { getLegalDocuments } from '@/config/legal-content'
import { routing, type Locale } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const { privacy } = getLegalDocuments(locale as Locale)
  return { title: `${privacy.title} - JSL Logistics`, description: privacy.description }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { privacy, terms } = getLegalDocuments(locale as Locale)
  return (
    <LegalArticle
      document={privacy}
      otherDocuments={[{ slug: terms.slug, title: terms.title }]}
    />
  )
}
