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
  const { terms } = getLegalDocuments(locale as Locale)
  return { title: `${terms.title} - JSL Logistics`, description: terms.description }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { privacy, terms } = getLegalDocuments(locale as Locale)
  return (
    <LegalArticle
      document={terms}
      otherDocuments={[{ slug: privacy.slug, title: privacy.title }]}
    />
  )
}
