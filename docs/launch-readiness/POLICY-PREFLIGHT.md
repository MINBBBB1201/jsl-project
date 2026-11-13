# 문의 고지 파일 사전검사

저장소 루트에서 기존 Node.js만으로 실행한다. 서버·DB·네트워크에 연결하거나 파일을 변경하지 않으며 패키지 설치가 필요 없다.

```powershell
node tools/contact-policy-check.cjs --input $approvedPolicyFile
```

`$approvedPolicyFile`에는 담당자가 확인하려는 로컬 정책 JSON 파일 경로를 지정한다. 상대 경로는 명령을 실행한 폴더를 기준으로 해석한다. 입력 경로를 생략해도 `CONTACT_POLICY_PATH` 환경변수를 대신 읽지 않는다. 운영 파일이나 검사 출력에 정책 원문을 복사해 커밋하지 않는다.

현재 비활성 예시를 확인하는 명령은 다음과 같다. 네 언어 모두 `ready: false`와 `missing: ["policy"]`, 종료 코드 1이 나오는 것이 정상이다.

```powershell
node tools/contact-policy-check.cjs --input backend/src/config/contact-policies.example.json
```

## 결과 해석

- 종료 코드 **0**: ko/en/zh/vi 모두 현재 백엔드의 운영 정책 형식 검사를 통과했다.
- 종료 코드 **1**: 한 언어라도 미승인·누락·fixture·잘못된 형식이거나 파일을 읽을 수 없다. 잘못된 JSON과 읽기 실패는 내용을 노출하지 않고 준비 안 됨으로 처리한다.
- 종료 코드 **2**: `--input` 인자가 없거나 형식이 잘못됐다.

JSON에는 전체 준비 여부와 언어별 `ready`, 누락·오류 필드명인 `missing`, 준비된 언어의 `noticeHash`만 나온다. 파일 경로, 승인자, 연락처, 고지 본문과 파싱 오류의 원문은 출력하지 않는다. 해시는 서버가 공개하는 고지 해시와 같은 함수를 사용한다. 배포 후 GET 응답의 `noticeHash`와 대조할 수 있다.

검사는 기존 `loadContactPolicies`, `policyReadiness`, `notice`를 재사용한다. fixture를 허용하는 옵션은 없다. `approved: true`라는 값의 진위, 번역 정확성, 회사 승인, 법적 적합성, 시행일의 운영상 적절성은 판정하지 않는다. 담당자가 승인 원문과 대조해야 한다. 파일의 형식 통과만으로 접수를 활성화하거나 배포하지 않는다.

정책은 서버 시작 시 읽는다. 파일을 교체하거나 지워도 실행 중 서버에 즉시 반영되지 않는다. 배포·인덱스·접수 중단과 되돌림 절차는 [문의 통합 배포 인계](CONTACT-INTEGRATION-ROLLOUT.md)를 따른다.

## 도구 검사

```powershell
node --test tools/contact-policy-check.test.cjs
```

임시 합성 파일만 사용하며 실제 정책·DB·서버에는 접근하지 않는다. 준비된 정책의 출력 제한과 해시, 환경변수 대체 방지, 미승인·fixture·언어 누락·JSON 오류·파일 읽기 실패, 필수 항목·중복 항목·잘못된 날짜, 원본 파일 보존을 확인한다. 합성 파일은 검사 종료 후 제거한다.
