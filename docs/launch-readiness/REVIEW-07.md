# 문의 접근성·회복 동작 재검수 — 2026-10-25

현재 소스를 새로 빌드한 문의 검수 하네스에서 16개 화면 조건과 6개 회복 흐름이 통과했다. 같은 요청 키의 동시 재전송과 공통 CSS의 동작 줄이기도 별도로 확인했다. 앱이나 검수 도구를 수정할 결함은 이번 범위에서 발견하지 못했다.

## 기준과 실행 범위

- 검사한 source head는 `466c5e4c60e40a03032e20d3f704127511bb7c76`, PR #25의 base는 `c8c5489a662ae9aab354335483332116f1962072`다. 시작 시 작업 폴더는 깨끗했고 Draft 상태였다. Vercel·Preview Comments는 성공이었으나 GitHub 리뷰 승인은 없었다.
- 기존 `tools/contact-review/build.cjs`, `browser.cjs`와 backend의 `contact-readiness.node.cjs`를 그대로 재사용했다. 이번 변경은 `docs/launch-readiness/**`의 결과·증빙뿐이다. 새 테스트 체계·패키지·서버 프레임워크를 추가하지 않았다.
- 기존 Playwright·axe·Chrome·MongoDB 바이너리를 재사용했다. 임시 출력과 DB는 D:에 두고 다운로드를 비활성화했다. 메모리 여유를 확인하고 공통 `heavy.lock`을 원자적으로 취득했다. 기존 서버나 다른 프로세스를 종료하지 않았다.
- 실행 중 생성한 localhost 서버·브라우저·임시 DB는 기존 도구의 종료 절차로 닫았다. 자기 잠금만 해제했다. 운영 API·DB·계정에는 접속하거나 문의를 제출하지 않았다.
- 10월 24일 번들·캡처를 재사용하지 않았다. 이번 head에서 검수 번들을 새로 만들고 10월 25일 캡처·결과를 생성했다. 보존 범위의 원본 앱 소스 해시 284개도 대조했다.

## 실제 문의 컴포넌트 검사

실제 ContactSection·공유 폼 컴포넌트·문구·CSS, 합성 운영 고지, 실제 Express 접수 factory와 폐기 가능한 MongoDB를 사용했다. Next Link만 검수용 어댑터로 대체하는 기존 방식이다.

| 검사 | 이번 결과 | 확인 범위 |
| --- | --- | --- |
| 4언어 × 라이트/다크 × PC/모바일 | 16조건 통과 | 1440×1000 또는 390×844, axe WCAG A/AA 태그 자동 위반 0건·가로 넘침 0건 |
| 키보드와 필수 오류 | 통과 | 체크박스에 포커스를 둔 뒤 Space로 바꾸고 빈 제출 뒤 담당자명에 포커스가 오는지 단언. 이후 Tab과 타이핑을 실행하지만 모든 Tab 단계의 포커스 위치를 따로 단언하지는 않는다 |
| 접수 확정 뒤 다시 제출 | 통과 | 기존 성공 응답을 확인한 뒤 새 제출은 다른 번호와 두 번째 레코드를 만든다. 이 동작을 동일 요청의 중복 방지로 잘못 표현하지 않는다 |
| 응답 유실 뒤 새로고침 복구 | 통과 | 최초 201 응답을 읽은 뒤 응답만 중단. 새로고침 후 이메일·동의가 비었는지 확인하고 재입력·재동의하면 200·`replayed=true`·원래 번호를 받는다. DB 문서 수는 3개를 유지하고 재시도 메타데이터를 지운다 |
| 고지 변경 | 통과 | 이전 고지로 제출한 요청의 오류 안내, 새 고지 로딩, 체크 해제, 재동의 후 접수 확인 |
| DB 저장 실패 | 통과 | 고유 인덱스 제거로 저장을 실패시키면 오류 안내를 보이고 성공 번호를 표시하지 않는다. 문서 수는 늘지 않으며 검사 후 인덱스를 복원한다 |
| 미승인 고지 | 통과 | 고지가 없으면 준비 중 안내와 비활성 제출 버튼을 확인 |

결과의 `flows`는 키보드, 확정 후 새 문의, 새로고침 복구, 고지 변경, DB 실패, 미승인 고지의 6개 흐름이다. [이번 browser-summary.json](evidence/review-07/browser-summary.json)에 실제 결과가 있다. [PC 라이트](evidence/review-07/ko-light-desktop.png)와 [모바일 다크](evidence/review-07/ko-dark-mobile.png)는 직접 확인했다. 나머지 라이트/다크 캡처도 같은 디렉터리에 보관했다. 영어 합성 고지는 승인된 회사 정책이 아니다.

