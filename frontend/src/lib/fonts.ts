import { Be_Vietnam_Pro, Poppins } from 'next/font/google'
import localFont from 'next/font/local'

/**
 * 타이포그래피
 *
 * 라틴·숫자는 General Sans, 한글은 Pretendard. 둘 다 self-host 한다.
 * 여기에 Poppins 를 하나 더 두는데, 전체 스택이 아니라 로케일과 무관하게 늘
 * 영문인 마이크로카피(eyebrow 라벨·통계 숫자·배지)에만 부분 적용한다.
 * 자세한 것은 파일 아래 poppins 선언의 주석에.
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
    ⚠️ adjustFontFallback 을 끈다. 켜 두면 next/font 가 'generalSans Fallback'
       (local Arial + size-adjust) 페이스를 만들어 --font-general-sans 안에
       끼워 넣는데, 이 페이스에는 unicode-range 가 없어서(U+0–10FFFF) 스택
       두 번째 자리에서 Arial 이 그릴 수 있는 글자를 전부 삼킨다.

       실제로 그 때문에 베트남어 성조 글자가 Pretendard 와 Be Vietnam Pro 에
       닿지도 못하고 Arial 로 떨어지고 있었다 (실측: /vi 랜딩 한 장에 Arial
       988 글리프, Be Vietnam Pro 는 아홉 페이스 전부 unloaded 였다).
       한글이 멀쩡했던 건 Arial 에 한글이 없어 그냥 통과했기 때문이다.

       제네릭이 아니어도 unicode-range 가 없으면 글리프 탐색은 거기서 끝난다 —
       아래 fallback 경고와 같은 함정이고, 원인만 다르다.
  */
  adjustFontFallback: false,
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

