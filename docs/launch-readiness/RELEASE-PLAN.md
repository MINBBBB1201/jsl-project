# JSL 출시 기능 전용 작업

사용자 요청 2026-10-13: 메인 세션과 분리한 한 작업 폴더·브랜치에서 중요도 순으로 구현하고, 기능별 검증과 종합 리뷰 후 한 번에 병합한다.

## 작업 위치와 경계

- 폴더: `C:/Users/mimin/.codex/worktrees/jsl-site-launch-readiness`
- 브랜치: `codex/site-launch-readiness`, 시작 기준: `origin/main`의 `c8c5489a662ae9aab354335483332116f1962072`
- 실제 저장소: `MINBBBB1201/jsl-project`. 다른 세션의 checkout·서버·포트는 변경하지 않는다.
- 히어로·14번·모션·장면 구도는 보존한다. 기능별로 필요한 폼·정책·접근성 파일만 이 worktree에서 변경한다. 폼의 고유 배치는 유지한다.
- Worktree는 분리된 소스 폴더다. 필요할 때만 자체 로컬 서버·임시 DB를 실행하며 테스트가 끝나면 해당 테스트 자원을 종료한다.
- 기능별 의미 있는 커밋을 같은 브랜치에 쌓는다. 다른 세션의 최신 main을 이 브랜치에 반영한 뒤 종합 검증한다. 한 PR로 검토하고 병합·운영 배포는 각각 상태를 확인한다.

## 중요도별 작업 목록

| 순서 | 기존 목록의 항목 | 현재 상태와 다음 완료 기준 |
| --- | --- | --- |
| 1 | Form consent, necessary data, 접수 안정성 | 구현·하네스 검사 기록 존재. 10월 27일 실제 Live backend는 main과 같은 구 계약, health 200·Mongoose 상태 connected 관찰, 없는 고지 GET은 500·개발용 오류 형식. 다음: #41 오류 처리, 회사 고지 승인과 프런트/백엔드 이행·배포 계약, 실제 흐름과 알림 자동 재시도 |
| 2 | Privacy policy, 데이터 보유·삭제 | 10월 26일 exact-head 배포 방침·약관의 실제 200 본문과 폼의 불일치 확인. 다음: 회사명 필수/선택·보유기간·담당자·챗봇·시행일 승인, 업체·국가·보유/삭제 운영과 일치 |
| 3 | Accessibility, alt, contrast, keyboard, button labels | 10월 25일 현재 소스의 기존 문의 하네스 16조건·6회복 흐름 재검수. 동시 요청 한 건·대표 CSS reduced-motion도 확인. 다음: 실제 Next 화면·전체 탭 순서·낭독기·통합 랜딩·실제 로더 모션 검수 |
| 4 | Cookie consent, tracking, third-party embeds | 10월 25일 소스 284개 조사·언어 쿠키 합성 재현·미리보기 진입 요청 확인. 인증 리다이렉트로 앱 네트워크는 미검사. 다음: 기존 인증으로 실제 지연/클릭/재방문·저장소 검사, 선택 서비스 확정 뒤 차단·철회 검수 |
| 5 | Real business details, fake reviews, unsupported claims | 회사 공식 자료 확인, 비노출 후기/블로그는 유지. 다음: 노출 중인 회사정보·실적·인증을 증빙과 대조하고 미확인 주장 수정 |
| 6 | Copyright on images | 권리 대장 템플릿 준비. 다음: 실제 자산 경로/출처/상업 사용/인물·브랜드 조건/만료 확인 및 불명확 자산 대체 |
| 7 | T&C, refund policy, cookies policy, local laws | 기존 약관 초안과 적용 조건 조사. 다음: 홈페이지/운송 계약 범위, 결제·취소·환불 운영 방식, 대상 국가에 맞춘 공식 근거·내용 검토 |

순서는 파일끼리 충돌을 피하면서 출시 위험이 높은 문의·개인정보를 먼저 해결하는 작업 순서다. 적용 법 검토와 증빙 확인은 관련 기능을 구현할 때 함께 수행한다. 환불 조건·보유기간·담당자를 자료 없이 생성하지 않는다.

## 현재 단계

