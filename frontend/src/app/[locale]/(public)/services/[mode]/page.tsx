import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { SERVICE_MODES, isServiceMode } from '@/config/service-modes'
import { ServiceModeClient } from './service-mode-client'

/**
 * 운송모드 상세 페이지 — /services/air · sea · truck · rail · express
 *
 * 다섯 페이지가 같은 구조(히어로 + 지표 + 스티키 스크롤 + CTA)라 라우트를 하나만
 * 두고 [mode] 로 받는다. 로케일 4개 × 모드 5개 = 20개가 빌드 때 전부 프리렌더된다.
 *
 * 콘텐츠는 예전에 랜딩 아코디언(features-section)에 들어 있던 것이다. 아코디언에는
 * 두 문장 요약만 남기고 전부 이쪽으로 옮겼다 — 같은 내용을 두 곳에 두지 않는다.
 */
/**
 * 아래 generateStaticParams 가 만든 20개 밖의 경로는 라우터가 곧바로 404 로 잘라낸다.
 *
 * 이걸 끄면(기본값 true) /services/ship 같은 오타 경로가 [mode] 에 매치돼 페이지가
 * 실행되고, 그 안에서 notFound() 를 불러도 응답이 200 OK 로 나갔다 — 본문만 404
 * 화면이고 상태 코드는 성공이라 크롤러와 모니터링이 정상 페이지로 집계한다.
 * 유효한 모드는 다섯 개뿐이고 빌드 때 전부 알 수 있으므로 라우터에게 맡긴다.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SERVICE_MODES.map((mode) => ({ locale, mode }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; mode: string }>
}): Promise<Metadata> {
  const { locale, mode } = await params
  if (!isServiceMode(mode)) return {}

  const code = mode.toUpperCase()
  const t = await getTranslations({ locale, namespace: 'services' })

  return {
    title: `${t(`modes.${code}.title`)} - JSL Logistics`,
    description: t(`modes.${code}.summary`),
  }
}

export default async function ServiceModePage({
  params,
}: {
  params: Promise<{ locale: string; mode: string }>
}) {
  const { locale, mode } = await params

  /*
    dynamicParams=false 라 여기까지 온 mode 는 이미 다섯 개 중 하나다.
    이 가드는 string 을 ServiceMode 로 좁히기 위한 것이고, 혹시 상수 목록과
    generateStaticParams 가 어긋나면 조용히 깨지는 대신 404 가 나가게 한다.
  */
  if (!isServiceMode(mode)) {
    notFound()
  }

  setRequestLocale(locale)

  return <ServiceModeClient mode={mode} />
}
