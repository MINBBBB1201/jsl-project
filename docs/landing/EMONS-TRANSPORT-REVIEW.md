# Emons 운송수단 구간 교체 · 검수 기록

2026-10-05. 작업 브랜치: `codex/landing-emons-transport`.

## 범위와 보존

기존 `JourneyServiceStage`와 `FeaturesSection`의 운송 모드 안내를 새 `EmonsTransport`로 교체했다. 기존 `FeaturesSection`의 부가서비스 내용·링크는 `onlyValueAdded`로 남겼다. 히어로, 14번 장면, 그 뒤의 도로·바다·네트워크·회사 소개 등에는 코드를 추가하지 않았다. 메시지·라우팅·API·패키지 의존성은 수정하지 않았다.

시작 체크포인트: 621개 파일 모두 일치. 종료 시 원본 체크포인트는 의도한 수정도 변경으로 보고한다. `verify-emons-scope.mjs`에서 다음 6개만 허용하고, 나머지 프런트엔드 해시 변경이 0개인지 확인한다.

- `frontend/src/app/landing/landing-page-content.tsx`: 컴포넌트 연결
- `frontend/src/app/landing/components/features-section.tsx`: 기존 부가서비스 보존, 해시 처리 중복 방지
- `frontend/src/app/landing/components/emons-transport.tsx`
- `frontend/src/app/landing/components/emons-transport.css`
- `frontend/public/images/landing/emons/services.mp4`
- `frontend/public/images/landing/emons/poster.webp`

체크포인트는 프런트엔드 `src`, `public`, 주요 설정을 대상으로 하며 백엔드는 포함하지 않는다. 시작 시 이미 있던 백엔드 package 변경은 이번 작업에서 수정하지 않았다. Git HEAD와의 diff에는 이전 사용자 작업이 포함되므로 이번 변경 범위의 증거로 대신 사용하지 않는다.

## 실제 관찰

원본: https://www.emons.de/ 의 홈페이지 첫 01–05 구간.

| 항목 | 원본에서 확인한 동작·측정 | 적용 |
|---|---|---|
| 미디어 | 46초 전체 화면 3D 영상, `object-fit: cover` | 동일 임시 영상, 비율 유지 |
| 진행 | Straße → Logistik → Luft & See → Schiene → Digital, 휠/터치 한 동작당 다음 장면 | GSAP ScrollTrigger Observer로 구간 안에서 단계 이동 |
| 설명 전환 | 1초 동안 이전 설명 위로, 다음 설명 아래에서 진입 | 같은 방향·시간의 전환 |
| 영상 | 장면별 구간 반복, 정방향은 카메라 이동 구간 재생, 역방향은 이전 구간으로 이동 | 관찰한 프레임 경계에 따라 반복/전환 |
| 데스크톱 | 좌하단 카드 폭 약 28.3%, 왼쪽 여백 약 1.45%, 아래 여백 10.1%; 하단 번호와 활성 모드 확장 | 같은 상대 위치·크기 관계 |
| 제목 | 1440px에서 약 41.8px, 400 굵기, 행간 약 1 | 2.9vw / 400 / 1, 기존 JSL 폰트 사용 |
| 색 | 붉은 버튼 #fa4e42, 살구 탭 #ffb79d, 흰 반투명 설명 | 해당 구간에만 적용 |
| 모바일 | 390×844에서 제목 약 30px / 1.2, 본문·번호 숨김, 하단 제목/버튼, 플러스 버튼 | 같은 반응형 구성 |

라이브러리 감지 자체를 모션 검증으로 취급하지 않았다. 원본에서 휠을 조작하고 패널 위치·영상 시간을 측정했다. 구현은 기존 설치된 GSAP를 사용하며 새 런타임 라이브러리를 추가하지 않았다. Context7의 GSAP ScrollTrigger 문서에서 pin, context/matchMedia 및 정리 방법을 확인했다.

## 원본과 달리 적용한 부분

