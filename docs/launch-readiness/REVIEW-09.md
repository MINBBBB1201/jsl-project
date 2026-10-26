# 실제 배포의 문의 고지 API 읽기 검토 — 2026-10-26

실제 프런트 번들의 API 주소와 고지 GET을 대조했다. CORS 사전요청은 204였지만 고지 GET은 정상 응답을 확인하지 못했다. 네 언어의 첫 요청은 시간 초과, 한국어 한 번의 재시도는 500이었다. 정책 미승인 응답으로 예상하는 503과 구분하고, 원인을 추측해 소스나 운영 설정을 바꾸지 않았다.

## 배포·주소 확인

- 검사한 head는 `72bd36680c8a3caf8092b12c736ae60a332a18b4`다. Vercel `dpl_AerhNGFkUoJAFy4wrDvktB1rxEpu`의 READY 및 git SHA 일치를 확인했다. 고유 hostname은 `jsl-logistics-frontend-cg29qwmas-minbbbb1201s-projects.vercel.app`이다.
- 기존 승인 연결로 실제 `/landing` HTML을 읽고 그 문서가 참조하는 JS 26개 중 6개를 읽었다. 코드 문자열을 정적으로 확인했으며 실행·source map·비공개 환경 변수 조회는 하지 않았다.
- 문의 호출이 있는 chunk는 `60ca618a3b659166.js`이며 `to=e.i(9165)`를 통해 `API_BASE_URL`을 사용한다. `e368cc43d64ba295.js`의 모듈 9165가 실제 API origin을 `https://jsl-logistics-backend.onrender.com`으로 export한다.
- 따라서 개발 기본값이나 추측한 호스트로 검사하지 않았다. [번들 근거](evidence/review-09/public-api-origin.json)에 필요한 export 한 줄과 연결 관계만 남겼다. HTML·번들 전체와 인증 값은 파일에 보관하지 않았다.

## 실행한 읽기 요청

미리보기의 고유 origin을 `Origin` 헤더로 사용했다. 인증·고객 데이터는 보내지 않았다. 실제 문의 POST와 업무 데이터 읽기·쓰기는 하지 않았다. OPTIONS의 `Access-Control-Request-Method: POST`는 향후 요청에 대한 사전 확인이며 문의 제출이 아니다.

| 요청 | 관찰한 응답 | 확인할 수 있는 범위 |
| --- | --- | --- |
| `GET /api/contact/notice?language=ko` | 첫 요청 30초 제한에서 TimeoutError | HTTP 상태·고지값을 이 결과로 확인하지 못함 |
| 같은 GET, `en`·`zh`·`vi` | 각 30초 제한에서 TimeoutError | 세 언어의 HTTP 상태·고지 미확인 |
| `OPTIONS /api/contact` | 204 | 요청한 preview origin과 일치하는 CORS origin, POST 및 `content-type,idempotency-key` 허용 헤더 확인 |
| 한국어 고지 GET 한 번 재시도 | 약 1.27초 뒤 500, JSON, 요청 origin과 일치하는 CORS 헤더 | 정상 고지 응답이 아님. 원시 오류·본문을 보관하지 않아 구체적인 서버 원인은 확정하지 않음 |

첫 네 GET은 독립적인 언어 요청을 동시에 보냈다. 사전요청 성공 후 한국어만 한 번 재시도했고 반복 호출하지 않았다. [응답 요약](evidence/review-09/api-readonly.json)에 방법·상태·시간·허용 헤더 이름과 제한을 남겼다. 원문·쿠키 값·요청 본문은 보존하지 않았다.

## 코드 계약과 판정

현재 코드의 `contact-inquiry.router.js`는 고지가 준비되지 않으면 503 `POLICY_NOT_READY`, 잘못된 언어면 400, 준비된 고지면 200을 반환한다. 이번에 관찰한 500은 이 정책 미승인 분기와 다른 결과다. 실제 backend commit·환경·로그·DB 상태는 조회하지 않았으므로 특정 버전, DB 장애, cold start, 설정 누락 중 어느 것이 원인인지 단정하지 않는다. 404를 관찰한 것도 아니므로 이전 API 버전이라고 확정하지 않는다.

`ContactSection`은 고지 GET에 10초 AbortController 제한을 두고, 응답 실패나 잘못된 고지면 준비 중 상태를 유지하도록 작성돼 있다. 이번 읽기 결과에서는 접수를 활성화할 정상 고지를 확인하지 못했다. 이는 코드상 예상 동작이며 실제 브라우저의 최종 표시를 재현한 결과는 아니다.

CORS 사전요청 204는 필요한 헤더가 허용된다는 범위의 근거다. 서버 저장 가능, 정책 승인, POST 성공, 실제 브라우저 CORS 통과를 의미하지 않는다. 이전 [API 호환성 메모](CONTACT-API-COMPATIBILITY.md)의 프런트·백엔드 계약 일치 조건은 여전히 남아 있다.

## 필요한 후속 조치와 경계

1. 운영 담당자가 backend의 실제 배포 revision, 고지 GET의 500 원인과 서비스 상태를 확인한다. 로그를 검토하게 되면 개인정보·접속 정보·연결 문자열을 제거해야 한다. 이번에는 운영 로그를 읽지 않았다.
2. 고지 endpoint가 현재 프런트의 계약에 맞는지 확인한다. 관련 경로는 `frontend/src/lib/api.ts`, `contact-section.tsx`, `backend/src/routes/contact.routes.js`, `contact-inquiry.router.js`지만, 이 결과만으로 수정할 소스 파일을 확정할 수 없다. 실제 서버를 재시작·재배포하지 않았다.
3. 회사가 보유기간·필수/선택 필드·담당 채널·업체·국가·삭제 운영을 승인한 뒤 고지 파일과 개인정보처리방침을 맞춘다. 정책 승인만 하면 현재 500도 해결된다고 쓰지 않는다.
4. 접근 가능한 브라우저 경로에서 고지 GET·실패/준비 중 UI·언어/테마·키보드·스토리지를 재검수한다. 실제 문의 제출은 별도로 승인된 검증 환경에서 확인한다.

새 브라우저·개발 서버·build·패키지 설치·계정·보호 설정 변경은 없었다. 앱·디자인·정책·검수 도구는 보존하고 문서·증빙만 변경했다. 기존 유닛·DB·16화면 검사를 이번 결과로 재사용하지 않는다. main 병합·운영 배포 없이 PR #25는 Draft를 유지한다.