오류 설명 연결은 소스에서도 확인했다. `components/ui/form.tsx`의 FormControl이 오류 시 설명·오류 요소 ID를 `aria-describedby`로 연결하고 `aria-invalid`를 설정한다. ContactSection에는 필드별 FormDescription과 실패 안내로 포커스를 옮기는 코드가 있다. 이 소스 확인을 화면 낭독기 발화나 모든 오류 상태의 브라우저 단언으로 확대하지 않는다.

## 동시 재전송 검사

기존 backend 검사 중 `12 concurrent HTTP retries across two service instances create one Mongo record` 한 건만 선택했다. 독립 라우터 두 개에 같은 요청 키로 12개를 동시에 전송해 201 한 개, 200 열한 개, 같은 접수 번호 한 개, DB 문서 한 개를 확인했다. [실행 로그](evidence/review-07/concurrency.log).

이는 서버의 동일 키 재전송 검사다. 브라우저의 연속 클릭을 실제 시간 지연 상황별로 시험한 것은 아니다. 클라이언트의 제출 중 `sendingRef` 보호·버튼 비활성 코드는 확인했지만 별도의 클릭 경합 검사를 추가하지 않았다. backend 전체 17건을 이번에 다시 실행한 것으로 쓰지 않는다.

## 동작 줄이기 검사

이번에 만든 `contact.css`를 기존 Playwright의 별도 빈 문서에 넣었다. 새 테스트 체계 없이 대표 `.animate-spin` SVG와 `.transition-all` 버튼의 계산값을 확인했다. 이 문서의 모든 네트워크 요청은 차단했다. 문의 React 컴포넌트나 실제 제출 중 로더를 emulation한 결과는 아니다.

| 계산값 | 일반 설정 | `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| animation-duration | 1초 | 0.01ms |
| animation-iteration-count | infinite | 1 |
| transition-duration | 0.2초 | 0.01ms |
| scroll-behavior | smooth | auto |

미디어 설정·반복·지속시간·스크롤의 7개 단언이 통과했다. Chrome `155.0.8059.85`를 사용했다. [계산값·CSS hash](evidence/review-07/reduced-motion-css.json)에 검사 범위를 함께 기록했다. 핵심 재현 순서는 `page.setContent`로 위 두 클래스의 대표 요소를 만든 뒤 새 CSS를 `addStyleTag`로 넣고, `page.emulateMedia({reducedMotion: 'no-preference' | 'reduce'})` 후 `getComputedStyle`을 읽는 것이다. CSS 강제 규칙만 검사했으며 JavaScript·GSAP·Canvas나 전체 랜딩 모션을 검증하지 않았다.

## 재실행과 보존 확인

기존 README의 의존성 환경 변수와 공통 잠금 규칙을 적용한 뒤 다음 명령을 실행했다. 출력 폴더는 저장소 밖의 새 폴더를 사용했다.

```powershell
node tools/contact-review/build.cjs OUTPUT_DIRECTORY
node tools/contact-review/browser.cjs OUTPUT_DIRECTORY
node --test --test-name-pattern='12 concurrent' backend/tests/contact-readiness.node.cjs
```

실행에 사용한 source head, 도구·새 번들·캡처의 해시와 시간은 [run.json](evidence/review-07/run.json)에 있다. `source-audit.json`의 기존 284개 소스 해시와 대조해 앱 소스 변경이 없음을 확인한다. 새 증빙 JSON·문서 링크·diff 공백 검사도 수행한다.

## 미검사·남은 조건

- 전체 Next production build·SSR·hydration·실제 라우팅·배포 CORS·운영 DB·인증된 보호 미리보기 네트워크는 이번에 검증하지 않았다. 앱 TypeScript·lint·유닛 전체도 이번 회차에서 재실행하지 않았다. 80개 유닛의 최근 실행은 같은 날 Review 06이며 별도 결과다.
- 실제 휴대폰·화면 낭독기·확대·모든 focus/hover/오류 상태·전체 사이트 WCAG 적합성은 미검사다. 연속 클릭 경합과 실제 로더의 reduced-motion 조합도 남아 있다.
- 회사 고지·보유기간·개인정보 담당 채널·처리업체·처리 국가·삭제/백업 운영·선택 서비스 확정은 그대로 필요하다. 합성 fixture 통과를 회사 승인으로 쓰지 않는다.
- 새 UI·공유 디자인 수정은 하지 않았다. 이번 검사 범위에서 구현 변경이 필요한 결함은 발견하지 못했다. 후속 검사에서 결함을 찾으면 파일과 영향을 먼저 보고한다.
- PR #25는 Draft를 유지한다. main 병합·운영 배포는 실행하지 않았다. 자체 검수이며 외부 리뷰 승인으로 표현하지 않는다.
