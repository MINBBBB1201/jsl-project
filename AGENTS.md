# JSL LOGISTICS 작업 지침 (공통)

Claude Code, Codex, opencode, kilo가 함께 읽는 공통 지침이다. Claude Code는 `CLAUDE.md`가 이 파일을 불러온다. 지침을 고칠 때는 이 파일 한 곳만 고친다. 매 실행마다 로드되므로 짧게 유지한다.

## 프로젝트 구조

`frontend/`(Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui, `next-intl` 4개 로케일 ko/en/zh/vi) + `backend/`(Express + MongoDB/Mongoose). 구조와 초기 세팅 배경은 `README.md`를 본다.

## 검증 명령

작업을 끝내기 전에 바꾼 영역의 명령을 모두 실행하고 결과를 보고한다.

| 영역 | 명령 |
|---|---|
| backend (`cd backend`) | `npm run lint`, `npm test` |
| frontend (`cd frontend`) | `npm run lint`, `npx next typegen && npx tsc --noEmit`, `npm run test:units`, `npm run build` |

알아둘 점:

- 프런트 `npm ci`는 락 파일이 맞지 않아 실패한다(`next-intl` 아래 `@swc/helpers` 항목 누락). 당분간 `npm install`을 쓴다. 락 파일 재생성은 별도 작업으로 한다.
- `next-env.d.ts`는 gitignore 대상이다. `next typegen` 없이 `tsc`를 돌리면 이미지 import에서 오류가 난다.
- 백엔드 테스트는 처음 실행할 때 mongodb-memory-server가 mongod를 내려받는다(네트워크 필요). 프런트 `build`는 Google Fonts에 접근할 수 있어야 한다.
- CI(`.github/workflows/ci.yml`)가 PR마다 lint, 타입체크, 테스트를 돌린다. build는 Vercel 프리뷰가 확인한다.

## 표준 원칙

1. 지시받은 범위를 넘어서는 판단(리팩터, 시드 데이터 확장, 발견한 버그 수정 등)은 자기 영역 안에서만 진행하고, 완료 보고에 "지시와 다르게 판단한 부분과 근거"를 따로 적는다. 사용자가 사후에 승인할 수 있어야 한다.
2. 디자인과 UI 작업은 사용자가 승인한 목업이나 스펙이 있을 때만 구현한다. 레이아웃, 필드, 톤을 임의로 바꾸지 않는다. 승인된 자료가 없으면 구현하지 말고 지시한 쪽에 되돌려 보낸다.
3. 시크릿과 자격증명 파일은 만들거나 커밋하지 않는다.
4. 미적 목표는 "AI가 만든 티가 안 나는" 전문적인 톤이다. Modern Corporate, Industrial Minimalism, Swiss International Style을 따르고 과한 그라디언트, 이모지, 장식은 피한다.
5. 완료 보고에는 항상 다음을 넣는다. 실행한 검증 명령과 결과, 지시와 다르게 판단한 부분과 근거, 알려진 한계. UI를 바꿨으면 라이트/다크(필요하면 모바일) 화면 캡처도 넣는다.

## 병렬 작업 규칙

여러 에이전트가 동시에 일할 때 지킨다.

1. worktree 하나에 에이전트 하나, 브랜치 하나, 작업 하나당 PR 하나로 간다.
2. 에이전트는 배정받은 디렉터리(`backend/` 또는 `frontend/`)만 수정한다. 반대편에 필요한 변경이 보이면 고치지 말고 보고한다.
3. 백엔드와 프런트가 함께 바뀌는 작업은 시작 전에 API 요청/응답 형태를 확정해 타입이나 문서로 남긴다. 확정되기 전에는 그것에 기대는 쪽을 시작하지 않는다.
4. `backend/src/controllers/shipment.controller.js`(1600줄 이상)는 한 번에 한 작업만 수정한다.
5. 배포는 백엔드를 먼저 반영하고 프런트를 나중에 반영한다.
6. 브랜치가 `main`보다 뒤처졌으면 먼저 병합하고 재검증한다.

## 자주 쓰는 관례

- **공개 도구 페이지**: `[locale]/(public)/<slug>/page.tsx` + `<slug>-client.tsx` + `PublicPageShell`. `middleware.ts`의 `LOCALIZED_SEGMENTS`에 새 슬러그를 추가해야 한다. 빠뜨리면 비영어 로케일에서 404가 난다.
- **로케일 메시지**: `frontend/src/messages/{ko,en,zh,vi}.json` 네 파일의 키를 항상 함께 맞춘다.
- **대시보드(내부) 데이터 훅**: `use-async-resource.ts`의 `useAsyncResource<T>(fetcher, fallbackMessage)` 패턴을 재사용한다.
- **PII 원칙**: 여러 건을 한 번에 보여주는 목록은 `customer` 등 연락처를 제외하고, 담당자가 건 하나를 처리하는 상세 화면은 포함한다. `backend/src/controllers/shipment.controller.js`의 `PII_EXCLUDED_FIELDS`를 본다. 경계 테스트는 `backend/tests/shipment.pii.test.js`에 있다.
- **큰 변경의 검증 기록**: `docs/reviews/<주제>-<날짜>.md` 형식으로 남기는 기존 방식을 따른다.
- **PR 준비**: PR 본문을 쓰고, Windows에서는 `Get-Content -Raw -Encoding UTF8 <path> | Set-Clipboard`로 복사한다(한글 깨짐 방지, `type | clip` 금지). `https://github.com/MINBBBB1201/jsl-project/compare/main...<branch>`에서 수동으로 PR을 만든다(`gh` CLI 미설치).

## 커밋 메시지

```
<type>(<scope>): <설명>
```

`Co-Authored-By` 줄은 사용하는 도구가 안내하는 값을 쓴다.

## 랜딩 레퍼런스 통합 작업

- 사용자의 기준은 한 슬라이드 = 한 레퍼런스의 전체 화면 구성이다. 임의로 요소를 모아 새 디자인을 만들지 않는다.
- 현재 승인된 초안과 변경/보존 범위는 `docs/landing/REFERENCE-INTEGRATION-DIRECTION.md`를 먼저 읽는다. 이 문서의 연결 방식은 제안이며 구현 승인과 구별한다.
- 히어로와 요청 밖의 장면을 변경하지 않는다. 이번 도구 준비 단계에서는 실제 랜딩 코드를 수정하지 않는다.
- 장비 동작은 동일 화면 크기의 시작·들기·적재·출발 캡처와 중간 프레임을 확인한다. 접촉 오류, 갑작스러운 비율 변화, 기존 흰 컨테이너 잔존이 있으면 수정 후 재검증한다.
- `tools/landing-review`에 MCP, 캡처 기준 템플릿, 프런트엔드 파일 해시 점검 도구가 있다. 파일 해시 차이가 나면 보고하며 사용자 변경을 자동 롤백하지 않는다.

## 참고

`SESSION_HISTORY.md`는 Cowork 시절의 작업 기록이라 일부가 낡았다(예: 백엔드 lint 설정과 컨트롤러 테스트 하네스는 지금 있다). 현재 상태는 코드, `docs/reviews/`, 이 파일을 기준으로 판단한다.
