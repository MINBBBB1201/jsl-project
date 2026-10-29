# 쿠키·추적·외부 요청 검사 — 2026-10-25

소스 조사와 합성 미들웨어 검사를 완료했다. 배포 앱의 네트워크·저장소 검사는 Vercel 인증 리다이렉트로 막혔다. 이 결과로 쿠키 배너의 필요 여부나 출시 승인을 확정하지 않는다.

## 기준과 변경 범위

- 시작 head: `a52f709d081b41eeb799d2af8fcde2dc1a807df6`. PR #25는 Draft이며 base는 `c8c5489a662ae9aab354335483332116f1962072`다. 조회 시 Vercel 상태는 성공이고 GitHub 리뷰는 없었다. 미병합·미푸시 변경 없이 기존 브랜치를 재사용했다.
- `docs/launch-readiness/**`에 검사 도구·증빙·체크리스트만 추가했다. 앱 UI, 공유 레이아웃, 폰트, 라우팅, 푸터, 회사 정책, 계정·권한·Git 설정은 바꾸지 않았다. 다른 worktree의 디자인은 조사 기준에 합치지 않았다.
- 10월 13일의 17건·70건·16화면 결과는 당시 기록이다. 10월 24일에는 새로고침 복구와 유닛 80건이 추가됐다. 이번에는 유닛 80건을 다시 실행했고, 당시 화면·DB 검사를 이번 결과로 재사용하지 않았다.

## 소스 조사 결과

`source-audit.cjs`는 TS·TSX 구문과 CSS를 읽는다. 주석의 출처 URL을 제외하고 URL 리터럴, 네트워크 호출, 저장소 호출, 쿠키 쓰기, iframe·script·HTML 삽입을 분류한다. URL은 origin만 저장하며 경로·쿼리·값은 보존하지 않는다. 파일 해시는 조사 범위를 재확인하는 용도다.

| 확인한 항목 | 결과와 근거 | 남은 확인 |
| --- | --- | --- |
| 조사 범위 | frontend 소스 284개. root·locale layout과 landing page의 import 그래프에 85개가 연결된다 | import는 실행·마운트 증거가 아니다. 조건 분기·재수출·동적 조립·의존성 내부·배포 주입 전체를 분석하지 않는다 |
| 분석 패키지 | manifest의 직접 의존성과 구문 검사에서 지정한 분석 SDK·tracker 호출을 찾지 못했다 | 의존성 내부나 배포에서 주입한 코드는 별도 검수한다 |
| iframe·실행 script | 조사한 TS·TSX에서 직접 삽입을 찾지 못했다 | 런타임 삽입과 배포 주입이 없다고 단정하지 않는다 |
| 랜딩의 네트워크 호출 위치 | 고지 GET·문의 POST와 공개 운영 현황 GET, 3개 호출 위치가 import 경로에 있다 | 호출 위치 수는 실제 요청 횟수가 아니다. 운영 API origin·처리업체·로그·CORS는 확인하지 못했다 |
| 외부 편집기 | `landing-theme-customizer.tsx`의 tweakcn 링크와 `window.open` | 클릭 후 외부 이동이며 자동 iframe으로 분류하지 않는다. 링크 hover의 prefetch 등 실제 동작은 미검사다 |
| 외부 이미지 | notion-avatars 12개 URL 리터럴, ui.shadcn 8개 URL 리터럴은 현재 랜딩 import 경로 밖에 있다 | 다른 경로의 노출·서버 이미지 최적화 요청은 미검사다. 이를 전체 사이트에서 미사용이라고 쓰지 않는다 |
| CSS·폰트 | CSS의 외부 HTTP URL은 0개. 활성 폰트 선언은 로컬 파일을 사용한다 | 폰트 권리와 배포 응답은 별도 검사한다 |
| HTML 삽입 | `components/ui/chart.tsx`의 `style` 생성 1곳. 검토한 코드에서는 색상 CSS를 만든다 | 랜딩 import 경로 밖이다. 임의 스크립트 실행이나 추적 증거로 쓰지 않는다 |
| 이미지 허용 목록 | `next.config.ts`는 ui.shadcn·Unsplash 호스트를 허용한다 | 허용 목록은 이미지 요청 실행 증거가 아니다 |

검사 결과는 [source-audit.json](evidence/review-06/source-audit.json)에 있다. 이 도구는 정적 검사 보조 수단이며 전체 데이터 흐름이나 보안을 증명하지 않는다.

## 저장 항목과 언어 쿠키 재현

아래 목적은 코드의 기능 분류다. 법률상 동의 면제나 개인정보 해당 여부를 판정한 표가 아니다.

| 이름 | 코드상 목적과 범위 | 수명·한계 |
| --- | --- | --- |
| `nextjs-ui-theme` | 테마 선택, localStorage | 사용자가 선택할 때 기록한다. 코드상 만료 없음. 첫 방문 때 반드시 생긴다고 쓰지 않는다 |
| `NEXT_LOCALE` | 언어 선호, 쿠키 | 현재 설정의 설치된 미들웨어에 합성 문서 요청을 넣어 생성 조건을 확인했다. SameSite=Lax, Path=/, 명시 Max-Age 없음 |
| `jsl.contact.retry.v1` | 마지막 미확정 문의의 요청 키·비교값·만료 시각, sessionStorage | 생성 때부터 논리적 30분. 원문·이름·이메일·동의값을 저장하지 않는다. 다음 접근 때 만료를 검사한다 |
| `jsl_token` | 내부 로그인 토큰, JavaScript 접근 가능 쿠키 | 12시간, SameSite=Lax, HTTPS에서 Secure. 공개 랜딩 방문 시 자동 생성으로 단정하지 않는다 |
| `sidebar_state` | 내부 사이드바 선택, 쿠키 | 7일. 사이드바 변경 때 기록한다 |

