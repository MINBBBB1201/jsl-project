import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { ContainerPlannerClient } from './container-planner-client'

/**
 * 3D 컨테이너 적재 계산기 (2단계 — 뷰어만).
 *
 * ⚠️ 아직 어느 네비게이션에도 링크하지 않는다. 화물 입력 폼이 붙는 3단계까지는
 *    직접 URL 로만 들어온다.
 *
 * ⚠️ 제목·설명이 하드코딩이다. hs-code 처럼 getTranslations 로 가야 하지만,
 *    화면 문구가 3단계에서 통째로 바뀔 예정이라 지금 4개 로케일에 번역 키를
 *    넣어 두면 곧바로 다시 뜯게 된다. 폼과 결과 패널이 확정된 뒤 한 번에 정리한다.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '컨테이너 적재 계산기 - JSL Logistics',
    description:
      '화물 규격과 수량으로 컨테이너 적재 계획을 계산하고 3D 로 확인합니다.',
    // 완성 전까지 검색 노출을 막는다
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
