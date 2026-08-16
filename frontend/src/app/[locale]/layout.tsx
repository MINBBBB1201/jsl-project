import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'

/**
 * 공개 페이지 로케일 레이아웃
 *
 * 대시보드(/dashboard)와 인증 화면은 내부용이라 이 레이아웃 밖에 그대로 있고,
 * 한국어로만 제공한다. middleware 에서도 제외된다.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return <NextIntlClientProvider>{children}</NextIntlClientProvider>
}
