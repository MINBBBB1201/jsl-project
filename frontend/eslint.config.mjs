// eslint-config-next 16은 flat config(Linter.Config[])를 그대로 export 합니다.
// 예전 스캐폴드처럼 @eslint/eslintrc의 FlatCompat으로 감싸면,
// 이미 flat인 설정을 legacy eslintrc 스키마로 검증하려다 실패하고
// 그 에러 메시지를 만드는 JSON.stringify에서 플러그인 객체의 순환참조 때문에
// "Converting circular structure to JSON"으로 크래시합니다. 그래서 직접 가져다 씁니다.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * 공개 페이지 — 로케일 프리픽스가 붙는 영역.
 *
 * 이 안에서는 next/link 를 직접 쓰면 안 된다. 아래 규칙 메시지에 이유를 적었다.
 *
 * ⚠️ "[locale]" 의 대괄호는 glob 문자 클래스라 반드시 이스케이프해야 한다.
 *    그냥 쓰면 l·o·c·a·e 중 한 글자에 매칭되는 패턴이 되어, 정작 [locale]
 *    디렉터리에는 규칙이 걸리지 않고 조용히 지나간다.
 *
 * ⚠️ src/components 를 통째로 넣지 않았다. logo·mode-toggle·site-header 처럼
 *    대시보드와 함께 쓰는 컴포넌트가 같은 폴더에 있어서, 통째로 막으면 사내
 *    화면에서 정상적인 next/link 까지 걸린다. 공개 전용 하위 폴더만 적는다.
 */
const PUBLIC_PAGE_FILES = [
  "src/app/\\[locale\\]/**/*.{ts,tsx}",
  "src/app/landing/**/*.{ts,tsx}",
  "src/components/landing/**/*.{ts,tsx}",
  "src/components/layout/**/*.{ts,tsx}",
  "src/components/legal/**/*.{ts,tsx}",
  "src/components/services/**/*.{ts,tsx}",
];

const LOCALE_LINK_MESSAGE = [
  "공개 페이지에서는 next/link 대신 @/i18n/navigation 의 Link 또는",
  "@/components/site-link 의 SiteLink 를 쓰세요.",
  "이 사이트는 로케일 프리픽스 라우팅이라(ko 는 프리픽스 없음, /en·/zh·/vi)",
  "next/link 로 내부 라우트를 걸면 프리픽스가 빠져서, 베트남어로 보던 사람이",
  "링크 한 번에 한국어 페이지로 떨어집니다.",
  "라우트와 '#앵커' 가 한 배열에 섞여 오는 자리에는 SiteLink 를 쓰면 알아서 갈립니다.",
  "/dashboard · /sign-in 처럼 로케일이 붙으면 안 되는 사내 라우트가 필요하면",
  "그 줄에만 eslint-disable-next-line 과 이유를 적으세요 (navbar.tsx 에 선례가 있습니다).",
].join(" ");

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // container-planner 테스트 빌드 산출물 — 원본(.ts)만 린트하면 된다
      ".test-build/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    files: PUBLIC_PAGE_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "next/link", message: LOCALE_LINK_MESSAGE }],
        },
      ],
    },
  },
];

export default eslintConfig;
