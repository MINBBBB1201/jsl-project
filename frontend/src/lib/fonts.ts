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
 * 오면 글자가 늦게 그려진다(FOUT). 파일을 받아 두면 next/font 가 빌드 시점에
 * 해시된 파일명으로 같은 도메인에서 서빙한다.
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
 * ── 왜 실었나 ──────────────────────────────────────────────────────────
 * 전에는 한글을 시스템 폰트에 맡겼는데, 윈도우에서 실제로 잡히는 맑은 고딕은
 * Regular(400)·Bold(700) 두 벌뿐이라 CSS 가 500 을 요구하면 Regular 가, 600 을
 * 요구하면 Bold 가 그려졌다. 결과로 한글에서는 500 과 400 이 구분되지 않아
 * 라벨과 본문의 위계가 사라지고, 라틴과 한 줄에 섞이는 자리("180억원")에서는
 * 한쪽만 굵어져 어긋나 보였다. 이 문제를 컴포넌트에서 굵기를 피해 가며
 * 우회하고 있었는데(400·700 만 쓰기), 서체를 실어 근본을 고쳤다.
 *
 * ── 왜 3종인가 ─────────────────────────────────────────────────────────
 * 400 본문 / 600 라벨·카드 제목 / 700 헤드라인. 이 셋이면 위계가 서고,
 * 한 종이라도 더 늘리면 한글 서브셋 한 벌이 통째로 더 붙는다(약 264KB).
 *
 * ⚠️ 그래서 한글에는 굵기 500 이 없다. CSS 가 500 을 요구하면 브라우저는
 *    한글을 400 으로 그리는데, 라틴은 General Sans 500 이 있어 진짜 Medium 이
 *    나온다. 결과로 500 을 쓰면
 *      · 한글 라벨이 400 짜리 본문과 굵기가 같아져 위계가 사라지고
 *      · 한 줄에 섞인 라틴만 굵어 보인다 ("180억원" 같은 자리)
 *    ⇒ 굵기로 위계를 주려는 자리에는 font-medium(500) 대신 font-semibold(600)
 *      를 쓸 것. 500 은 라틴만 나오는 라벨(AIR/SEA/TRUCK 등)에만 안전하다.
 *    500 이 정말 필요해지면 Pretendard-500 을 여기 추가하면 된다 (+264KB).
 *
 * ── 용량 ───────────────────────────────────────────────────────────────
 * KS X 1001 서브셋(한글 2,780자 + 라틴) 기준 3종 합계 약 790KB.
 * ⚠️ 적은 용량이 아니다. 그래서 preload 를 끈다 (아래 참고).
 *    더 줄이려면 유니코드 구간별로 쪼갠 동적 서브셋(실전송 150~250KB)을 써야
 *    하는데, next/font/local 의 src 항목은 path/weight/style 만 받고 파일별
 *    unicode-range 를 표현할 수 없어서 @font-face CSS 를 직접 써야 한다.
 *    폰트 배선이 두 곳으로 갈라지는 값이 있는지 판단해서 옮길 것.
 *
 * 파일은 Pretendard v1.3.9 공식 배포본(woff2-subset)을 그대로 쓴다.
 *   https://github.com/orioncactus/pretendard  (SIL Open Font License 1.1)
 *   dist/web/static/woff2-subset/Pretendard-{Regular,SemiBold,Bold}.subset.woff2
 *
 * ⚠️ 중국어(zh 로케일)에는 적용되지 않는다. 이 서브셋에 한자가 없어서
 *    중국어는 지금처럼 시스템 폰트로 떨어진다 (의도한 동작이다 — Pretendard 는
 *    한자 서체가 아니다). 즉 굵기 위계가 제대로 서는 것은 한글과 라틴뿐이다.
 */
export const pretendard = localFont({
  src: [
    { path: '../fonts/Pretendard-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Pretendard-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/Pretendard-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  /*
    preload 를 끈다 — General Sans 와 같은 이유이고, 여기서는 더 중요하다.
    한 벌이 264KB 라 preload 를 걸면 첫 화면이 그려지기 전에 790KB 가
    대역폭을 통째로 가져간다. 끄면 브라우저가 CSS 를 해석한 뒤 실제로 쓰인
    굵기만 받아 오고, display: swap 덕에 글자는 폴백으로 곧바로 그려진다.
  */
  preload: false,
  /*
    adjustFontFallback 은 Arial 메트릭을 흉내 낸 폴백 페이스를 하나 더 만든다.
    Arial 에는 한글이 없어서 한글에는 아무 효과가 없고, 폰트 스택만 길어진다.
    한글의 실제 폴백(맑은 고딕/애플 고딕)은 globals.css 의 --font-sans 에 있다.
  */
  adjustFontFallback: false,
  variable: '--font-pretendard',
})

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
    ⚠️ fallback 을 일부러 비워 뒀다. 전체 폰트 스택은 globals.css 의 --font-sans
       에서 조립한다. 이 파일에서 조립할 수 없는 이유가 있다.

       self-host 한 한글 웹폰트의 실제 패밀리명은 next/font 가 빌드 시점에 만드는
       해시 이름(__pretendard_xxxx)이라 문자열로 적을 수 없다. 문자열 'Pretendard'
       는 "사용자 PC 에 설치된 Pretendard"를 가리킬 뿐이라 self-host 한 파일은
       영영 안 쓰인다. 그렇다고 여기에 pretendard.style.fontFamily 를 참조하면
       next/font 가 컴파일 타임 변환이라
         "Font loader values must be explicitly written literals"
       로 빌드가 깨진다 (실제로 시도해서 확인했다). 남는 방법은 둘 다 CSS 변수로
       내보내고 CSS 에서 잇는 것뿐이다.

    ⚠️ 그러므로 여기에 'sans-serif' 같은 제네릭 패밀리를 절대 넣지 말 것.
       넣으면 --font-general-sans 가 제네릭으로 끝나고, --font-sans 에서 그 뒤에
       이어 붙인 한글 폰트는 전부 죽은 값이 된다 — 브라우저는 제네릭 패밀리를
       만나면 거기서 글리프 탐색을 끝낸다. 이 프로젝트에서 이미 두 번 그렇게
       짜서 두 번 한글이 폴백으로 떨어졌다.
  */
})
