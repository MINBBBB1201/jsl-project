# 나머지 API 호출부의 공통 오류 문구 · 2026-10-29

[이슈 #45](https://github.com/MINBBBB1201/jsl-project/issues/45)의 후속이다. PR #44가 인증·대시보드 공통 조회·공개 화물 조회에 연결한 `getApiErrorMessage`를 별도 호출부 6개 파일에도 연결해, 서버의 공통 오류 `status`/`message`가 화면에 보이게 했다. 기준 main은 `51da2816d0240a60e87e028794b9ebe2535367d6`이다.

## 변경

| 파일 | 바뀐 곳 |
| --- | --- |
| `announcements/api.ts` | `request`가 던지는 `ApiError` 문구 |
| `lib/trade-documents/api.ts` | `request`가 던지는 `ApiError` 문구 |
| `trade-documents/components/new-document-dialog.tsx` | `findShipment`가 던지는 오류 문구 |
| `notices/use-public-notices.ts` | 공개 공지 조회 실패 문구 |
| `damage-inspection/use-damage-inspection.ts` | 판정 실패, 429, 이력 조회 실패 문구 3곳 |
| `chat/use-ai-chat.ts` | 채팅 오류 말풍선 문구 |

모두 `getApiErrorMessage(json, 기존 대체 문구)` 한 줄로 바꿨다. 기존 대체 문구와 호출부 구조는 그대로다.

## 보존한 것

- **AI 채팅의 순서.** 채팅은 `errors[0].msg`를 `error`보다 먼저 보여 줬다. 공통 helper는 `error`를 먼저 읽으므로 그대로 쓰면 순서가 바뀐다. 그래서 채팅 파일에 `firstValidationMessage`를 두어 첫 검증 오류를 먼저 읽고, 없을 때만 helper를 쓴다.
- **파손 판정.** 429의 `isRateLimited` 표시와 재시도 안내 대체 문구, 성공 시 결과 반환, 연결 실패 문구는 바꾸지 않았다.
- **무역서류 화물 조회의 404.** `null`을 돌려주는 동작을 유지한다.
- **`ApiError`의 `status`와 `code`**, 성공 응답, 인증 만료 처리(`apiFetch`의 쿠키 지우기)는 건드리지 않았다.

## 의도한 동작 변화

- 서버가 `error`에 객체를 보내면 기존에는 `ApiError`·`Error` 호출부에서 `[object Object]` 문구가 됐고, 훅 호출부(공개 공지, 파손 판정, 채팅)에서는 객체가 그대로 오류 상태에 들어갔다(fixture로 확인). 이제는 모두 HTTP 대체 문구가 표시된다.
- 무역서류 화물 조회, 공개 공지, 파손 판정은 기존에 `errors`를 읽지 않았고, 이제 첫 검증 메시지를 읽는다.
- 채팅에서 `errors[0].msg`가 빈 문자열이면 기존 코드(`??` 연산)는 빈 말풍선을 만들었고, 이제는 다음 후보(`error`, 공통 `message`, 대체 문구)로 넘어간다. 이 경우는 코드 읽기 기준이며 fixture에는 넣지 않았다.

## 검사와 재현

재현 도구: `node tools/frontend-review/check-remaining-api-error-callers.cjs --output <결과.json>` (저장소 루트에서 실행). 실제 호출부 소스를 TypeScript로 변환해 fetch 대체 fixture로 돌리고, 훅은 최소 런타임으로 한 번 실행한다. 기준 커밋의 소스와 작업 트리의 소스를 같은 fixture로 비교한다. 결과는 `docs/reviews/evidence/frontend-error-callers-20261029/validation.json`에 있다.

- **수정 전 재현:** 기준 커밋에서 공통 400·403·404·413·500, 객체 오류, 검증 메시지, 429 공통 오류 **47조건이 모두** 기대 문구가 아닌 대체 문구, `[object Object]`, 또는 객체 그대로로 나온다.
- **수정 후:** 같은 47조건이 모두 통과한다.
- **보존 확인:** 기존 `error` 문구, 첫 검증 메시지, 두 필드가 함께 올 때의 우선순위(채팅은 검증 메시지 먼저), HTML·빈 응답 대체 문구, 성공 경로, 429 표시, 404 `null`, `ApiError`의 `status`·`code` **43조건이 수정 전후 모두 통과**한다.
- 프런트 순수 유닛 **91개 통과**. 프런트 전체 ESLint 통과. 전체 TypeScript 검사 통과(오류 0건). 새 worktree에는 Next가 만드는 `next-env.d.ts`가 없어 이미지 모듈 선언 오류 15건이 났고, 무시 대상인 이 파일을 복사한 뒤 0건이 됐다. 변경한 6개 파일에는 처음부터 오류가 없었다.

## 하지 않은 검사

- `next build`와 브라우저 확인, React 실제 렌더링은 실행하지 않았다. 훅은 최소 런타임으로 한 번 실행했을 뿐이다.
- 실제 API 요청, AI 호출, 채팅 전송, 이미지 업로드, 문서 발급, 업무 데이터 쓰기는 하지 않았다. 모든 검사는 fixture다.
- 서버의 모든 오류 메시지가 공개에 적합한지는 전수 검사하지 않았다. 프런트는 서버가 공개 문자열로 보낸 기존 오류를 그대로 표시한다.

## 범위

디자인, 라우팅, 권한, 백엔드, 문의 계약, 의존성, lockfile은 바꾸지 않았다. 다른 회사 모델의 교차 리뷰가 끝나기 전까지 Draft로 유지한다.
