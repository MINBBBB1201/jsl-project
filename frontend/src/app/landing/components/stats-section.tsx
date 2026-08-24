"use client"

import { useContent } from '@/config/use-content'
import { CountUp } from './count-up'

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
 *
 * ── 카운트업 (3단계) ───────────────────────────────────────────────────
 * 위 4칸 지표와 아래 월간 물동량 모두 스크롤 진입 시 0 에서 실제값까지
 * 올라간다. 단위 표기(억원 · TEU / 월)는 그대로 두고 숫자 자리만 굴린다 —
 * 파싱과 동작 줄이기 처리는 count-up.tsx 에 있다.
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
                <CountUp value={stat.value} />
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
              <p className="mt-1 text-sm text-brand-slate">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* 월간 처리 물동량 */}
        <div className="mt-10 md:mt-12">
          <div className="mb-6 max-w-xl">
            {/*
              h3 가 아니라 h2 다 (axe: heading-order).

              문서 순서상 이 섹션 앞에는 히어로의 h1 뿐이고, 이 섹션 안에 다른
              제목이 없다 — 위 4칸 지표는 제목 없는 수치 그리드다. 그래서 이것이
              이 섹션의 최상위 제목이고, h3 로 두면 h1 다음에 h2 를 건너뛴 셈이
              된다. 바로 아래 파트너 바의 제목도 같은 이유로 h2 다.

              시각적 크기(text-lg)는 그대로다. 제목 단계는 화면 크기가 아니라
              문서 구조를 나타내는 값이라 둘을 맞출 이유가 없다.
            */}
            <h2 className="text-lg font-semibold text-white">{volumesHeading.title}</h2>
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
                  <p className="font-poppins text-[11px] font-medium tracking-[0.14em] text-brand-slate">
                    {volume.mode}
                  </p>
                  <p className="tabular-figures text-xl font-semibold text-white">
                    <CountUp value={volume.value} />
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
