// eslint-config-next 16은 flat config(Linter.Config[])를 그대로 export 합니다.
// 예전 스캐폴드처럼 @eslint/eslintrc의 FlatCompat으로 감싸면,
// 이미 flat인 설정을 legacy eslintrc 스키마로 검증하려다 실패하고
// 그 에러 메시지를 만드는 JSON.stringify에서 플러그인 객체의 순환참조 때문에
// "Converting circular structure to JSON"으로 크래시합니다. 그래서 직접 가져다 씁니다.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default eslintConfig;
