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
 * ── 왜 가변 폰트 한 벌인가 ─────────────────────────────────────────────
 * 처음에는 400/500/600/700 을 각각 받았는데(합계 90KB) 네 파일이 전부 preload 돼
 * 첫 화면에서 JS 와 대역폭을 다퉜다 (Lighthouse LCP 4.4s → 5.1s 로 악화).
 * 가변 폰트 한 벌은 200~700 전 구간을 20.9KB 로 담는다. 파일 수와 용량이
 * 동시에 줄어 그 회귀가 사라졌다.
 *
 * ── 한글 ───────────────────────────────────────────────────────────────
 * General Sans 에는 한글 글리프가 없다. 한글은 시스템에 설치된 산세리프로
 * 떨어지며, 폴백 순서는 globals.css 의 --font-sans 스택에서 지정한다.
 * 한글 웹폰트(Pretendard 등)를 번들하면 서브셋을 해도 수백 KB 라 성능과
 * 맞바꿔야 해서, 지금은 시스템 폰트를 쓴다.
 */
export const generalSans = localFont({
  src: [
    {
      path: '../fonts/GeneralSans-Variable.woff2',
      // 가변 폰트 — 이 구간 안의 굵기는 파일 하나로 전부 나온다
      weight: '200 700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-general-sans',
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
