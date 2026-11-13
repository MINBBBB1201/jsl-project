# 문의 통합 배포 인계

2026-11-06, PR #59. PR #25 `f6c48b2bd90030cd8923e3235e5fffabc40bf480`의 `CONTACT-API-COMPATIBILITY.md`와 현재 문의 소스를 대조해 정리했다. 이 문서를 작성하면서 운영 정책 파일·환경값·DB를 읽거나 변경하지 않았고 배포도 하지 않았다.

## 현재 상태

실제 프리뷰 `11d8aea`는 Render의 `/api/contact/notice?language=en|ko`를 호출하지만 JSON 404 `Route not found.`를 받는다. 폼은 입력과 제출을 차단한다. 새 문의 코드의 운영 반영과 회사 승인 고지가 남았다. [실제 프리뷰 증빙](../reviews/evidence/preview59-20261106/README.md).

새 계약은 기존 문의 POST와 호환되지 않는다. `Idempotency-Key`와 `consent`가 필수이며, 새 프런트는 고지 GET이 성공해야 접수를 연다. 이전 프런트가 새 백엔드에 제출하면 동의 언어가 없어 400을 받는다. 새 프런트가 이전 백엔드에 연결되면 현재처럼 고지 404로 접수를 막는다. 저장소 밖 호출자와 오래 캐시된 프런트 사용 여부는 확인되지 않았다.

## 배포 전에 준비할 것

1. 회사가 승인한 ko/en/zh/vi 정책. 각 언어에 `approved: true`, 승인자, 고지 ID, 시행일, 목적, 수집 항목, 보유 기준·기간, 동의 거부 시 결과, 개인정보 문의 창구, `kind: "operational"`이 필요하다. 필수 수집 항목은 `contactName`, `email`, `message`이며 `companyName`, `subject`의 선택 수집 여부도 고지와 맞춰야 한다. 처리업체·국가 등 개인정보처리방침의 회사 결정은 #40에서 확정한다. 비활성 예시와 fixture는 운영 고지를 대신하지 않는다.
2. 승인 정책 파일을 서버에서 읽을 수 있는 위치에 두고 `CONTACT_POLICY_PATH`로 지정한다. 실제 승인자·연락처가 든 운영 파일을 저장소에 커밋하지 않는다. 정책은 `contact.routes.js`가 처음 로드될 때 읽고 서비스에서 복사하므로, **파일·환경값 변경만으로 반영되지 않는다. 서버 재시작이 필요하다.**
3. 운영자가 `contacts` 컬렉션의 인덱스를 확인한다. 필요한 인덱스는 아래와 같다. 현재 저장 코드는 인덱스가 준비되지 않으면 503으로 거부한다. 코드에서 `autoIndex`를 끄지 않았다는 사실만으로 운영 DB에 생성됐다고 판단하지 않는다. 인덱스 생성·변경은 별도 운영 승인 후 수행한다.

```json
{
  "name": "contact_inquiry_request_unique",
  "key": { "inquiryRequestKey": 1 },
  "unique": true,
  "partialFilterExpression": { "inquiryRequestKey": { "$type": "string" } }
}
```

### 설치 없이 정책 형식만 확인

반복 가능한 저장소 도구는 `node tools/contact-policy-check.cjs --input $approvedPolicyFile`이다(저장소 루트 실행). [입출력과 실패 기준](POLICY-PREFLIGHT.md), 합성 회귀 검사 11개를 포함한다. 아래 인라인 명령과 같은 백엔드 순수 검증 함수를 사용한다.

운영 담당자가 로컬의 승인 정책 파일 경로를 `$approvedPolicyFile`에 지정한 다음 `backend` 폴더에서 실행한다. 이 명령은 기존 순수 함수를 사용하고 서버·DB에 연결하지 않는다. 출력은 언어별 준비 여부·누락 필드명·공개 고지 해시뿐이며 정책 본문·승인자는 출력하지 않는다.

```powershell
node -e 'if(!process.argv[1]){console.error("Approved policy file path required");process.exit(1);} const {loadContactPolicies,LANGUAGES}=require("./src/config/contact-policy"); const {policyReadiness,notice}=require("./src/services/contact-inquiry.service"); const policies=loadContactPolicies({policyPath:process.argv[1]}); const report=LANGUAGES.map(language=>{const p=policies[language], r=policyReadiness(p); return {language,...r,...(r.ready?{noticeHash:notice(p).noticeHash}:{})};}); console.log(JSON.stringify(report,null,2)); process.exitCode=report.every(r=>r.ready)?0:1;' $approvedPolicyFile
```

