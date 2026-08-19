"use client"

import { useContent } from '@/config/use-content'

/**
 * 인증 · 등록 배지 바
 *
 * ── 자리 ────────────────────────────────────────────────────────────────
 * 다크 블록(통계 + 파트너 바) 바로 다음, About 섹션 앞이다.
 * 통계("우리 규모") → 파트너("우리가 함께 일하는 회사") → 인증("우리가 등록·
 * 검증된 사업자")까지가 하나의 신뢰 서사라, 다크 블록이 끝나는 자리에서
 * 그 이야기를 밝은 톤으로 이어받는다. 명암 교차를 새로 만들지 않고 기존
 * 리듬(다크 → 옅은 톤 → 흰 배경 About)에 한 칸을 끼운 것이다.
 *
 * ── 배경색 ──────────────────────────────────────────────────────────────
 * 목업의 #f6f5f2 대신 bg-muted/40 을 쓴다. 이 사이트에는 테마 토글이 있어서
 * 밝은 색을 하드코딩하면 다크모드에서 이 띠만 하얗게 남는다. bg-muted/40 은
 * 요금 섹션과 같은 농도라 라이트에서 목업과 같은 "옅게 깔린 배경"이 되고,
 * 다크에서는 알아서 따라간다. 카드의 흰 배경도 같은 이유로 bg-card 다
 * (라이트 모드에서 --card 는 정확히 #ffffff).
 *
 * ── 제목 굵기가 500 이 아니라 600 인 이유 ───────────────────────────────
 * 목업은 font-weight 500 이지만 여기서는 600 을 쓴다. Pretendard 를 400/600/700
 * 3종만 싣기 때문에 CSS 가 500 을 요구하면 한글이 400 으로 떨어져, 제목이
 * 바로 아래 부제(400)와 굵기가 같아진다 — 굵기로 세우려던 위계가 사라지고
 * 한 줄에 섞인 라틴("KIFFA")만 굵어 보인다. 자세한 사정은 lib/fonts.ts.
 */
export function CertificationsBar() {
  const { certifications } = useContent()

  return (
    <section aria-label={certifications.ariaLabel} className="bg-muted/40 py-12 sm:py-14">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          모바일 2열. 카드 하나에 아이콘·제목·부제뿐이라 1열로 늘어놓으면
          네 칸이 세로로 길게 흘러 오히려 읽는 품이 든다.
        */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {certifications.items.map((item) => (
            <li
              key={item.title}
              className="flex flex-col items-center rounded-xl border-[0.5px] border-border bg-card px-3.5 py-4 text-center"
            >
              <item.icon className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-2.5 text-[13px] font-semibold text-foreground">
                {item.title}
              </p>
              {/*
                등록번호는 tabular-figures 로. 네 칸이 가로로 붙어 있어
                숫자 폭이 들쭉날쭉하면 카드마다 부제 길이가 달라 보인다.
              */}
              <p className="tabular-figures mt-1 text-[11px] text-muted-foreground">
                {item.subtitle}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
