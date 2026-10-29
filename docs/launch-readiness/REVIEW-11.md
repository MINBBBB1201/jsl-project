# 최신 main 통합과 기술 검수 — 2026-10-29

기존 PR #25 head `aeea67f3116cc2de41c11af3266727d3d4846b28`에 main `98d8f248563158585c4228c77b122a45187c4b5e`를 병합했다(병합 커밋 `a2c892c`). rebase와 강제 푸시는 하지 않았다. 이 문서는 기술 검수 결과이며 법률상 적합성이나 출시 승인이 아니다. PR은 Draft다.

## 통합 내용

- 병합된 main 변경: #42(공개 오류 응답·미등록 경로 404·파서 오류), #44/#46(공통 오류 `message` 표시), #27(루트 레이아웃·`<html lang>`), #33(푸터 공지 링크).
- 충돌은 `frontend/tsconfig.test.json` 한 곳이었다. main의 `api-error` 테스트 두 줄과 이 PR의 `contact-inquiry*.ts` 한 줄이 같은 `include` 목록의 같은 위치를 바꿨다. 세 항목을 모두 남겼다. 병합 후 단위 테스트 목록에 `contact-inquiry`, `contact-inquiry-retry`, `api-error` 테스트가 모두 있다.
- `backend/src/server.js`는 자동 병합됐고 의미도 확인했다. 전역 body parser(문의 경로는 건너뜀) → `/api/contact` 라우터 → `notFoundHandler` → `errorHandler` 순서이며, 문의 라우터의 파서 오류(`INVALID_JSON`, `BODY_TOO_LARGE`)는 라우터 안에서 처리되어 전역 처리기와 충돌하지 않는다.
- 문의 컴포넌트는 `api-error` 헬퍼를 쓰지 않는다. 응답의 `code`를 직접 읽고 언어별 안내 문구를 쓰므로 #44/#46과 겹치지 않는다. 기존 문의 구현은 바꾸지 않았다.
- 추가한 변경은 `backend/tests/contact-readiness.node.cjs`의 회귀 테스트 1건이다. server.js와 같은 순서로 공통 처리기를 붙여, 문의 라우터에 없는 하위 경로와 다른 미등록 경로가 공통 404 문구를, 문의 POST의 잘못된 JSON·32KB 초과가 문의 전용 코드를, 문의 밖 경로의 잘못된 JSON·10KB 초과가 공통 400/413 문구를 유지하는지 확인한다.

## 직접 실행한 검사

공유 heavy 잠금을 확인·작성하고 한 번에 하나씩 실행했으며 `TEMP`/`TMP`는 D:에 두었다. 기존에 설치된 의존성과 MongoDB 바이너리를 재사용했고 자동 다운로드나 설치는 하지 않았다.

| 검사 | 결과 |
| --- | --- |
| frontend `tsc --noEmit --incremental false` | 통과 |
| frontend `eslint .` | 통과 |
| frontend `npm run test:units` | 105/105 통과 |
| backend `npm run test:contact` | 18/18 통과(위 회귀 테스트 포함). 처음 작성한 회귀 테스트는 오류 처리기를 불러올 때 설정 모듈이 `MONGO_URI`를 요구해 실패했고, 기존 알림 테스트와 같은 방식으로 logger만 대체해 고쳤다 |
| backend 기본 jest(`--runInBand`) | 6개 스위트 160/160 통과 |
| backend `eslint .` | 통과 |
| 문의 브라우저 하네스 | 16개 상태의 axe 자동 위반 0건, 6개 흐름 통과 |
| Next production build (기본 Turbopack) | 실패. 원인은 이 worktree의 `frontend/node_modules`가 메인 체크아웃을 가리키는 junction이라 Turbopack이 "저장소 루트 밖을 가리키는 symlink"로 거부한 환경 문제다. 소스 오류는 아니다 |
| Next production build (`next build --webpack`) | 통과: 컴파일, TypeScript, 78개 정적 페이지 생성. 운영이 쓰는 Turbopack과 다른 번들러이므로 소스가 빌드된다는 근거이지 운영 빌드의 동일 재현은 아니다 |