/**
 * 영문 마이크로카피 — Poppins 500 / 600 / 700
 *
 * 레퍼런스로 보는 RXO 가 헤딩·본문 전반에 쓰는 지오메트릭 산세리프다. 여기서는
 * 전체 스택을 바꾸지 않고, 로케일이 무엇이든 항상 영문으로 고정돼 있는 짧은
 * 요소에만 부분 적용한다 — 섹션 eyebrow("WHAT WE DO"), 통계 숫자, "NEW" 배지,
 * 운송모드 코드(AIR/SEA/TRUCK). 실제 언어 콘텐츠(헤드라인·본문·네비·버튼)는
 * General Sans + Pretendard 그대로다.
 *
 * ── 왜 CJK 로 새지 않는가 ──────────────────────────────────────────────
 * subsets: ['latin'] 이라 @font-face 에 라틴 unicode-range 만 붙는다. 한글·한자는
 * 이 범위 밖이라 .font-poppins 안에 있어도 브라우저가 Poppins 를 건너뛰고
 * 다음 폰트(Pretendard 등)로 그린다 — 스택 순서는 globals.css 의 --font-poppins.
 * 즉 유틸리티를 잘못 붙여도 한글이 Poppins 로 바뀌는 사고는 구조적으로 없다.
 *
 * ⚠️ 다만 베트남어는 다르다. Poppins 에는 vietnamese 서브셋이 없고 latin-ext 도
 *    U+1E9F 까지라, 'ế'(U+1EBF) · 'ầ' · 'ỷ' 같은 글자만 폴백으로 떨어진다.
 *    한 단어 안에서 폰트가 갈려 보인다 ("6 chuyến/tuần" 의 chuy|ế|n).
 *    ⇒ 숫자와 베트남어가 한 문자열에 섞이는 자리(hero·whyJsl 의 통계 문자열,
 *      "200 tấn/tháng")에는 이 유틸리티를 통째로 붙이지 말 것. 숫자만 떼어
 *      감싸야 한다 — count-up.tsx 가 prefix/숫자/suffix 로 쪼개는 이유다.
 *
 * ⚠️ Poppins 에는 tnum(고정폭 숫자) 피처가 없다. 통계 숫자에 붙어 있는
 *    .tabular-figures 는 Poppins 위에서 아무 일도 하지 않아, 카운트업이
 *    도는 동안 자릿수 폭이 프레임마다 달라진다 (실측 0-9 자폭 10종).
 *    다만 이건 Poppins 때문에 생긴 문제가 아니다 — General Sans 도 tnum 이
 *    없어 같은 자리에서 이미 자폭 8종이었다. 즉 .tabular-figures 는 이 폰트
 *    스택에서 원래부터 무효였고, Poppins 로 바꾸면서 나빠진 것이 아니다.
 *    정말로 고정폭이 필요해지면 숫자 칸에 폭을 예약하는 쪽으로 풀어야 한다.
 *
 * ── 굵기 ───────────────────────────────────────────────────────────────
 * 500 모드 코드·배지 / 600 eyebrow·통계 숫자 / 700 예약.
 * 700 은 지금 쓰는 곳이 없지만, preload 를 끈 덕에 선언만 있고 쓰이지 않는
 * 굵기는 파일을 받아오지 않는다 (브라우저는 실제로 그릴 글자가 있는 페이스만
 * 내려받는다). Pretendard 와 달리 500 이 진짜로 있으므로, 라틴 전용인 이
 * 자리에서는 font-medium 을 써도 위 파일 앞부분의 500 금지 규칙에 걸리지 않는다.
 */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins-latin',
  /*
    ⚠️ 변수 이름이 --font-poppins 가 아니라 --font-poppins-latin 인 것은 오타가
       아니다. Tailwind 유틸리티 .font-poppins 는 globals.css 의 @theme 에서
       --font-poppins 로 만드는데, next/font 가 같은 이름을 <html> 의 class 로
       정의해 버리면 (클래스 선택자가 :root 보다 우선해서) 테마 값이 통째로
       덮인다. 두 이름을 반드시 다르게 둘 것.
  */
  /*
    General Sans 와 같은 이유로 preload 를 끈다. Poppins 가 쓰이는 자리는
    eyebrow·숫자 같은 마이크로카피뿐이라 히어로 헤드라인(LCP)보다 급하지 않다.
    display: swap 이라 폰트가 늦어도 글자는 곧바로 그려진다.
  */
  preload: false,
  /*
    adjustFontFallback 은 기본값(true) 그대로 둔다. next/font 가 Poppins 의
    메트릭에 맞춰 size-adjust 한 'Poppins Fallback'(local Arial 기반) 을 만들어
    폰트 교체 순간의 레이아웃 시프트를 없애 준다.

    ⚠️ 예전에 여기에 "제네릭이 아니라 실제 페이스니 탐색이 뒤로 넘어간다" 고
       적어 뒀는데, 그 설명은 틀렸다. 'Poppins Fallback' 에는 unicode-range 가
       없어서(U+0–10FFFF) Arial 이 그릴 수 있는 글자는 전부 여기서 멈춘다 —
       제네릭이 아니어도 탐색은 끝난다. 같은 이유로 General Sans 쪽은
       adjustFontFallback 을 껐다 (베트남어 성조 글자를 삼키고 있었다).

       Poppins 만 켜 둔 채로 두는 이유는 적용 범위가 다르기 때문이다.
       General Sans 는 본문 전체의 첫 폰트라 그 폴백이 모든 글자의 탐색을
       가로막지만, .font-poppins 는 영문 라벨·숫자에만 붙어 있어서 뒤로 넘겨야
       할 글자 자체가 없다 (실측으로 CJK·베트남어가 한 글자도 들어 있지 않은 것을
       확인했다). 대신 이 유틸리티를 한글이나 베트남어가 섞이는 자리에 붙이면
       그 글자들이 Pretendard·Be Vietnam Pro 에 닿지 못하고 Arial 로 그려진다.
       ⇒ .font-poppins 는 지금처럼 라틴·숫자 전용으로만 쓸 것.
  */
})