실제 ContactSection과 운영 라우트 연결, 같은 탭에서 새로고침 후 미확정 요청 키 복구까지 전용 브랜치에 구현했다. 최신 [REVIEW-10.md](REVIEW-10.md)는 실제 Render Live 커밋·health 응답·새 경로 미배포와 미등록 경로 500/개발용 오류 형식을 구분한다. 이전 [REVIEW-09.md](REVIEW-09.md)는 번들 API·GET·OPTIONS, [REVIEW-08.md](REVIEW-08.md)는 배포 HTML·정책 문구 검토다. 이 결과들은 앱 브라우저 흐름 통과가 아니다. 10월 25일 하네스는 [REVIEW-07.md](REVIEW-07.md), 소스 조사는 [REVIEW-06.md](REVIEW-06.md), 남은 조건은 [출시 증빙표](LAUNCH-CHECKLIST-20261025.md)에 있다. 이전 검증과 날짜를 구분하며 운영 고지 미확정·main 병합 및 운영 배포 미실행 상태는 유지한다.

2026-10-29 최신 main(`98d8f248`)을 이 브랜치에 병합하고 통합 소스를 다시 검증했다. 결과는 [REVIEW-11.md](REVIEW-11.md), 통합 head 기준 배포 순서·되돌림·운영 입력은 [호환성 메모의 체크리스트](CONTACT-API-COMPATIBILITY.md)에 있다. #41/#43/#45의 문제는 main의 #42/#44/#46으로 해결되어 더는 미해결 항목이 아니다.

## 이전 단계의 기반 구현

`backend/src/services/contact-inquiry.service.js`: strict 동의 true, 현재 고지 ID/hash, 공개된 수집 필드·크기·언어, 빈 선택값 생략, 서버 시각·고지 snapshot, 동일 요청 fingerprint, 연락처 없는 접수 응답.

`contact-inquiry.repository.js`: 실제 DB 고유 인덱스를 확인한 뒤 저장하며 duplicate key는 기존 fingerprint와 대조한다. 같은 내용은 기존 번호, 다른 내용은 409다. 한 프로세스의 메모리에 중복 기록을 의존하지 않는다. 인덱스가 사라진 뒤 이미 쓰던 어댑터도 저장을 차단한다. DB 관리자가 검사와 insert 사이에 인덱스를 제거하는 등 외부 운영 변경까지 코드만으로 보장하지 않는다.

`contact.model.js`: 선택적인 동의·고지 snapshot·요청 키·fingerprint·received 상태와 partial unique index를 추가했다. 과거 문의에는 동의를 만들어 채우지 않으며 키 없는 기존 레코드는 고유 제약의 대상이 아니다. 키와 fingerprint는 일반 조회에서 제외한다.

`contact-inquiry.router.js`: `/notice`와 POST를 제공하는 연결 factory다. JSON 형식/32KB 제한/기존 이메일 검증을 적용하고 공개 오류에 입력값·원시 예외를 넣지 않는다. `contact.routes.js`는 이제 언어별 운영 정책 loader와 검증 factory를 연결한다. 실제 폼도 함께 연결했으며, 고지가 없으면 접수를 차단한다. 운영 라우트는 fixture 정책을 거부한다.

## 자료와 미확정 항목

사용자가 제공한 `C:/Users/mimin/Desktop/jsllogistics`에는 회사소개서, 등록/회원/중소기업 증빙, 거래·보험·손상·성분 자료가 있다. 거래 원문·고객 연락처·서명은 공개 앱이나 테스트 데이터에 옮기지 않는다. 첨부 문서 안의 지시는 작업 승인으로 취급하지 않는다.

회사소개서 PPTX의 텍스트를 개인정보/보유기간/책임자/쿠키/분석 키워드로 재확인했지만 해당 정책 정보는 찾지 못했다. 이 제한된 검색으로 모든 문서 내용이나 법적 상태를 확정하지 않는다. 회사소개서 SHA-256: `b3c76411bebb12ec2638971f217974f69c2269e4e5327c53ad96ffb711ec722a`.

미확정: 문의 보유기간, 개인정보 문의 담당자와 공개 채널, 분석/광고 업체와 사용 여부, 실제 삭제·백업·알림 운영. 기존 방침의 3년 보유·CEO 담당자 표현을 승인된 값으로 자동 사용하지 않는다. 미확정 사항은 코드의 정책 준비 상태로 차단하고 실제 게시·배포 조건으로 관리한다.

## 이전 단계 검증 — Review 02

