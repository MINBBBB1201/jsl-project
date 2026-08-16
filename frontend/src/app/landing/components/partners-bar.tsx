"use client"

import { useContent } from '@/config/use-content'

/**
 * 제휴 항공사·특송 파트너 신뢰신호 바
 *
 * ⚠️ 로고 이미지 대신 텍스트 워드마크만 쓴다 (상표 문제).
 *    자세한 이유는 landing-content.ts 의 partners 주석 참고.
 *
 * 무한 스크롤(마퀴)로 흘린다. 파트너가 늘어도 줄바꿈으로 높이가 튀지 않고,
 * 정지된 목록보다 "네트워크가 돌아가고 있다"는 인상을 준다.
 *
 * ── 구현 ────────────────────────────────────────────────────────────────
 * 같은 목록을 두 벌 이어 붙이고 -50% 만큼 밀면 이음매 없이 반복된다
 * (globals.css 의 marquee-scroll). JS 없이 CSS 만으로 돌아서 메인 스레드를
 * 쓰지 않고, 동작 줄이기 설정에서는 전역 규칙이 멈춘다.
 * 두 번째 벌은 스크린리더에 중복으로 읽히지 않도록 aria-hidden 이다.
 */
export function PartnersBar() {
  const { partners } = useContent()

  // 그룹 라벨과 항목을 한 줄로 펴서 하나의 띠로 만든다
  const entries = partners.groups.flatMap((group) =>
    group.items.map((item) => ({
      label: group.label,
      name: item.name,
      nameEn: "nameEn" in item ? item.nameEn : undefined,
    }))
  )

  return (
    <section className="border-b bg-muted/30 py-10 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {partners.title}
          </h2>
          <p className="text-sm text-muted-foreground">{partners.description}</p>
        </div>
      </div>

      {/*
        마퀴는 컨테이너 밖으로 나가 화면 폭을 꽉 채운다.
        양끝 페이드로 잘린 항목이 딱딱하게 끊기지 않게 한다.
      */}
      <div className="marquee-track relative mt-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24"
          aria-hidden="true"
        />

        <div
          className="animate-marquee flex w-max"
          style={{ ["--marquee-duration" as string]: "44s" }}
        >
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              className="flex shrink-0 items-stretch"
              aria-hidden={copy === 1 || undefined}
            >
              {entries.map((entry) => (
                <li
                  key={`${copy}-${entry.name}`}
                  className="mx-2 flex min-w-44 flex-col justify-center border-l px-6 py-1"
                >
                  <span className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                    {entry.label}
                  </span>
                  <span className="mt-1 text-base font-medium text-foreground">
                    {entry.name}
                  </span>
                  {entry.nameEn && (
                    <span className="text-xs text-muted-foreground">
                      {entry.nameEn}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="container mx-auto mt-6 px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground">{partners.note}</p>
      </div>
    </section>
  )
}