네 언어 모두 준비됐을 때만 종료 코드 0이다. 형식 통과는 회사 승인 진위나 법적 적합성을 입증하지 않는다. 담당자가 승인 원문과 대조해야 한다. 현재 예시 파일은 네 언어 모두 null이며 이 명령에서 실패하는 것이 정상이다.

## 공개 개인정보처리방침과 동의 고지

문의 동의 고지는 전체 개인정보처리방침의 승인을 대신하지 않는다. 현재 `/privacy`는 미승인 템플릿의 3년 보관·담당자·임의 시행일을 표시하지 않고 네 언어의 준비 중 안내를 제공한다. 회사가 승인한 최종 방침·번역을 해당 공개 getter에 연결하고 실제 수집 흐름과 대조하기 전에는 방침 게시 완료로 처리하지 않는다. 문의 고지 API200만으로 이 페이지를 자동 승인하지 않는다.

## 승인 후 배포 순서와 확인

- 프런트·백엔드를 같은 배포 창에서 반영한다. 새 프런트를 먼저 반영하면 고지가 준비될 때까지 명확히 접수를 닫는다. 백엔드를 먼저 반영하면 남아 있는 이전 프런트의 제출이 400으로 실패한다. 접수 중단 시간을 공지할지는 운영자가 결정한다.
- 새 백엔드 배포 후, 정책을 아직 활성화하지 않았다면 고지 GET의 정상 중간 상태는 503 `POLICY_NOT_READY`다. 404는 경로 미반영 상태와 구분한다. DB 연결 미들웨어의 실패는 이 두 상태와 별도로 진단한다.
- 승인 정책·인덱스가 준비되고 서버를 재시작한 뒤 네 언어 고지 GET의 200·고지 해시를 위 사전검사와 대조한다. 실제 프런트에서 승인 문구·필수/선택 필드·동의 표시가 같아야 한다. 배포 Origin과 `Content-Type`, `Idempotency-Key`의 CORS 사전요청도 확인한다.
- 실제 문의 저장 검증은 별도 승인된 검증 환경과 내용으로만 한다. 신규 201, 같은 키·내용 재시도 200과 같은 접수번호, 중복 문서 없음, 다른 내용 재사용 409를 확인한다. 응답이 없었어도 저장 여부를 확인하기 전 새 키로 다시 제출하지 않는다.
- 접수번호는 지속 저장 확인을 뜻한다. 운영자 알림은 응답 후 별도 최선 노력 처리다. 같은 접수 재전송 때 알림을 다시 시도하고 중복 키를 유지하지만 자동 재시도 worker는 없다. 접수 성공이나 재시도만으로 알림 전달을 보장하지 않는다. 알림 수신·실패 운영 방침은 담당자가 별도로 확인한다.

## 접수 중단·되돌림

새 코드를 유지하며 접수만 닫으려면 정책을 비활성화하거나 경로를 제거한 뒤 서버를 재시작한다. 고지 GET과 POST의 503을 확인한다. 정책 파일 삭제만으로 실행 중 프로세스가 즉시 접수를 닫는다고 생각하면 안 된다.

코드를 되돌릴 때는 프런트와 백엔드를 함께 맞춘다. DB의 추가 필드(`consent`, `inquiryRequestKey`, `inquiryFingerprint`, `status`)와 부분 고유 인덱스는 남겨도 이전 문서에 임의 동의를 만들지 않는다. 기존 저장된 동의 snapshot을 수정하거나 인덱스를 자동 삭제하지 않는다. 이전 코드로 돌아가면 예전 접수 계약도 복원되므로, 접수를 닫으려는 목적이라면 구버전 복원만으로 해결되지 않는다.

근거: `backend/src/config/contact-policy.js`, `backend/src/services/contact-inquiry.service.js`, `backend/src/services/contact-inquiry.repository.js`, `backend/src/models/contact.model.js`, `backend/src/routes/contact.routes.js`, `backend/src/routes/contact-inquiry.router.js`. 현재 문서는 기술 인계이며 운영 승인·법률 검토를 대신하지 않는다.