1. JSL의 기존 항공/해상/육상/철도/특송 문구와 순서를 유지했다. 영상 속 장소·Emons 로고는 임시 상태다. 영상의 원본 서비스 분류와 JSL 다섯 모드가 완전히 동일한 것은 아니다.
2. 기존 JSL 공통 메뉴·진행 표시를 보존했고 Emons 헤더를 추가하지 않았다.
3. 원본 Clashgrotesk 폰트 파일을 새로 들이지 않았다. 기존 JSL 폰트로 측정한 크기·굵기·행간 위계를 적용했다. 번역 길이에 따라 카드 높이·줄바꿈이 달라진다.
4. 원본의 페이지 최상단 전체 스크롤 잠금은 중간 섹션에 그대로 적용할 수 없어, 이 구간만 pin하고 진입·퇴장을 허용한다. 히어로의 스크롤을 가로채지 않는다.
5. 원본의 여러 시설 핫스폿 대신 JSL 운송 모드마다 하나의 설명 핫스폿을 연결했다. 새 회사 정보나 디자인 장식을 만들지 않았다.
6. 감소된 모션에서는 영상/고정을 끄고 모든 모드 링크가 접근 가능한 정적 목록으로 표시한다.

따라서 픽셀 전체·폰트·콘텐츠까지 완전히 동일하다는 주장을 하지 않는다. 원본 구도와 미디어·전환을 가져온 로컬 비교 구현이다.

## 화면 검수

- 원본과 JSL 각각 1440×900, 390×844에서 첫/가운데/마지막 장면 5장씩: 총 60개 비교 이미지.
- 비교 영상 시점: 각 장면 시작 +0.4/+0.8/+1.2/+1.6/+2.0초. 원본은 동일 영상 캐시를 Range 지원 요청 응답으로 공급했다. 페이지의 DOM/CSS/스크롤 코드는 바꾸지 않았다.
- 정지 비교와 별개로 실제 휠 전환, 역방향, 구간 진입·퇴장을 확인했다.
- 실제 1440×900 휠 전환 영상: `tools/landing-review/artifacts/playwright/jsl-scroll.webm`. 활성 모드 1→2→3→4와 역방향·퇴장을 녹화했고, 저장된 WebM의 프레임 디코딩도 확인했다.
- 한국어 두 화면 크기에서 0–100%를 2.5% 간격으로 검사·촬영: 82개 위치. 영상 준비 상태, 활성 모드, 설명 영역 좌표, 가로 넘침, 오류 오버레이를 기록했다.
- ko/en/zh/vi × 다섯 모드 × 두 화면 크기: 40개 상세 펼침에서 화면 밖으로 밀리는 설명이 없었다.
- 감소된 모션: 다섯 모드 모두 노출되고 링크에 키보드로 접근 가능, 영상 비노출.
- 캡처에 나타나는 기존 진행 표시·설정 버튼은 보존한 공통 UI다.

증거: `tools/landing-review/artifacts/playwright/`의 원본/JSL PNG, `scan-ko.json`, `locale-review.json`, `extra-review.json`, `wheel-review.json` 및 비교 갤러리 `emons-review.html`.

## 검사 결과

- `npx tsc --noEmit`: 통과.
- `npm run lint`: 통과. 첫 검사에서 발견한 새 코드의 prefer-const 오류는 수정 후 재검사했다.
- `npm run test:units`: 114/114 통과.
- 기본 `npm run build`(Turbopack): 기존 전역 Poppins·Be Vietnam Pro의 fonts.gstatic.com 다운로드 오류로 실패. 새 컴포넌트의 타입 오류가 아니었다.
- `next build --webpack`: 마지막 수정 이후 생산 빌드 재검사 통과(exit 0). 실행 옵션을 사용하며 package.json이나 Next 설정을 변경하지 않았다.
- `checkpoint.mjs verify`: 의도한 6개 변경을 보고한다. `verify-emons-scope.mjs`: 허용 범위 밖 변경 0개.

빌드 로그: `tools/landing-review/artifacts/emons-build-webpack.log`.

## 도구·기존 환경 상태

Playwright, Chrome DevTools, Context7 smoke 검사는 통과했다. Next DevTools는 시작 시 개발 서버가 없어 대기 상태였고, 개발 서버 실행 후 3000 포트를 발견하고 응답했다.

개발 브라우저에는 기존 `localhost:5000/api/shipments/public-summary` 연결 실패와 히어로 WebGL 경고가 관찰됐다. 교체 구간에서 오류 오버레이나 미디어 로딩 실패는 없었다. 해당 기존 구간은 수정 범위 밖이다.

상업 공개 전 영상·포스터를 JSL 자산으로 교체할 대상은 `TEMP-ASSETS.md`에 기록했다. 기본 Turbopack 빌드의 전역 폰트 다운로드 문제는 생산 빌드 실행 옵션 결과와 별도로 남긴다.
