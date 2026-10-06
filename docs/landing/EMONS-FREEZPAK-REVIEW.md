# Emons → Freezpak 연결 시안 검수

2026-10-05 · 브랜치 `codex/landing-emons-freezpak`

## 결과와 남은 일

| 항목 | 결과 | 남은 일 |
|---|---|---|
| Emons 운송수단 | 원본 Clash Grotesk와 기존 JSL 영어 적용, 다섯 모드 보존 | 최종 JSL 영상 교체 |
| Freezpak 화물 과정 | 데스크톱·모바일 원본 Lottie, 제목·구도·일곱 단계 스크롤 적용 | 최종 JSL 벡터 자산·카피 확정 |
| 두 장면 연결 | Emons 마지막 모드 위로 Freezpak이 올라오는 전환 구현 | 사용자 시각 검토 |
| 보존 범위 | 범위 밖 변경 0, 기준 파일 621개 동일 | 없음 |
| 검사 | TypeScript, lint, 114개 단위 테스트, webpack 빌드 통과 | 기본 Turbopack 빌드의 기존 폰트 다운로드 문제는 별도 |
| 다국어 | ko/en/zh/vi 경로 보존·검사, 이번 구간은 승인된 영어 시안 | 최종 번역 단계 |

갤러리: http://localhost:4312/

파일: `tools/landing-review/artifacts/playwright/pair-review.html`. 캡처·영상은 같은 폴더에 있다. 외부 이미지 주소에 의존하지 않는다. 이미지 86개와 영상 2개의 로딩을 브라우저에서 확인했다.

## 범위

- 실제 소스는 `C:/Users/mimin/Desktop/jsl-project`이다.
- 초기 체크포인트와 MCP 확인 후 작업 브랜치를 생성했다. 원래 변경 사항은 보존했다.
- Emons 컴포넌트 두 파일, 새 Freezpak 컴포넌트 두 파일, 랜딩 조립 파일, scoped 폰트·벡터, `lottie-web@5.13.0`만 변경했다.
- 기존 `JourneyRoad`의 표시 위치를 Freezpak으로 교체했다. 원본 `JourneyRoad` 구현 파일은 그대로다.
- 두 장면을 인접하게 연결하기 위해 기존 부가 서비스 영역을 Freezpak 뒤에 배치했다. 해당 영역의 컴포넌트·내용은 이번 작업에서 변경하지 않았다.
- 히어로, 14번, Ocean, Network 및 다른 보존 장면의 소스, 메시지, 라우팅, API·백엔드·Next 설정을 수정하지 않았다.

## 원본에서 관찰한 내용

원본: https://www.emons.de/ 및 https://www.freezpak.com/.

- Emons는 하나의 서비스 영상 안에서 다섯 장면을 이동한다. 기존 구현의 구간 재생·목록·핫스폿을 유지하고, 이 구간에만 원본 폰트를 적용했다.
- Freezpak은 3D 실시간 렌더링이 아니라 데스크톱·모바일 별도 Lottie 벡터다. 각 자산은 60fps, 약 40초/2400프레임이다.
- 원본의 약 2300vh 구간과 sticky 화면, 시작 제목 축소, 일곱 설명의 등장·퇴장 시점, 건너뛰기·진행바를 관찰하고 적용했다.
- 데스크톱 제목은 Mona Sans Condensed ExtraBold, 원본 본문은 Roobert다. JSL 시안 본문은 Mona Sans를 사용한다.
- 1440×900의 제목 180px/178px, 본문 28px/36px, 390×844의 제목 54px/65px, 본문 17px/24px 관계를 적용했다.
- 원본 action list와 프레임 구간은 `artifacts/freezpak-source-motion.json`에 있다. 일부 CSS 원문은 교차 출처 접근이 제한되어 live computed style과 실제 캡처로 측정했다.

## 구현과 연결 제안의 구별

- GSAP/ScrollTrigger의 기존 방식으로 프레임·제목·본문을 스크롤에 연결했다. 공식 GSAP 및 Lottie 문서는 Context7으로 확인했다.
- Freezpak의 원본 내부 동작과 두 사이트 사이의 연결은 구별한다. Emons 마지막 장면을 유지하고 Freezpak 화면이 위로 들어오는 동작은 이번 JSL 연결 시안이며, 원본 사이트에 있는 동작으로 주장하지 않는다.
- Emons 퇴장 스크롤은 1초 `power2.inOut`으로 연결했다. Freezpak은 스크롤 거리 약 22.08 화면, scrub 0.25로 원본 프레임에 맞췄다.
- 반복 애니메이션·Observer·ScrollTrigger·Lottie를 컴포넌트 정리 시 해제한다. 모바일/데스크톱과 모션 감소 설정의 변경 시 다시 구성한다.
- 원본의 여러 헤더를 중복하지 않고 기존 JSL 공통 UI를 유지했다.

