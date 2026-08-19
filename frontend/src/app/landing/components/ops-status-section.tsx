"use client"

import { HeroOpsPanel } from "./hero-ops-panel"
import { usePublicSummary } from "./use-public-summary"

/**
 * 운영 현황 섹션
 *
 * 히어로가 사진 벤토그리드로 바뀌면서 이 패널이 있던 오른쪽 칸이 없어졌다.
 * 지우지 않고 히어로 바로 아래 독립 섹션으로 내렸다 — 실제 API 에서 읽어 온
 * 숫자를 첫 화면 근처에 두는 것은 그대로 지키되, 사진과 자리를 다투지 않게 했다.
 *
 * 머리말을 따로 달지 않는다. 패널이 이미 제목("운영 현황")과 각 수치의 라벨,
 * 그리고 이 숫자가 어디서 왔는지에 대한 주석까지 스스로 달고 있어서, 섹션
 * 제목을 덧붙이면 같은 말이 두 번 나온다. 폭을 컨테이너에 꽉 채우면 네 개
 * 수치가 한 줄로 늘어서 상태 표시줄처럼 읽힌다.
 */
export function OpsStatusSection() {
  const { data, isLoading, isError } = usePublicSummary()

  /*
    조회에 실패하면 섹션째 렌더하지 않는다.
    패널만 감추면 상하 패딩 97px 이 빈 흰 띠로 남는데, 이 섹션이 히어로 바로
    아래라 첫 화면 근처에 정체 모를 여백이 생긴다. 접을 거면 통째로 접어야 한다.
  */
  if (isError) return null

  return (
    <section className="border-b bg-background py-10 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <HeroOpsPanel data={data} isLoading={isLoading} />
      </div>
    </section>
  )
}
