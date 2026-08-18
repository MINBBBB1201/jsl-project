import localFont from 'next/font/local'

/**
 * 타이포그래피
 *
 * 라틴·숫자는 General Sans, 한글은 Pretendard. 둘 다 self-host 한다.
 *
 * General Sans 는 스위스 국제 타이포그래피 양식에서 직접 영감을 받은
 * 네오그로테스크로, 물류 브랜드가 참고하는 공항·철도 사인 시스템의 서체 계열과
 * 같은 뿌리다. Pretendard 는 그 계열(Inter/San Francisco)의 한글 대응으로
 * 설계된 서체라 둘을 섞어도 자소의 결이 어긋나지 않는다. 위계는 두 서체
 * 모두에서 크기·굵기·자간으로만 만든다.
 *
 * ── 왜 CDN 링크가 아니라 self-host 인가 ────────────────────────────────
 * CDN 을 <link> 로 부르면 렌더 경로에 외부 요청이 하나 더 붙고, 폰트가 늦게
 * 오면 글자가 늦게 그려진다(FOUT). 두 서체 모두 파일을 받아 같은 도메인에서
 * 서빙한다 — General Sans 는 아래 next/font 로, Pretendard 는 public/fonts 에
 * 두고 app/pretendard.css 의 @font-face 로.
 *
 * ── 굵기는 정적 파일로 각각 받는다 ─────────────────────────────────────
 * ⚠️ Fontshare 의 `general-sans@variable` 엔드포인트는 이름과 달리 진짜 가변
 *    폰트를 주지 않는다. 200/300/400/... 정적 인스턴스 목록을 돌려줄 뿐이다.
 *    이걸 가변 폰트로 착각해 첫 파일(=굵기 200)을 받아 `weight: '200 700'` 로
 *    선언했더니, 브라우저가 모든 굵기를 그 200 페이스로 그려서 라틴 문자와
 *    숫자만 가늘게 나왔다. 필요한 굵기를 각각 받아야 한다.
 */

/**
 * 한글 — Pretendard 400 / 600 / 700
 *
 * ⚠️ 이 파일에는 Pretendard 선언이 없다. app/pretendard.css 의 @font-face 로
 *    실린다 (유니코드 구간별 동적 서브셋). next/font/local 의 src 항목은
 *    path/weight/style 만 받아 파일별 unicode-range 를 표현할 수 없어서,
 *    여기에 두면 한 굵기당 264KB 짜리 정적 서브셋을 통째로 받는 수밖에 없다
 *    (3종 790KB). 구간별로 쪼개면 실제 쓰인 글자가 속한 파일만 받는다(약 200KB).
 *    폰트 스택 조립은 globals.css 의 --font-sans 에서 한다.
 *
 * ── 왜 실었나 ──────────────────────────────────────────────────────────
 * 전에는 한글을 시스템 폰트에 맡겼는데, 윈도우에서 실제로 잡히는 맑은 고딕은
 * Regular(400)·Bold(700) 두 벌뿐이라 CSS 가 500 을 요구하면 Regular 가, 600 을
 * 요구하면 Bold 가 그려졌다. 결과로 한글에서는 500 과 400 이 구분되지 않아
 * 라벨과 본문의 위계가 사라지고, 라틴과 한 줄에 섞이는 자리("180억원")에서는
 * 한쪽만 굵어져 어긋나 보였다.
 *
 * ── 왜 3종인가 ─────────────────────────────────────────────────────────
 * 400 본문 / 600 라벨·카드 제목 / 700 헤드라인. 이 셋이면 위계가 선다.
 *
 * ⚠️ 그래서 한글에는 굵기 500 이 없다. CSS 가 500 을 요구하면 브라우저는
 *    한글을 400 으로 그리는데, 라틴은 General Sans 500 이 있어 진짜 Medium 이
 *    나온다. 결과로 500 을 쓰면
 *      · 한글 라벨이 400 짜리 본문과 굵기가 같아져 위계가 사라지고
 *      · 한 줄에 섞인 라틴만 굵어 보인다 ("180억원" 같은 자리)
 *    ⇒ 굵기로 위계를 주려는 자리에는 font-medium(500) 대신 font-semibold(600)
 *      를 쓸 것. 500 은 라틴만 나오는 라벨(AIR/SEA/TRUCK 등)에만 안전하다.
 *    500 이 필요해지면 scripts 로 pretendard.css 를 다시 만들면 된다.
 *
 * ⚠️ 중국어(zh 로케일)에는 적용되지 않는다. Pretendard 는 한자 서체가 아니라
 *    중국어는 시스템 폰트로 떨어진다 (의도한 동작이다). 즉 굵기 위계가 제대로
 *    서는 것은 한글과 라틴뿐이다.
 */

export const generalSans = localFont({
  src: [
    { path: '../fonts/GeneralSans-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/GeneralSans-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/GeneralSans-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/GeneralSans-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-general-sans',
  /*
    preload 를 끈다.
    굵기 4종을 전부 preload 하면 첫 화면에서 히어로 헤드라인이 그려지기 전에
    폰트 4개가 대역폭을 가져간다 (실측 LCP 4.3s → 5.1s). preload 를 끄면
    브라우저가 CSS 를 해석한 뒤에 필요한 굵기만 받아 오고, display: swap +
    아래 폴백 덕에 글자는 곧바로 그려진다.
  */
  preload: false,
  /*
    ⚠️ fallback 을 일부러 비워 뒀다. 채우지 말 것.

       전체 폰트 스택은 globals.css 의 --font-sans 한 곳에서만 조립한다.
       여기 fallback 에 무언가를 넣으면 그것이 --font-general-sans 안에 들어가
       --font-sans 의 앞쪽에 끼어드는데, 특히 'sans-serif' 같은 제네릭을 넣으면
       그 뒤에 이어 붙인 한글 폰트가 전부 죽은 값이 된다 — 브라우저는 제네릭
       패밀리를 만나면 거기서 글리프 탐색을 끝낸다.

       이 프로젝트에서 이미 두 번 그렇게 짜서 두 번 한글이 폴백으로 떨어졌다.
       그래서 "폴백은 fonts.ts 가 아니라 globals.css 에서" 로 규칙을 고정했다.
  */
})
