import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { RootDocument, rootMetadata } from '@/components/layout/root-document'
import { routing } from '@/i18n/routing'

export const metadata = rootMetadata

/**
 * 공개 페이지 루트 레이아웃
 *
 * 대시보드(/dashboard)와 인증 화면은 내부용이라 이 레이아웃 밖에 그대로 있고,
 * 한국어로만 제공한다. middleware 에서도 제외된다.
 *
 * <html lang> 은 여기서 정한다. 로케일을 아는 가장 바깥 레이아웃이 이곳이라서다.
 * params 에서 읽으므로 generateStaticParams 로 만든 정적 프리렌더가 그대로 유지된다.
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

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </RootDocument>
  )
}
