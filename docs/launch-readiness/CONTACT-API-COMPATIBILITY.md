# 공개 문의 API 호환성 메모 — `POST /api/contact`

작성 2026-10-23. 코드 계약은 바꾸지 않고 `origin/main`(c8c5489)과 이 브랜치(a3321cf)의 소스 차이를 기록한다. 이 브랜치의 변경은 기존 계약과 호환되지 않으며 버전 구분이나 이행 경로가 없다. 병합·배포 전에 이 점을 알고 있어야 한다.

## 계약 비교

| 항목 | main (기존) | 이 브랜치 |
| --- | --- | --- |
| 요청 헤더 | `Content-Type: application/json`만 사용 | `Idempotency-Key` 필수(`[A-Za-z0-9_-]{8,128}`), 없거나 형식이 틀리면 400 `INVALID_REQUEST_KEY` |
| 본문 | `companyName?`, `contactName`, `email`, `subject?`, `message` | 위 필드에 `consent` 객체 필수: `accepted: true`, `noticeId`, `noticeHash`, `language` |
| 알 수 없는 필드 | 무시(컨트롤러가 알려진 필드만 사용) | 400 `UNEXPECTED_FIELD` |
| 고지에 없는 선택 항목 | 제한 없음 | 값이 있으면 400 `UNDISCLOSED_FIELD` |
| Content-Type | JSON이 아니면 본문이 비어 400 | 415 `JSON_REQUIRED` |
| 본문 크기 | 전역 10KB | 문의 경로만 32KB, 초과 시 413 `BODY_TOO_LARGE` |
| 성공 | 201 `{ success, data: { id, createdAt }, message }` | 신규 201, 같은 키 재전송 200 `{ success, data: { id, createdAt, status }, replayed }`. `message` 없음 |
| 검증 실패 | 400 `{ success: false, errors: [express-validator 항목] }` 또는 `{ error }` | 400 `{ success: false, code: "VALIDATION_FAILED", errors: [{ field, code }] }`. 항목 모양이 다름 |
| 고지 변경 | 해당 없음 | 409 `VALIDATION_FAILED` 안에 `NOTICE_CHANGED`. 같은 키에 다른 내용은 409 `REQUEST_KEY_CONFLICT` |
| 서버 오류 | 500 `{ success: false, error, details? }` | 503 `POLICY_NOT_READY`, `SAVE_FAILED`, `REQUEST_FAILED`. 500과 `details`는 쓰지 않음 |
| 신규 경로 | 없음 | `GET /api/contact/notice?language=ko|en|zh|vi` (200, 400 `INVALID_LANGUAGE`, 503 `POLICY_NOT_READY`) |
| 운영자 알림 | `notifyNewContact`: "신규 문의: 회사명 또는 담당자명" | `notifyContactReceipt`: "신규 문의 접수 번호: ID". 이름·회사명을 알림에 복제하지 않음 |

기본 상태에서는 `CONTACT_POLICY_PATH`가 없거나 언어별 고지가 승인되지 않아 모든 POST가 503이다. 접수를 켜려면 승인된 운영 고지 파일과 서버 재시작이 필요하다.

## 영향

- 저장소 안의 호출자는 `ContactSection` 하나뿐이고 이 브랜치에서 같은 변경으로 새 계약에 맞췄다(`grep "api/contact"`로 확인). 저장소 밖의 호출자(외부 연동, 스크립트, 이전에 캐시된 프런트 번들)는 확인할 수 없다.
- 이전 프런트가 새 백엔드를 호출하면 `consent.language`가 없어 400 `INVALID_LANGUAGE`로 실패한다. 새 프런트가 이전 백엔드를 호출하면 등록되지 않은 `GET /notice`가 500으로 응답해 폼이 "준비 중" 상태로 접수를 막는다. 이전의 404 예상은 공통 오류 처리 소스를 반영하지 못해 2026-10-27 바로잡았다. 두 방향 모두 데이터가 잘못 저장되지 않고 접수가 막히는 쪽으로 실패한다.
- 따라서 프런트와 백엔드는 같은 배포 단위로 올려야 한다. 한쪽만 먼저 올리면 그 사이 문의를 받을 수 없다.
- 응답 `message`와 `details`, 오류 본문의 `error` 문자열에 의존하던 클라이언트는 깨진다.
- 저장소의 `backend/src/controllers/contact.controller.js`는 이 브랜치에서 더 이상 연결되지 않는다(`notifyNewContact`의 호출처도 이 컨트롤러뿐).

## 데이터와 되돌림