브라우저 하네스의 6개 흐름은 다음과 같다. 고지 GET 후 폼이 활성화되고 필수 항목이 비면 오류에 포커스가 간다, 접수 후 재전송은 새 문의가 된다, 응답 유실 뒤 새로고침하고 같은 내용을 재입력·재동의하면 `replayed=true`와 같은 접수번호를 받고 DB 문서 수가 늘지 않는다, 고지가 바뀌면 재동의가 필요하다, DB 저장 실패 시 접수번호를 보여주지 않는다, 미승인 정책이면 온라인 접수가 비활성이다. 실제 ContactSection, Express 라우터, 폐기 가능한 MongoDB 7.0.24를 썼고 운영 DB·계정·메일은 쓰지 않았다.

미승인·fixture 정책의 production 차단은 `test:contact`의 "unapproved and fixture production policies are blocked"와 브라우저 흐름으로 확인했고 바꾸지 않았다. 운영 라우트는 fixture 허용 옵션을 노출하지 않는다.

## 화면 비교

병합 후 하네스가 만든 한국어 라이트·다크 × 데스크톱·모바일 캡처 4장은 이전 증빙(`evidence/review-03`, `evidence/review-07`)과 SHA-256이 같다. 이 비교는 병합이 문의 컴포넌트의 이 합성 화면을 바꾸지 않았다는 뜻이다. 합성 정책 문구가 들어간 컴포넌트 단독 화면이며 실제 랜딩 페이지의 배치나 승인된 운영 고지를 검증한 것이 아니다. 새 캡처는 이전과 동일해서 저장소에 다시 추가하지 않았다.

## 실행하지 못했거나 구분해야 하는 것

- 운영 빌드와 같은 Turbopack 빌드는 로컬에서 통과하지 못했다. 위 환경 문제 때문이며, 원격 Vercel preview 빌드 결과는 PR의 체크에서 확인한다. 이 문서를 쓰는 시점에 통합 head `329f087`의 preview는 배포 중이었고 통과로 쓰지 않는다.
- 하네스는 Next 라우팅·서버 렌더링·hydration·운영 폰트·배포 origin/CORS를 검증하지 않는다. webpack 빌드는 컴파일과 정적 생성까지만 본다.
- 합성 정책과 임시 DB 검사는 실제 배포 동작이 아니다. 실제 Render의 문의 API와 승인된 고지로 검증한 것이 없다.
- 이슈·PR 댓글은 게시하지 않았다.

## 후속 후보(이번 범위에서 고치지 않음)

- 이 worktree의 `node_modules`가 junction이라 Turbopack 빌드가 불가능하다. 별도 작업 폴더에서 설치한 의존성으로 빌드하거나 원격 빌드를 기준으로 삼아야 한다.
- 성공 직후 폼 값이 남아 있어 같은 내용을 의도 없이 다시 누르면 새 문의로 접수된다([REVIEW-04](REVIEW-04.md)에서 밝힌 한계). 폼 비우기는 UI 변경이라 하지 않았다.
- 운영자 알림 재시도 작업, 스팸·속도 제한은 계획된 범위 밖이다.

## 배포 준비

통합 head 기준의 배포 순서·호환성·인덱스 준비·되돌림·운영 입력은 [CONTACT-API-COMPATIBILITY.md](CONTACT-API-COMPATIBILITY.md)의 "2026-10-29 최신 main 통합 후 배포 체크리스트"에 정리했다. 보유기간·담당자·처리업체·국가·시행일·고지 승인값은 회사 입력이며([#40](https://github.com/MINBBBB1201/jsl-project/issues/40)) 이 작업에서 만들지 않았다.
