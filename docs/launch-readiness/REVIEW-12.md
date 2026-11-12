# 검토 결함 1 수정과 main 재통합 — 2026-11-12

PR #25 head `f6c48b2`에서 이어간다. PR은 Draft이고, 이 문서는 기술 검수 기록이지 법률상 적합성이나 출시 승인이 아니다.

## 변경

- `8a8b8ac` fix(contact): PR #25 Claude Opus 5.5 검토의 결함 1(낮음)을 고쳤다.
  - 문제: 프런트 zod 이메일 검사는 통과하지만 서버 `isEmail()`은 거부하는 입력(로컬 부분 65자 이상 등)이 있다. 이때 서버가 400 `VALIDATION_FAILED`를 보냈는데, 화면은 "접수 여부를 확인하지 못했습니다. 같은 내용으로 다시 시도해 주세요"를 보여줬다. 그래서 재시도가 계속 실패했다.
  - 수정: `readInputRejection`(`contact-inquiry.ts`)이 400 `VALIDATION_FAILED`를 입력 오류로 구분하고, 서버가 지목한 입력 필드만 돌려준다. 폼은 `copy.invalid` 안내를 띄우고 해당 입력란에 오류를 표시한다. `INVALID_JSON`, `INVALID_REQUEST_KEY`, 409, 5xx는 기존 처리 그대로다. 문구는 기존 4개 언어 `invalid` 문구를 재사용했다.
- `7be215e` main `8a615c8`(#38 내부 메뉴·로그인 보호, #48 직원 아이디 로그인)을 병합했다. 충돌은 없었다. 변경 파일 중 문의 기능과 겹치는 파일은 없다.

회사 정책 입력(#40)은 사용자 지시에 따라 현재 정보로 두었고, 새 값이나 승인 정책 파일을 만들지 않았다.

## 직접 실행한 검사 (병합 후 head 기준)

| 검사 | 결과 |
| --- | --- |
| frontend `tsc --noEmit`, `eslint .` | 통과 |
| frontend `test:units` | 106/106 통과(새 입력 거부 판별 테스트 포함) |
| backend `eslint .` | 통과 |
| backend `test:contact` | 18/18 통과 |
| backend jest(`--runInBand`) | 7개 스위트 173/173 통과 |
| 문의 브라우저 하네스 | 16개 상태 axe 위반 0건, 6개 흐름 통과 |
| `next build --webpack` | 통과(78개 정적 페이지) |

공유 heavy 잠금에 11월 8일 Codex 잠금이 102시간째 남아 있었다. 실행 중인 빌드·테스트·DB 프로세스가 없어 README 규칙(45분 미만만 대기)에 따라 오래된 잠금으로 보고 넘겨받았고, 끝난 뒤 지웠다.

## 미검증

- 새 입력 오류 표시는 순수 함수 단위 테스트로만 확인했다. 브라우저 하네스에는 서버가 400으로 거부하는 이메일 흐름이 없다.
- Turbopack 빌드는 이 worktree의 `node_modules` junction 때문에 로컬에서 불가하다. 원격 Vercel preview 결과는 PR 체크에서 확인한다.
- Next 라우팅·SSR, 실제 배포 동작, 승인된 운영 고지는 검증하지 않았다.