`probe-locale-cookie.cjs`는 실제 `routing.ts`를 읽고 설치된 next-intl 미들웨어에 합성 `NextRequest`를 넣는다. 한국어 문서, 영어 문서, 중국어 문서, 비문서 요청, `localeCookie:false` 대조군의 5조건·6개 단언이 통과했다. `localeDetection:false` 상태에서도 영어·중국어 문서에는 `NEXT_LOCALE`이 생성됐다. 대조군은 검사 프로세스 안에서만 바꿨으며 실제 라우팅은 바꾸지 않았다.

이는 [next-intl의 localeCookie 설명](https://next-intl.dev/docs/routing/configuration#localecookie)과 일치한다. Node에서 설치 패키지를 읽기 위해 `next/server`의 확장자만 해석하는 임시 resolver를 썼다. 설치 파일은 수정하지 않았다. 브라우저 언어 메뉴·전체 Next 미들웨어·배포 Set-Cookie를 검증한 결과는 아니다. [검사 결과](evidence/review-06/locale-cookie.json).

sessionStorage는 origin과 탭으로 분리되며 opener에서 새 탭으로 초기 내용이 복제될 수 있다. [MDN 설명](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)에 따라 탭·기기 간 복구를 보장하지 않는다. 비교값은 암호문이나 익명 정보라고 표현하지 않는다.

## 실제 배포 요청의 확인 한계

PR의 Vercel 댓글에서 확인한 브랜치 미리보기 `/landing`에 GET 1회를 보냈다. HTTP 302, 목적지 origin `https://vercel.com`, SSO 경로를 확인했다. `_vercel_sso_nonce`라는 플랫폼 쿠키 이름만 기록하고 값과 리다이렉트 쿼리는 보존하지 않았다. 이 쿠키를 JSL 앱이 만든 쿠키나 분석 추적기로 분류하지 않는다. [진입 요청 결과](evidence/review-06/preview-entry.json).

설치된 Playwright Node 모듈의 HTTP 요청 기능을 재사용했다. 브라우저나 새 앱 서버를 시작하지 않았다. 공통 `heavy.lock`을 원자적으로 취득하고 요청 종료 후 자기 잠금만 해제했다. TEMP/TMP는 D:를 사용했다.

Playwright CLI의 설치 여부와 기존 Node 모듈의 존재를 구분했다. CLI는 없었고 패키지를 설치하지 않았다. 기존 Vercel CLI의 읽기용 계정 확인은 인증 부재로 로그인 절차 시작을 안내한 뒤 클라이언트 오류로 중단됐다. 로그인을 완료하거나 연결·토큰 발급·env pull·보호 해제·공유 접근 링크 생성을 실행하지 않았다. 환경에 기존 OIDC 토큰도 없었다. 공식 보호 배포 접근 스킬을 확인했지만 사용할 기존 인증을 확보하지 못했다.

따라서 첫 방문·지연·스크롤·언어·테마 변경·문의·재방문에서 발생하는 앱 요청, 쿠키 값 변화, localStorage와 sessionStorage 변화, 선택 서비스 거부·철회는 여전히 미검사다. 이를 실제 배포의 추적 없음이나 쿠키 동의 통과로 표시하지 않는다.

## 실행한 검사와 다음 검수

- 정적 검사 도구 회귀 6건 통과. 주석 제외, URL 값 제거, 호출 분류, iframe·HTML, 분석 import, CSS 원격 URL을 검사했다.
- 언어 미들웨어 합성 5조건·6개 단언 통과. source 코드 변경 없이 실행했다.
- frontend 유닛 80건 통과. 문의 최소 수집과 재시도 복구의 기존 검사를 포함한다.
- 도구의 Node 구문 검사·새 문서 JSON 검사·diff 공백 검사를 실행했다. 앱 TypeScript·lint·전체 build·MongoDB·16화면 캡처는 이번에 실행하지 않았다. 앱 소스와 UI를 바꾸지 않았고 이전 결과는 별도 시점으로 남긴다.
- 최종 소스 해시를 시작 스냅샷과 대조한다. 검사 때문에 프론트 소스가 바뀌지 않아야 한다.

기존 인증으로 해당 미리보기에 접근할 수 있게 되면 새 브라우저 context에서 첫 방문, 15초 대기, 끝까지 스크롤, 언어·테마 변경, 같은 context 재방문, 저장소 차단을 나눠 검사한다. 문의 POST는 실제 DB에 합성 데이터를 넣는 행동이므로 폐기 가능한 API/DB를 명시적으로 연결한 검증 환경에서만 수행한다. 네트워크 증빙에는 origin·요청 경로 분류·상태·쿠키 이름과 속성·저장 키만 남기고 인증 값·본문·고객 데이터·원시 HAR는 커밋하지 않는다.

회사가 분석·광고·영상·지도 등 선택 서비스를 사용할지 먼저 확인해야 한다. 서비스가 확인되면 실행 전 차단, 거부, 허용, 철회, 새로고침·재방문 동작을 그 실제 서비스에 대해 검사한다. 현재 조사만으로 배너를 추가하거나 선택 서비스를 임의로 도입하지 않았다. 법률 판단과 회사 정책 승인은 이번 기술 검사의 범위 밖이다.