- 스키마 변경은 추가형이다. `consent`, `inquiryRequestKey`, `inquiryFingerprint`, `status`는 선택 필드이고 기존 문의에 동의를 만들어 채우지 않는다. 기존 레코드는 읽기·표시에 영향이 없다.
- 새 부분 고유 인덱스 `contact_inquiry_request_unique`가 있어야 저장한다. 없으면 `saveOnce`가 거부해 503이 된다. 인덱스는 Mongoose 기본 `autoIndex`로 만들어진다(코드에서 끄지 않음). 운영 DB에서 `autoIndex`나 인덱스 생성 권한을 제한했다면 배포 전에 직접 만들어야 한다. 이 점은 운영 구성에서 확인한 사실이 아니다.
- 코드를 되돌려도 인덱스와 새 필드는 DB에 남는다. 남아도 이전 코드가 동작하는 데 지장은 없다. 인덱스 제거 여부는 별도로 결정한다.

## 필요하면 고려할 이행 방식

아래는 선택지일 뿐 이 브랜치에서 구현하지 않았다.

1. 새 계약을 `/api/v2/contact` 같은 별도 경로나 버전 헤더로 분리하고 기존 경로는 일정 기간 유지한다.
2. 기존 경로를 유지하지 않기로 결정했다면 외부 호출자가 없음을 먼저 확인하고, 배포 시 프런트·백엔드를 함께 올린다고 릴리스 절차에 적는다.

어느 쪽으로 할지는 사용자 결정이다.

## 2026-10-26 실제 고지 GET 보완

[Review 09](REVIEW-09.md)에서 `72bd366` exact-head 프런트 번들이 사용하는 공개 API 주소를 확인하고 읽기 요청만 보냈다. 네 언어의 첫 GET은 30초 제한에서 시간 초과였고 한국어 한 번 재시도는 500 JSON이었다. OPTIONS는 204이며 해당 preview origin과 `content-type,idempotency-key`를 허용했다. 실제 POST는 하지 않았다.

아래 두 문단은 10월 26일 당시의 판정이다. 경로 누락의 404 예상과 배포 revision 미확인은 아래 10월 27일 조사 결과로 정정됐다.

이 결과는 고지 GET을 아직 정상 확인하지 못했다는 근거다. 정책 미승인의 예상 503, 경로 누락의 404와 혼동하지 않는다. 실제 backend revision·환경·로그·DB 상태는 확인하지 않아 원인을 단정하지 않는다. 사전요청 허용을 계약 일치·서버 저장·브라우저 성공으로 해석하지 않는다. 코드 계약 표는 그대로이며 새 결과로 자동 변경하거나 운영 배포하지 않았다.

최신 main `c8c5489`에는 GET `/notice`가 없고 PR #25에는 있다. PR #25는 미병합이며 공용 Render에 어느 backend revision이 배포됐는지는 미확인이다. 두 소스 모두 CORS 뒤·라우트 앞의 DB 재연결 미들웨어에서 500을 반환할 수 있으므로, 이번 500으로 새 GET의 배포 여부나 새 코드 결함을 판정하지 않는다. 새 계약 미배포 가능성과 기존 미들웨어/실제 배포 상태의 실패를 분리해 확인해야 한다.

## 2026-10-27 배포 버전·미등록 경로 확정

[Review 10](REVIEW-10.md)에서 Render의 Live 커밋 `7a32c958`을 확인했다. 해당 backend tree는 현재 main과 같고 새 고지 GET은 없다. `/health`는 200·Mongoose 연결 상태 `connected`, 고지 GET의 추가 진단은 미등록 경로 문구·개발용 오류 객체·스택이 있는 500이었다. ‘이전 백엔드의 새 GET은 404’라는 예상은 잘못됐으며, 없는 경로의 `new Error`가 기본 500이 되는 공통 처리와 일치한다. DB 쿼리·저장 가능 여부와 과거 시간 초과의 원인은 확정하지 않았다.

