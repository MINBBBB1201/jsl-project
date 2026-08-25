"use client"

import { ContainerViewer } from '@/components/container-planner/container-viewer'

import { DEMO_CONTAINER, DEMO_PLAN } from './demo-cargo'

/**
 * 컨테이너 적재 계산기 — 2단계 스캐폴드.
 *
 * 폼도 상태도 없다. 1단계 정상 시나리오를 그대로 넣어 뷰어가 제대로 그리는지만
 * 확인한다. 3단계에서 이 자리에 화물 입력 폼과 결과 패널이 들어온다.
 *
 * ⚠️ PublicPageShell 을 여기서 다시 감싸지 말 것. (public)/layout.tsx 가 이미
 *    감싸고 있어서, 한 번 더 쓰면 헤더와 푸터가 두 벌씩 렌더된다.
 */
export function ContainerPlannerClient() {
  const plan = DEMO_PLAN

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          컨테이너 적재 계산기
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {DEMO_CONTAINER.label} · 화물 {plan.placed.length}개 적재 · 적재율{' '}
          <span className="tabular-nums">{plan.volumeUtilizationPercent}%</span>
        </p>
        {/* 개발 중임을 화면에서도 알 수 있게. 3단계에서 지운다 */}
        <p className="mt-3 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          개발 중인 화면입니다. 지금은 예시 화물이 고정으로 들어가 있고, 화물 입력
          폼은 다음 단계에서 추가됩니다.
        </p>
      </header>

      <ContainerViewer
        container={DEMO_CONTAINER}
        plan={plan}
        label={`${DEMO_CONTAINER.label} 컨테이너에 화물 ${plan.placed.length}개가 적재된 3차원 미리보기. 드래그로 회전, 스크롤로 확대할 수 있습니다.`}
      />
    </div>
  )
}
