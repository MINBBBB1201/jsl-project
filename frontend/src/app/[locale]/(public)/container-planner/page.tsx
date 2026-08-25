import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { ContainerPlannerClient } from './container-planner-client'

/**
 * 3D 컨테이너 적재 계산기.
 *
 * 푸터 고객지원 열에서 링크된다 (config/use-content.ts). hs-code · tracking 과
 * 같은 자리다 — 셋 다 로그인 없이 쓰는 자가 조회 도구라 한곳에 모아 둔다.
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
    /*
      2·3단계에서는 robots 를 noindex 로 막아 뒀다. 어디에도 링크되지 않은
      미완성 화면이 검색에 먼저 잡히는 것을 막으려던 것인데, 이제 푸터에서
      링크되므로 걷어낸다. 링크는 걸어 두고 noindex 로 남겨 두면 크롤러에게
      앞뒤가 안 맞는 신호를 보내게 된다.
    */
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