현재 계약 미배포와 [공개 오류 처리 문제 #41](https://github.com/MINBBBB1201/jsl-project/issues/41)를 분리했다. 운영 고지 승인·DB 인덱스·구/신 호출자 이행과 함께 프런트/백엔드 배포를 준비해야 한다. 이번에는 문의 POST·설정·배포를 실행하지 않았다.

## 2026-10-29 최신 main 통합 후 배포 체크리스트

기준: main `98d8f248`을 병합한 통합 head. 위 계약 표와 코드 계약은 변경하지 않았다. [#41](https://github.com/MINBBBB1201/jsl-project/issues/41)(미등록 경로 500)는 main의 #42로, #43/#45(공통 오류 문구)는 #44/#46으로 해결되어 이 목록의 미해결 항목이 아니다. 아래 "확인한 사실"은 이 문서를 쓴 세션이 직접 읽거나 실행한 것이고, "기록에 근거"는 GitHub 이슈 댓글의 기록을 인용한 것이다.

**현재 계약 호환성**

- 확인한 사실(소스·테스트): 통합 head에서 문의 라우터에 없는 하위 경로(`GET /api/contact/unknown`)와 다른 미등록 경로는 공통 404 `{ status: "fail", message: "Route not found." }`다. 문의 POST의 잘못된 JSON은 400 `INVALID_JSON`, 32KB 초과는 413 `BODY_TOO_LARGE`로 문의 전용 코드를 유지하고, 문의 밖 경로의 10KB 초과는 공통 413 문구를 쓴다. `test:contact`의 "shared 404 and parser handlers" 테스트가 이 조합을 고정한다.
- 기록에 근거([#41 댓글](https://github.com/MINBBBB1201/jsl-project/issues/41)): 공용 Render의 Live 백엔드는 `52e600f`(#42)이고 새 고지 GET이 없는 경로에서 404였다. 따라서 이 시점부터 "새 프런트 + 이전 백엔드"의 고지 GET은 위 2026-10-27 문단의 500이 아니라 404이며, 폼은 어느 쪽이든 "준비 중" 상태로 접수를 막는다. 이 문서를 쓴 세션이 운영 응답을 직접 확인한 것은 아니다.
- "이전 프런트 + 새 백엔드"의 POST는 `consent.language`가 없어 400 `INVALID_LANGUAGE`다(소스 기준). 데이터는 저장되지 않는다.

**배포 순서와 중간 상태**

1. 회사가 승인한 4개 언어 고지 JSON을 준비하고 서버의 `CONTACT_POLICY_PATH`로 연결한다(운영 입력, 아래 참조). 승인 전에는 모든 POST가 503이다.
2. DB에 부분 고유 인덱스 `contact_inquiry_request_unique`(`inquiryRequestKey` 오름차순, `inquiryRequestKey`가 문자열일 때만)를 준비한다. 기본 Mongoose `autoIndex`가 켜져 있으면 서버 시작 시 생성되지만, 운영에서 끄거나 권한을 제한했는지는 확인하지 못했다. 인덱스가 없으면 저장이 503으로 거부된다. 이 문서를 쓴 세션은 운영 DB에 인덱스를 적용하지 않았다.
3. 프런트와 백엔드를 같은 배포 창에 올린다. 순서에 따라 중간 상태가 다르다.
   - 백엔드 먼저: 이미 배포된 이전 프런트는 `Idempotency-Key`와 `consent` 없이 POST해 400을 받고 "접수 실패" 안내를 보인다.
   - 프런트 먼저: 새 프런트가 고지 GET 404를 받아 "준비 중" 안내로 접수를 막는다. 이용자에게 더 정확한 상태다.
   - 어느 쪽이든 접수가 잘못 저장되는 경로는 없고 접수가 막힌다. 어느 순서로 할지는 운영자가 정한다.
4. 배포 직후 점검(운영 입력 후): 고지 GET이 4개 언어에서 200이고 `noticeHash`가 승인 파일과 맞는지, 폼의 활성화·동의 문구가 승인 고지와 같은지. 실제 문의 제출은 승인된 검증 환경에서만 한다.

**되돌림**

- 코드는 프런트·백엔드 배포를 함께 이전 버전으로 되돌린다. DB의 새 필드(`consent`, `inquiryRequestKey`, `inquiryFingerprint`, `status`)와 인덱스는 남지만 이전 코드의 `Contact.create`는 요청 키가 없는 문서를 인덱스 대상에서 제외하므로 동작에 지장이 없다(`partialFilterExpression`, 소스와 `legacy inquiries` 테스트로 확인). 인덱스 제거는 별도 결정이다.
- 정책 파일을 제거하거나 환경 변수를 비우면 접수는 503으로 다시 닫힌다.
- 이미 저장된 문의의 동의 snapshot은 바꾸지 않는다.

**운영 입력으로 남은 것(코드로 확정할 수 없음)**

- 승인된 4개 언어 고지문: 목적, 수집 항목, 보유 기준·기간, 거부 시 결과, 개인정보 문의 창구, 시행일, 승인자.
- 개인정보처리방침과 폼의 정합성([#40](https://github.com/MINBBBB1201/jsl-project/issues/40)): 회사명 필수/선택, 제목 수집, 챗봇 언급, 3년 보유와 대표자 담당 표기의 승인 여부.
- 처리업체·보관 국가, 삭제·백업 운영, 운영자 알림 수신 채널.
- 인덱스 적용 방식과 운영 DB의 `autoIndex` 설정, 배포 순서와 시점.

기술 검수와 법률상 적합성, 출시 승인은 별개다. 이 목록은 기술 준비 상태를 정리한 것이며 법적 검토를 대신하지 않는다.
