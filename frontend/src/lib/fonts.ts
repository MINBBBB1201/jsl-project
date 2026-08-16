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
 * 폰트가 늦게 오면 글자가 늦게 그려진다(FOUT). woff2 4종을 받아 두면
 * next/font 가 빌드 시점에 preload 를 걸고 같은 도메인에서 서빙한다.
 * 4개 굵기 전부 합쳐 90KB 정도다.
 *
 * ── 한글 ───────────────────────────────────────────────────────────────
 * General Sans 에는 한글 글리프가 없다. 한글은 시스템에 설치된 산세리프로
 * 떨어지며, 폴백 순서는 globals.css 의 --font-sans 스택에서 지정한다.
 * 한글 웹폰트(Pretendard 등)를 번들하면 서브셋을 해도 수백 KB 라 성능과
 * 맞바꿔야 해서, 지금은 시스템 폰트를 쓴다.
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
  // 폰트가 로드되기 전후로 글자 폭이 튀는 것을 줄인다
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
})
