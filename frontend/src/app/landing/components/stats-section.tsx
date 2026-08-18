"use client"

import { useContent } from '@/config/use-content'

/**
 * 회사 규모 지표 — 다크 풀블리드 띠
 *
 * ── 왜 다크인가 ────────────────────────────────────────────────────────
 * 이 페이지는 히어로부터 푸터까지 전부 흰 배경 + 1px 보더 카드였다. 구획선만
 * 으로 나눈 화면은 조용하지만, 열두 개 섹션이 같은 밝기로 이어지면 어디서
 * 이야기가 바뀌는지 알 수 없어 전체가 한 덩어리로 읽힌다 (대형 포워더 사이트가
 * 다크/라이트를 과감히 교차시키는 이유다).
 *
 * 그 리듬을 만들 자리로 통계를 골랐다. 숫자는 이 회사의 규모를 말하는 가장
 * 강한 카드라 배경째 뒤집어 무대를 만들 값어치가 있고, 위치가 첫 화면 바로
 * 아래라 한 번 스크롤에 명암 전환이 걸린다.
 *
 * ── 색 ─────────────────────────────────────────────────────────────────
 * 배경은 테마에 무관하게 고정인 --brand-navy-deep (#0c1a2e) 이다. --background
 * 계열을 쓰면 다크모드에서 띠가 배경에 녹아 리듬이 사라진다.
 * 숫자는 흰색, 라벨·설명은 --brand-slate (#8fa3bd) — 어두운 바탕에서 흰색을
 * 세 단계로 늘어놓으면 위계가 뭉개져서, 보조 정보는 아예 다른 색으로 뺀다.
 *
 * ── 명암 균형 ──────────────────────────────────────────────────────────
 * 바로 아래 파트너 마퀴는 밝은 bg-muted/30 이라 다크 띠가 연달아 붙지 않는다.
 * 이 섹션을 옮기거나 파트너 바 배경을 어둡게 바꿀 때는 둘이 맞닿지 않는지
 * 먼저 확인할 것.
 *
 * 구획선은 흰색 알파로 긋는다. --border 는 라이트 모드에서 밝은 회색이라
 * 이 배경 위에서는 보이지 않는다.
 */
export function StatsSection() {
  const { stats, monthlyVolumes, volumesHeading } = useContent()

  return (
    <section className="bg-brand-navy-deep py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          스위스 양식의 표 조판 — 카드 대신 격자 구획선으로 항목을 나눈다.
          셀마다 오른쪽·아래 선을 주고 바깥에 위·왼쪽 선을 둘러, 겹쳐서
          두꺼워지는 자리 없이 격자가 닫힌다.
        */}
        <div className="grid grid-cols-2 border-t border-l border-white/15 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="border-r border-b border-white/15 p-6 sm:p-8"
            >
              <stat.icon className="mb-4 size-5 text-brand-slate" aria-hidden="true" />
              {/*
                수치는 600, 라벨은 600, 설명은 400.

                한때 수치만 700 이었다. 한글 웹폰트가 없던 시절 "180억원" 의
                숫자(General Sans)와 한글(맑은 고딕)이 600 에서 서로 다른 굵기로
                그려지는 걸 피하려고 양쪽 다 진짜 Bold 가 있는 700 으로 올린
                우회였다. 이제 Pretendard 600 이 있어 원래 의도인 600 으로 되돌렸다.

                ⚠️ 500 은 여전히 쓰면 안 된다. Pretendard 를 400/600/700 3종만
                   싣기 때문에 CSS 가 500 을 요구하면 한글은 400 으로 떨어진다
                   (라틴은 General Sans 500 이 있어 진짜 Medium 이 나온다).
                   그래서 500 을 쓰면 라벨이 설명문과 굵기가 같아지고, 한 줄에
                   섞인 라틴만 굵어 보인다. 위계를 굵기로 주려면 600 을 쓸 것.
                   (자세한 사정은 lib/fonts.ts)
              */}
              <p className="tabular-figures text-3xl font-semibold text-white sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
              <p className="mt-1 text-sm text-brand-slate">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* 월간 처리 물동량 */}
        <div className="mt-10 md:mt-12">
          <div className="mb-6 max-w-xl">
            <h3 className="text-lg font-semibold text-white">{volumesHeading.title}</h3>
            <p className="mt-1 text-sm text-brand-slate">{volumesHeading.description}</p>
          </div>

          <div className="grid grid-cols-1 border-t border-l border-white/15 sm:grid-cols-3">
            {monthlyVolumes.map((volume) => (
              <div
                key={volume.mode}
                className="flex items-center gap-4 border-r border-b border-white/15 p-5"
              >
                <volume.icon
                  className="size-5 shrink-0 text-brand-slate"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  {/* 운송모드 코드는 라벨이라 대문자 + 넓은 자간으로 본문과 구분한다 */}
                  <p className="text-[11px] font-medium tracking-[0.14em] text-brand-slate">
                    {volume.mode}
                  </p>
                  <p className="tabular-figures text-xl font-semibold text-white">
                    {volume.value}
                    <span className="ms-1 text-sm font-normal text-brand-slate">
                      {volume.unit}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
