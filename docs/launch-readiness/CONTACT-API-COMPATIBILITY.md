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
- 이전 프런트가 새 백엔드를 호출하면 `consent.language`가 없어 400 `INVALID_LANGUAGE`로 실패한다. 새 프런트가 이전 백엔드를 호출하면 `GET /notice`가 404라서 폼이 "준비 중" 상태로 접수를 막는다. 두 방향 모두 데이터가 잘못 저장되지 않고 접수가 막히는 쪽으로 실패한다.
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

이 결과는 고지 GET을 아직 정상 확인하지 못했다는 근거다. 정책 미승인의 예상 503, 경로 누락의 404와 혼동하지 않는다. 실제 backend revision·환경·로그·DB 상태는 확인하지 않아 원인을 단정하지 않는다. 사전요청 허용을 계약 일치·서버 저장·브라우저 성공으로 해석하지 않는다. 코드 계약 표는 그대로이며 새 결과로 자동 변경하거나 운영 배포하지 않았다.