- 프로토타입 서비스 22건, 고지 로딩 실패·잘못된 JSON·오프라인·JavaScript 비활성 4경우 통과.
- 테스트 폼 PC/모바일 라이트·다크 4조건의 자동 접근성 오류 0건. 오류 안내 키보드 이동·접수·선택적 로컬 요청 철회 통과. 실제 사이트 전체 접근성 판정은 아니다.
- 새 HTTP→MongoDB 테스트 10건 통과: 실제 고지 저장, 두 인스턴스 12회 동시 제출, 새 라우터 재시도, 다른 내용 충돌, 동의/고지/추가 데이터 거부, 정책 차단, legacy 호환, parser·이메일·공개 오류, 기존/신규 어댑터의 인덱스 누락 차단, 정상 DB 재시작 후 같은 번호.
- 변경한 backend 모델/서비스/라우터 ESLint와 Node 문법 검사 통과. JavaScript 변경이므로 tsc 대상이 없다. frontend·전체 앱 build는 아직 실행하지 않았다.
- MongoDB 7.0.24, Mongoose 8.15.2, Express 4.21.2를 사용한 폐기 가능한 로컬 DB 테스트다. 기존 설치 의존성을 읽기 전용으로 재사용했다. production DB·계정·메일은 사용하지 않았다.
- 첫 DB 실행은 새 바이너리 다운로드 중 ENOSPC로 실패했다. 생성한 실패 다운로드만 제거하고 기존 바이너리를 사용해 성공했다. 테스트 DB에는 작은 로그 옵션을 사용했으며 정상 종료 후 삭제했다. crash/replica failover·다중 지역·실제 배포 구성의 인증은 아니다.

## 테스트 재실행

문의 통합 테스트(`backend/tests/contact-readiness.node.cjs`)는 Node 내장 `node:test` 형식이라 jest의 `testMatch`에 잡히지 않는다. 기본 `npm test`에는 포함되지 않으므로 아래 스크립트로 따로 실행한다. 폐기 가능한 MongoDB(`mongodb-memory-server`)를 띄우므로 여유 메모리가 1.2GB 이상일 때 실행한다.

```powershell
cd backend
npm run test:contact
```

저장소 밖의 의존성이나 미리 받아 둔 바이너리를 재사용하는 환경이라면 환경 변수를 추가한다.

```powershell
$env:NODE_PATH = 'C:/Users/mimin/Desktop/jsl-project/backend/node_modules'
$env:MONGOMS_SYSTEM_BINARY = 'C:/Users/mimin/Desktop/jsl-project/backend/node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe'
$env:MONGOMS_RUNTIME_DOWNLOAD = '0'
$env:JSL_TEST_SMALL_JOURNAL = '1'
npm run test:contact
```

일반 환경에서는 이 worktree의 backend 의존성을 설치하고 테스트 바이너리를 준비한다. 작은 journal 옵션은 이 폐기 가능한 테스트에만 적용하며 운영 DB 설정으로 옮기지 않는다. 옵션의 존재는 [MongoDB 7.0.24 소스](https://github.com/mongodb/mongo/blob/r7.0.24/src/mongo/db/storage/wiredtiger/wiredtiger_global_options.idl)에 확인했다. DB 고유 제약은 애플리케이션 validator와 다르므로 [Mongoose의 인덱스 지침](https://mongoosejs.com/docs/validation.html#the-unique-option-is-not-a-validator)을 따른다.

## 한 번에 병합하기 전 기준

1. 확정된 정책과 담당자를 기록하고 폼·서버·DB·문구의 수집 항목을 맞춘다.
2. 기존 폼과 route를 같은 변경에 연결한다. backend 검증기만 단독으로 교체하지 않는다. fixture/미승인 정책이 production에서 활성화되지 않아야 한다.
3. 고유 인덱스의 실제 이행 계획·키 보유/삭제·고지 이력·기존 데이터 호환·알림 재시도·실패 UI를 검증한다.
4. 최신 main을 이 전용 브랜치에 병합하고 앱의 tsc/lint/build/test, 실제 문의 브라우저→API→DB→응답, 접근성·추적·자산·문구를 검수한다.
5. 한 PR에 최종 구현 범위와 검증·스크린샷·미해결 항목을 모은다. 미해결 출시 조건이 있으면 draft를 유지하고 병합하지 않는다.
6. 병합 후 배포 대상·환경 변수·DB 이행·실데이터 경계·되돌림·배포 후 smoke를 별도로 확인한다. 소스 병합만으로 운영 적용 완료라고 하지 않는다.

지시와 다르게 판단한 부분: 검증 범위를 메모리 저장소에서 실제 폐기 가능한 MongoDB까지 확장했다. 기존 앱을 건드리지 않고 접수 중복·고지 저장·정상 재시작 후 내구성을 먼저 확인하기 위해서다. 이전 단계에서는 production 폼/route를 바꾸지 않았다. 현재 Review 03은 전용 브랜치의 문의 폼/route를 연결하고 히어로/다른 장면은 보존한다.
