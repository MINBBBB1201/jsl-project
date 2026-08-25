import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { ContainerPlannerClient } from './container-planner-client'

/**
 * 3D 컨테이너 적재 계산기.
 *
 * ⚠️ 아직 어느 네비게이션에도 링크하지 않는다. 최종 점검이 끝나는 다음 단계까지는
 *    직접 URL 로만 들어온다. 같은 이유로 색인도 막아 둔다.
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
  const t = await getTranslations({ locale, namespace: 'containerPlanner' })
  return {
    title: `${t('title')} - JSL Logistics`,
    description: t('subtitle'),
    robots: { index: false, follow: false },
  }
}

export default async function ContainerPlannerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ContainerPlannerClient />
}
