import localFont from 'next/font/local'

/**
 * 타이포그래피
 *
 * 본문·헤드라인 모두 General Sans 하나로 간다. 스위스 국제 타이포그래피 양식에서
 * 직접 영감을 받은 네오그로테스크로, 물류 브랜드가 참고하는 공항·철도 사인 시스템의
 * 서체 계열과 같은 뿌리다. 서체를 여러 개 섞지 않는 것 자체가 이 양식의 원칙이라
 * 위계는 크기·굵기·자간으로만 만든다.
 *
 * ── 왜 CDN 링크가 아니라 self-host 인가 ────────────────────────────────
 * Fontshare CDN 을 <link> 로 부르면 렌더 경로에 외부 요청이 하나 더 붙고,
 * 폰트가 늦게 오면 글자가 늦게 그려진다(FOUT). 파일을 받아 두면 next/font 가
 * 빌드 시점에 preload 를 걸고 같은 도메인에서 서빙한다.
 *
 * ── 굵기는 정적 4종으로 받는다 ─────────────────────────────────────────
 * ⚠️ Fontshare 의 `general-sans@variable` 엔드포인트는 이름과 달리 진짜 가변
 *    폰트를 주지 않는다. 200/300/400/... 정적 인스턴스 목록을 돌려줄 뿐이다.
 *    이걸 가변 폰트로 착각해 첫 파일(=굵기 200)을 받아 `weight: '200 700'` 로
 *    선언했더니, 브라우저가 모든 굵기를 그 200 페이스로 그려서 라틴 문자와
 *    숫자만 가늘게 나왔다 (한글은 폴백이라 굵게 나와 대비가 뒤죽박죽이 됐다).
 *    필요한 굵기를 각각 받아야 한다. 4종 합계 90KB.
 *
 * ── 한글 ───────────────────────────────────────────────────────────────
 * General Sans 에는 한글 글리프가 없다. 한글은 시스템에 설치된 산세리프로
 * 떨어지며, 폴백 순서는 globals.css 의 --font-sans 스택에서 지정한다.
 * 한글 웹폰트(Pretendard 등)를 번들하면 서브셋을 해도 수백 KB 라 성능과
 * 맞바꿔야 해서, 지금은 시스템 폰트를 쓴다.
 *
 * ⚠️ 그 대가로 한글에는 굵기 500·600 이 없다 (윈도우 한정).
 *    윈도우에서 실제로 잡히는 맑은 고딕은 Regular(400)·Bold(700) 두 벌뿐이라,
 *    CSS 가 500 을 요구하면 Regular 가, 600 을 요구하면 Bold 가 그려진다.
 *    그래서 한글이 들어가는 자리에서는
 *      · font-medium(500)  → 한글은 400 과 구분되지 않는다. 라벨/제목을 본문과
 *                            굵기로 구분하려면 font-semibold(600) 를 쓸 것.
 *      · 라틴과 한 줄에 섞이는 자리(예: "180억원")는 400 이나 700 을 쓸 것.
 *        500 은 라틴만, 600 은 한글만 굵어져 양쪽 다 어긋나 보인다.
 *    맥(Apple SD Gothic Neo)은 굵기가 갖춰져 있어 이 문제가 없다 — 즉 윈도우에서만
 *    보이는 현상이라 맥에서 확인하면 놓친다.
 *
 *    근본 해결은 굵기가 갖춰진 한글 웹폰트를 싣는 것이다. 용량을 감수할 수 있게
 *    되면 여기에 Pretendard 400/600/700 을 추가하고 위 제약을 지우면 된다.
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
    아래 폴백의 메트릭 보정 덕에 글자는 곧바로 그려진다.
  */
  preload: false,
  /*
    폴백 스택.
    ⚠️ 한글 폰트를 여기(next/font 의 fallback)에 넣어야 한다. CSS 쪽 --font-sans 에
       이어 붙이면 next/font 가 만들어 넣는 'sans-serif' 뒤로 밀리는데, 브라우저는
       제네릭 패밀리에서 탐색을 끝내므로 그 뒤 항목들은 죽은 값이 된다.
       (실제로 그렇게 짰다가 한글이 Pretendard 대신 기본 산세리프로 떨어졌다)
    General Sans 에 한글 글리프가 없으므로 한글은 이 스택에서 그려진다.
  */
  fallback: [
    'Pretendard',
    'Apple SD Gothic Neo',
    'Malgun Gothic',
    'Noto Sans KR',
    'system-ui',
    'sans-serif',
  ],
})
