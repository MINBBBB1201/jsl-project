# JSL LOGISTICS — Claude Code 작업 지침

> 저장소 루트(`README.md`와 같은 위치)에 이 파일을 `CLAUDE.md`로 저장하세요. 이번 세션 전체의 상세 기록(무엇을 왜 했는지)은 같은 위치의 `SESSION_HISTORY.md`를 참고하세요 — 이 파일은 Claude Code가 매 실행마다 로드하므로 일부러 짧게 유지했습니다.

## 프로젝트 구조

`frontend/`(Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui, `next-intl` 4개 로케일 ko/en/zh/vi) + `backend/`(Express + MongoDB/Mongoose). 구조·초기 세팅 배경은 `README.md` 참고.

## 이 프로젝트의 작업 흐름

이 저장소는 클라우드 Claude(Cowork) 세션이 설계·프롬프트 작성을 담당하고, 로컬 Claude Code(당신)가 실제 코드 작업을 실행하는 방식으로 진행돼 왔습니다. 사용자가 Cowork에서 작성된 markdown 프롬프트를 붙여넣으면 그대로 실행하고, 완료 후 리포트를 다시 Cowork에 붙여넣어 검토받는 흐름입니다. 이 워크플로우 자체를 바꿀 필요는 없고, 아래 원칙만 계속 지켜주세요.

## 표준 원칙 (모든 작업에 적용)

1. 지시받은 범위를 넘어서는 판단(리팩터, 시드 데이터 확장, 발견한 버그 수정 등)을 하게 되면 임의로 진행하되, 완료 리포트에 "지시와 다르게 판단한 부분과 근거"를 반드시 별도로 명시한다 — 사용자가 사후 승인할 수 있게.
2. 디자인/UI 관련 작업은 실제 레퍼런스 조사 없이 추상적 설명만으로 진행하지 않는다 — Cowork 쪽에서 미리 비교 목업을 만들어 승인받은 뒤 프롬프트가 오므로, 프롬프트에 명시된 실제 구조(레이아웃/필드/톤)를 임의로 바꾸지 말고 그대로 구현한다.
3. 시크릿/자격증명 파일은 만들거나 커밋하지 않는다.
4. 미적 목표: "AI가 만든 티가 안 나는" 전문적인 톤 — Modern Corporate / Industrial Minimalism / Swiss International Style. 과한 그라디언트·이모지·장식 지양.
5. 완료 리포트에는 항상 포함: 스크린샷(라이트/다크, 관련 있으면 모바일), `tsc`/`lint`/`build`/`test` 결과, 지시와 다르게 판단한 부분과 근거, 알려진 한계.

## 자주 쓰는 관례 (새 작업 시 먼저 확인)

- **공개 도구 페이지**: `[locale]/(public)/<slug>/page.tsx` + `<slug>-client.tsx` + `PublicPageShell`. `middleware.ts`의 `LOCALIZED_SEGMENTS`에 새 슬러그 추가 필수(빠뜨리면 비영어 로케일 404).
- **대시보드(내부) 데이터 훅**: `use-async-resource.ts`의 `useAsyncResource<T>(fetcher, fallbackMessage)` 패턴을 재사용.
- **PII 원칙**: 여러 건을 한 번에 보여주는 목록은 `customer` 등 연락처를 제외하고, 담당자가 건 하나를 처리하는 상세 화면은 포함한다. `backend/src/controllers/shipment.controller.js`의 `PII_EXCLUDED_FIELDS` 참고.
- **PR 준비**: PR 본문 작성 → Windows에서는 `Get-Content -Raw -Encoding UTF8 <path> | Set-Clipboard`로 복사(한글 깨짐 방지, `type | clip` 금지) → `https://github.com/MINBBBB1201/jsl-project/compare/main...<branch>`로 수동 PR 생성(`gh` CLI 미설치 상태).
- **브랜치 작업 시작 전**: `main` 대비 뒤처졌으면 먼저 병합하고 재검증부터.

## 커밋 메시지

```
<type>(<scope>): <설명>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

## 참고

- 기술 스택, 완료된 작업 목록(PR #3~#6), 진행 중인 무역서류 생성기 작업의 상세 배경은 `SESSION_HISTORY.md`에 있습니다.
- 현재 미확인 사항: `feature/document-generator` 브랜치가 이미 만들어졌는지(1단계 프롬프트를 실행했는지) 확실치 않습니다 — 먼저 `git branch -a`로 확인하고 시작하세요.