/**
 * 베트남어 성조 글자 — Be Vietnam Pro 400 / 600 / 700
 *
 * 전체 스택을 바꾸지 않는다. 폰트 폴백 체인에 한 단계를 더할 뿐이고, 브라우저가
 * 글자 하나하나에 대해 스택을 훑는 성질을 그대로 쓴다 (globals.css 의 --font-sans).
 *   라틴·숫자   General Sans 가 먼저 가져간다        (그대로)
 *   한글        Pretendard 가 가져간다               (그대로)
 *   ế · ầ · ỷ   앞의 둘에 없어서 여기까지 내려온다    (새로 붙는 자리)
 * 로케일 분기가 없다. /vi 든 /ko 든 같은 스택이고, 베트남어 글자가 나오는
 * 자리에서만 자동으로 이 폰트가 쓰인다.
 *
 * ── 왜 필요했나 ────────────────────────────────────────────────────────
 * General Sans 에도 Pretendard 서브셋에도 U+1EA0–1EF9 구간이 없어서, /vi 페이지의
 * 성조 글자가 전부 시스템 Arial 로 떨어지고 있었다 (실측: 랜딩 한 장에 Arial
 * 988 글리프, 성조가 들어간 조각 263개 중 221개에 섞여 있었다). 한 단어 안에서
 * "Hàng" 의 H·n·g 는 General Sans, à 는 Arial 로 갈려 그려졌다.
 *
 * ── 왜 Be Vietnam Pro 인가 ─────────────────────────────────────────────
 * 베트남어를 위해 설계된 서체라 성조 부호의 위치와 크기가 정리돼 있고, 기하학적
 * 산세리프라 General Sans·Pretendard 와 결이 크게 어긋나지 않는다.
 *
 * ── 서브셋 ─────────────────────────────────────────────────────────────
 * vietnamese 하나만 받는다. latin 을 함께 받아도 General Sans 가 먼저라 실제로
 * 쓰이지는 않지만, 선언이 늘면 나중에 스택 순서를 바꿀 때 어느 폰트가 라틴을
 * 그리는지 헷갈린다.
 *
 * ⚠️ 굵기는 Pretendard 와 똑같이 400 / 600 / 700 세 벌이다. 여기에도 500 이
 *    없으므로 CSS 가 500 을 요구하면 400 으로 떨어진다 — 위 Pretendard 항목의
 *    "굵기로 위계를 주려면 600 을 쓸 것" 규칙이 베트남어에도 그대로 적용된다.
 *    두 폰트의 굵기 구성을 일부러 맞춰 둔 것이니 한쪽만 늘리지 말 것.
 */
export const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
  /*
    General Sans · Poppins 와 같은 이유로 preload 를 끈다. 이 폰트가 그리는 것은
    문장 안의 성조 글자뿐이라 첫 화면에서 먼저 받아야 할 만큼 급하지 않고,
    display: swap 이라 늦게 와도 글자는 곧바로 그려진다.
  */
  preload: false,
  /*
    adjustFontFallback 은 기본값(true)이다. 폰트가 오기 전까지는 메트릭을 맞춘
    'Be Vietnam Pro Fallback'(local Arial 기반)이 그리므로, 교체되는 순간 줄이
    밀리지 않는다 — 지금도 Arial 이 그리고 있으니 폰트가 늦어도 나빠지는 것은
    없고 교체 시점의 시프트만 사라진다.

    위 General Sans 의 fallback 경고와 상충하지 않는다. 그 경고는 'sans-serif'
    같은 *제네릭* 을 넣지 말라는 것이고 (제네릭을 만나면 글리프 탐색이 거기서
    끝나 뒤 항목이 죽는다), 이건 제네릭이 아니라 실제 페이스라 탐색이 그대로
    뒤로 넘어간다.
  */
})
