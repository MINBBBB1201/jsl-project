# 실제 백엔드 배포 버전·고지 GET 판정 · 2026-10-27

공용 Render 서버는 기존 문의 계약을 사용한다. 실제 Live 커밋은 `7a32c958235f9ffb70d61c25432ecd34e73afbe6`이고, 이 커밋의 backend는 현재 main `c8c5489`의 backend와 Git tree가 같다. 새 고지 GET은 미병합 PR #25에만 있다. 따라서 현재 프런트 미리보기와 공용 백엔드의 새 문의 계약은 아직 맞지 않는다.

이번 `/health`는 200으로 응답했고 Mongoose 연결 상태 `connected`를 보고했다. 고지 GET의 추가 진단에서는 미등록 경로 문구와 개발용 오류 객체·스택 형식이 확인됐다. 이전 500을 정책 미승인이나 DB 장애로 단정하지 않고, **새 경로 미배포와 공통 오류 처리 문제**로 구분한다. DB 쿼리·저장 가능 여부와 이전 시간 초과의 원인까지 확정한 것은 아니다.

## 배포 식별 근거

- 검사 시작 PR #25 head: `4298bb19c03f1cabbefa965d5864eac472dc7e29`. base: `c8c5489a662ae9aab354335483332116f1962072`.
- 기존 Chrome의 GitHub 로그인으로 [Render 서비스](https://dashboard.render.com/web/srv-da0655tbedkc73a0hvh0)에 진입했다. 새 권한 동의나 플러그인 설치는 하지 않았다.
- 화면의 `Last successfully deployed commit` 링크와 `Live` 표시가 [7a32c958](https://github.com/MINBBBB1201/jsl-project/commit/7a32c958235f9ffb70d61c25432ecd34e73afbe6), [Live 배포](https://dashboard.render.com/web/srv-da0655tbedkc73a0hvh0/deploys/dep-dallrh6q1p3s739s9hlg)를 가리킨다. 서비스 URL도 기존 공개 API origin과 일치한다.
- 읽은 설정은 branch `main`, root `backend`, build `npm install`, start `npm start`, Auto-Deploy `On Commit`이다. Health Check Path 입력은 비어 있었다. 설정은 변경하지 않았다. 빈 입력만으로 Render 내부의 기본 검사 방식을 확정하지 않는다.
- `7a32c958:backend`와 `c8c5489:backend`는 모두 `0c1a92184d7197ab8f110e0980afefc3b81639f8`이다. PR #25의 backend tree는 `608aba8d8f312b751416f2906435ac136772f4dc`로 다르다. 오래된 커밋이라는 이유만으로 현재 main과 다른 백엔드라고 판단하지 않는다.

Render는 서비스의 Deploys 화면에서 현재 Live 배포와 배포 이력을 확인하도록 안내한다. 이번 SHA는 HTTP 응답으로 추측하지 않고 해당 화면에서 읽었다. [공식 배포 문서](https://render.com/docs/deploys)

## 공개 GET 결과

[Review 09](REVIEW-09.md)에서 확인한 공개 API origin과 preview Origin을 재사용했다. 첫 두 요청을 동시에 보냈고 각 45초 제한을 적용했다. 첫 500의 오류 형식이 분류되지 않아 고지 GET만 한 번 추가 진단했다. 자동 재시도나 다른 경로 탐색은 없었다.

| 요청 | 실제 결과 | 판정 범위 |
| --- | --- | --- |
| `GET /health` | 200, 약 33.95초, `status=ok`, `database=connected` | 해당 시점 HTTP 응답과 Mongoose 연결 상태를 확인. DB 쿼리·저장 가능 여부와 지속 가용성은 미검증 |
| `GET /api/contact/notice?language=ko` | 500, 약 34.19초, JSON | 정상 고지를 받지 못함. 첫 요약만으로 구체적인 오류 형식은 분류하지 못함 |
| 같은 고지 GET 추가 진단 1건 | 500, 약 1.80초. 알려진 미등록 경로 문구와 정확히 일치. `error` 객체·문자열 `stack` 존재 | 현재 등록되지 않은 경로의 오류 응답과 일치. DB 연결 오류 문구 및 `POLICY_NOT_READY`와 다름 |

세 응답 모두 요청한 preview origin과 CORS 허용 origin이 같았다. 실제 브라우저 CORS·저장·문의 제출을 검증한 결과는 아니다. 현재 지연이 무료 인스턴스의 시작 때문인지 별도 로그로 확인하지 않았으며, 지난 30초 시간 초과를 이번 수치만으로 설명하지 않는다.

원문 응답·스택·쿠키 값·인증 값은 보관하지 않았다. 오류 본문은 메모리에서 알려진 문구와 비교하고, 증빙에는 일치 여부와 알려진 필드의 존재만 기록했다. 실제 문의 POST·업무 데이터 조회는 하지 않았다. [선별한 증빙](evidence/review-10/backend-deployment.json), [GET 도구](evidence/review-10/probe.cjs).

## 소스와 응답의 연결

배포된 [`contact.routes.js:16`](https://github.com/MINBBBB1201/jsl-project/blob/7a32c958235f9ffb70d61c25432ecd34e73afbe6/backend/src/routes/contact.routes.js#L16)는 POST만 등록한다. 새 GET은 PR #25의 `contact-inquiry.router.js`에 있으며, 승인 고지 없음은 503 `POLICY_NOT_READY`, 잘못된 언어는 400이다.

배포된 [`server.js:152`](https://github.com/MINBBBB1201/jsl-project/blob/7a32c958235f9ffb70d61c25432ecd34e73afbe6/backend/src/server.js#L152)는 미등록 경로를 상태 없는 `new Error(...)`로 넘긴다. [`error.middleware.js:58`](https://github.com/MINBBBB1201/jsl-project/blob/7a32c958235f9ffb70d61c25432ecd34e73afbe6/backend/src/middleware/error.middleware.js#L58)는 기본 500을 적용한다. 61행의 development 분기는 31행의 개발용 응답을 사용한다. 공개 응답은 이 분기와 일치하지만 환경 변수 값 자체는 조회하지 않았다.

따라서 Mongoose 연결 상태가 `connected`여도 없는 경로는 500이 될 수 있다. 이전 [호환성 메모](CONTACT-API-COMPATIBILITY.md)의 ‘이전 백엔드에서 새 GET이 404’라는 예상은 잘못됐으므로 바로잡았다. DB 재연결 실패도 다른 500 경로로 존재하지만, 이번 추가 진단의 문구는 그 분기와 일치하지 않는다. 별도 필수 항목 검토 세션도 읽기 전용 검토에서 미등록 경로의 기본 500 처리를 확인했다. 해당 세션은 이번 운영 GET을 재실행하지 않았다.

## 다음 완료 조건

1. [이슈 #41](https://github.com/MINBBBB1201/jsl-project/issues/41)에서 미등록 경로의 명시적 404와 공개 오류 스택 제거를 다룬다. 앱 소스·운영 환경은 이번 문서 회차에서 수정하지 않았다. 수정 후 실제 배포 상태도 별도로 확인해야 한다.
2. 회사가 실제 문의 고지·수집 항목·보유/삭제 운영·담당 채널·업체/국가를 확정한다. 정책 파일과 DB 인덱스, 구/신 프런트의 이행·되돌림 계획을 맞춘 뒤 프런트와 백엔드의 같은 계약을 배포한다. 현재 PR #25를 바로 배포하면 된다고 결론 내리지 않는다.
3. 접근 가능한 최종 통합 배포에서 고지와 실패 UI, 언어·키보드·저장소를 검수한다. 실제 접수 저장·알림은 승인된 검증 환경에서 확인한다.

검사 범위: Git tree·소스 SHA-256·JSON·문서 링크·변경 범위 확인과 공개 GET 3건이다. 새 단위 테스트·타입·lint·build·DB 테스트·앱 브라우저 흐름은 실행하지 않았다. UI·디자인·애니메이션·라우팅·의존성·앱 소스는 보존했다. 운영 로그·비공개 환경값 조회, 설정 변경·재시작·main 병합·운영 배포는 없다. PR #25는 Draft를 유지한다.