## 캡처와 검수

동일 화면 크기: 1440×900, 390×844.

| 증거 | 수량/검사 | 결과 |
|---|---|---|
| Freezpak 원본/JSL | 각 크기·원본·JSL별 진입/중간/퇴장 각 5장, 총 60장 | 실제 프레임·좌표 비교 |
| Emons 보완 | 두 크기 진입/중간/퇴장 6장 + 이전 원본 캡처 | 폰트·영어·다섯 모드 확인 |
| Freezpak 전체 | 2.5% 간격, 각 41장, 총 82장 | 가로 넘침·본문 잘림·stage 위치 이상 없음 |
| 두 장면 진입 | 2.5% 간격, 각 41장, 총 82장 | Emons 고정 상태와 Freezpak 진입 위치 확인 |
| 실제 휠 스크롤 | 데스크톱 47.56초, 모바일 30.68초 WebM | 다섯 모드→연결→일곱 단계 확인 |
| 역방향 | 데스크톱 마지막→Emons 첫 모드 | 복귀 확인 |
| 네 언어 경로 | ko/en/zh/vi, 모바일 캡처 4장 | 경로·넘침 검사 통과 |
| 모션 감소 | 두 크기에서 7개 설명, aria-hidden 없음 | 모두 읽을 수 있음, 모션 재활성화도 확인 |
| 건너뛰기 | 실제 버튼 클릭 | 다음 부가 서비스 상단으로 이동, 오차 0.25px |

기계 검사 보고서: `artifacts/playwright/pair-captures.json`, `pair-scan.json`, `pair-wipe.json`, `pair-motion.json`.

영상의 초반에는 페이지 최초 로딩이 포함된다. 갤러리는 데스크톱 12초, 모바일 8초부터 재생하도록 했다. 원본 녹화는 보존했다. 데스크톱 후반의 즉시 구간 이동은 역방향 검사용 이동이며 사이트 전환 연출로 설명하지 않는다.

## 코드·범위 검사

- `npx tsc --noEmit`: 통과. 최종 webpack 빌드의 TypeScript 검사도 통과.
- `npm run lint`: 통과. 마지막 접근성 보완 후 수정 TSX 세 파일 targeted eslint 재검사 통과.
- `npm run test:units`: 23 suites, 114 tests 통과.
- `node node_modules/next/dist/bin/next build --webpack`: 종료 코드 0, 정적 페이지 79/79 생성. 생성 BUILD_ID `ASMWPLGJniPdGnkQ-P-Zb`.
- middleware convention 경고는 기존 상태다. 기본 Turbopack 빌드 통과를 주장하지 않는다.
- 첫 빌드·갤러리 저장은 디스크 여유 0으로 실패했다. 캐시 삭제는 자동 승인 검토가 차단했고 실행되지 않았다. 이후 공간이 다시 확보된 상태에서 갤러리 저장과 빌드를 재시도하여 통과했다. 사용자 파일을 삭제하지 않았다.
- `node tools/landing-review/pair-checkpoint.mjs verify`: `only-allowed-changes`, `outside: []`, 기준 파일 621개 동일.
- 기존 기본 체크포인트와 Emons 시작 기준에 이어, 이번 단계는 `artifacts/emons-freezpak-baseline.json`을 사용한다. 기준 파일을 덮어쓰지 않았다.
- MCP 네 서버 응답 확인 통과. 도구가 동작한다는 사실과 시각 검증 결과를 구별했다.

## 지시와 다르게 판단한 부분 및 한계

1. Freezpak 본문 Roobert 대신 Mona Sans를 사용했다. 비교 화면에 폰트 차이를 명시했고, 원본 제목 폰트·크기와 본문 크기·좌표는 유지했다.
2. Emons는 기존 JSL 영어를 사용했다. Freezpak 본문은 JSL 서비스 설명으로 작성했다. 레퍼런스 회사의 보유 시설·역량을 JSL 사실로 넣지 않았다.
3. 기존 부가 서비스 표시 위치를 Freezpak 다음으로 이동했다. 콘텐츠는 그대로이며, 승인된 두 레퍼런스 구간을 붙이기 위한 랜딩 조립 변경이다.
4. 이번 두 구간은 영어 비교 시안이다. 네 언어 번역 완료나 네 언어 글리프를 갖춘 최종 폰트 선정 완료를 주장하지 않는다.
5. 원본과 다른 JSL 공통 UI와 카피 줄바꿈은 비교 갤러리에 그대로 표시했다. 모든 픽셀이 동일하다고 보고하지 않는다.
6. 원본 미디어·벡터는 로컬 임시 자산이다. 출처·파일·라이선스 확인 상태는 `TEMP-ASSETS.md`에 기록했다. 최종 공개 자산 교체는 남아 있다.
