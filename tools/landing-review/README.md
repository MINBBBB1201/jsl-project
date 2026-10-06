# JSL 레퍼런스·모션 검수 도구

이 폴더는 개발용이다. 운영용 `frontend/package.json`·lockfile과 분리했으며, 실제 랜딩 페이지에 실행 코드를 주입하지 않는다.

## 최신 상태 · 2026-10-05

최신 목록과 사용법은 `../../docs/landing/TOOLING-STATUS.md`를 참고한다. 아래 2026-10-01 내용은 최초 설치 기록이다.

- Next.js DevTools MCP 0.4.0 추가: MCP 초기화·4개 도구 조회·개발 서버 탐색 응답 확인. 현재 실행 중인 개발 서버가 없으므로 앱 내부 오류/라우트 조회는 대기 상태다.
- Playwright는 전용 Chrome for Testing을 사용하도록 변경했다. 고정 1440×900 세션 영상을 `artifacts/playwright-video`에 기록한다. `browser_close`로 세션을 닫아야 영상이 저장된다. 실제 녹화 및 FFmpeg 프레임 추출을 검증했다.
- Chrome DevTools의 실험적 screencast는 EPIPE/빈 파일 문제로 비활성화했다. 기존 30개 도구는 정상 응답한다.
- Pixelmatch 7.2.0, Sharp 0.35.5, glTF Transform CLI 4.5.1, Khronos glTF Validator 2.0.0-dev.3.10, ffmpeg-static 5.3.0 설치 및 검증.
- Vercel 플러그인은 계정 API와 `jsl-logistics-frontend` 프로젝트 조회에 성공했다. 배포·환경변수·도메인·저장소 연결은 변경하지 않았다.
- `configure-mcp.mjs --refresh-owned`를 명시적으로 실행하면 이 명세에 있는 JSL 서버들의 args만 갱신한다. 기본 실행은 기존 서버 항목을 보존한다.
- JS 문법 확인, 이미지/모델/영상 처리 7개 항목, 프론트엔드 621개 파일 해시 비교 통과. 실제 사이트 모션 품질·접근성·SEO·성능 검증 완료를 뜻하지 않는다.

## 설치 및 검증 결과 · 2026-10-01

| 도구 | 설치 버전 | 확인한 기능 | 결과 |
|---|---|---|---|
| Microsoft Playwright MCP | 0.0.83 | MCP 초기화·25개 도구 조회·격리된 Edge에서 about:blank 진입·종료 | 통과 |
| Google Chrome DevTools MCP | 1.10.1 | MCP 초기화·30개 도구 조회·격리된 Chrome 페이지 목록 확인 | 통과 |
| Upstash Context7 MCP | 4.1.1 | MCP 초기화·2개 도구 조회·GSAP 라이브러리 문서 검색 API 응답 | 통과 |
| Chrome for Testing | 154.0.8037.92 | DevTools MCP의 headless 브라우저 실행 | 통과 |

증거: `artifacts/mcp-verification.json`. 이는 도구 작동 확인이며, 실제 사이트의 모션·모바일·성능 검증 완료를 뜻하지 않는다.

공식 자료: [Playwright](https://github.com/microsoft/playwright-mcp), [Chrome DevTools](https://github.com/ChromeDevTools/chrome-devtools-mcp), [Context7](https://github.com/upstash/context7), [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/).

## Codex 등록 상태

- `C:/Users/mimin/.codex/config.toml`에 `jsl_playwright`, `jsl_chrome_devtools`, `jsl_context7` 서버를 CLI로 등록했다.
- 소스 저장소의 `.codex/config.toml`에는 동일 서버의 작업 디렉터리와 60초 시작/120초 도구 제한을 지정했다. 같은 이름의 프로젝트 설정은 글로벌 설정을 보완한다.
- 도구는 현재 대화의 기존 도구 목록에 자동으로 추가됐다고 단정할 수 없다. Codex의 MCP 서버 설정에서 서버를 재시작해 활성 도구 목록을 확인한다. 공식 [Codex MCP 설정 안내](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
- 브라우저는 별도 headless·임시 프로필을 사용한다. 사용자 개인 Chrome/Edge 탭을 연결하도록 설정하지 않았다.
- DevTools 사용 통계와 CrUX URL 전송을 비활성화했다.
- Context7에는 새 API 키를 만들거나 저장하지 않았다. 확인 시 무인증 문서 검색이 성공했다. 추후 서비스 제한은 응답에 따라 처리한다.
- 기존 Figma·GitHub·브라우저·visualize·UI/UX 스킬 설치를 확인했으며 중복 설치하지 않았다. Figma/GitHub 계정의 특정 파일/저장소 권한을 이번 작업에서 검증한 것은 아니다.

## 도구 역할

- **Playwright:** 고정 화면 크기 캡처, 이미지/영상 로딩 확인, 정방향/역방향 스크롤과 반응형 검수.
- **Chrome DevTools:** 끊기는 프레임, 스크립트 실행, 네트워크 요청, 브라우저 콘솔과 성능 기록.
- **Context7:** 프로젝트의 Next.js·GSAP·Three.js 버전에 맞는 API 문서 조회. 서술과 코드 예제는 공식 문서와 필요시 대조한다.
- **Figma:** 구도·간격·텍스트 영역의 비교 기준을 고정할 때 사용한다.
- **visualize:** 실제 사이트를 수정하기 전에 초안과 장면별 비교를 보여준다.

## 재사용 명령 · PowerShell

```powershell
Set-Location 'C:\Users\mimin\Desktop\jsl-project\tools\landing-review'
npm ci --no-fund --no-audit
npm run verify:mcp
npm run verify:scope
```

체크포인트는 `frontend/src`, `frontend/public`, 주요 프론트엔드 설정·패키지 파일의 SHA-256을 기록한다. 현재 체크포인트는 621개 파일이다. 기존 체크포인트를 자동 덮어쓰지 않는다. 새 작업의 기준을 만들려면 기존 파일을 별도 이름으로 보관한 뒤 `npm run checkpoint`를 실행한다.

변경 비교는 보고만 한다. 사용자 변경을 지우거나 자동 롤백하지 않는다. 해시 기준에 3D 모델 등 새 자산이 추가되면 기준도 그 다음 작업에서 다시 저장한다.

`mcp-servers.json`은 이 머신의 서버 런처 명세다. `configure-mcp.mjs`는 지정 프로젝트에 없던 서버 항목만 추가하며 기존 항목을 덮어쓰지 않는다. Windows의 설치 경로가 달라지는 머신에서는 경로를 확인하고 등록한다. Chrome 테스트 바이너리는 `browsers/chrome-win64/chrome.exe`에 있어야 한다.

## 작업 기준

방향 제안은 `../../docs/landing/REFERENCE-INTEGRATION-DIRECTION.md`, 캡처 메타데이터 양식은 `../../docs/landing/REVIEW-SHOT-MANIFEST.template.json`을 사용한다. 실제 페이지에 대한 캡처는 작업별 허용된 브라우저 도구로 수행한다. 도구가 거부한 페이지/경로를 다른 브라우저 경로로 우회하지 않는다.

이번 검증에서는 장면 캡처·새 프론트엔드 구현을 수행하지 않았다. 프론트엔드 tsc/lint/build/test는 실행하지 않았으며, 개발 도구의 JavaScript 문법과 MCP 시작/기능만 확인했다.
