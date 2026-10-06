# 미리보기 복구 · 2026-10-06

## 확인과 조치

- 정지 초안 비교 서버 `http://127.0.0.1:4313/`는 HTTP 200이었다. 실제 인앱 브라우저에 새 탭으로 열고 화면 표시를 확인했다. 이 탭을 결과물로 유지했다.
- 실제 사이트 `http://localhost:3000/landing`의 서버가 꺼져 있었다.
- `next dev --webpack --port 3000`을 시작했으나 첫 랜딩 컴파일이 WorkerError/HTTP 500으로 실패했다. 이후 `ERR_MEMORY_ALLOCATION_FAILED`와 heap allocation 오류로 프로세스가 종료됐다. 이 오류를 Three.js 구현 불가능의 근거로 해석하지 않는다.
- 소스 변경 없이 기존 완료 빌드(`BUILD_ID: ASMWPLGJniPdGnkQ-P-Zb`)를 `npm run start -- --port 3000`으로 실행했다. 화면을 브라우저에서 확인했다. 이는 프로덕션 빌드 미리보기이며 개발 시 자동 새로고침 서버가 아니다.
- 브라우저 검사: 문서 제목 JSL Logistics, 본문 6076자, 주요 제목·Emons/Freezpak 구간 존재, 오류 오버레이 없음.
- 남은 콘솔 오류: `http://localhost:5000/api/shipments/public-summary` 연결 거부. 백엔드가 꺼져 있어 통계 API 연결은 복구하지 않았다. 화면 표시와 API 정상 동작을 구별한다.
- 캡처: `tools/landing-review/artifacts/playwright/preview-restored-landing-20261006.png`, `preview-opened-directions-20261006.png`.
- 보존 검사: `node tools/landing-review/preview-scope.mjs verify` → 692파일 변경 없음.
- 실제 랜딩 코드를 수정하지 않아 tsc/lint/build/unit test를 다시 실행하지 않았다. 기존 완료 빌드를 다시 실행한 것이며 새 빌드 통과로 보고하지 않는다.

## 초안과 애니메이션의 구현 범위 — 제안

정지 초안의 레이아웃·색·텍스트 위계는 웹 UI로 구현할 수 있다. 이미지의 모든 사물을 동일한 품질로 자유롭게 움직일 수 있는 3D 자산이 이미 있는 것은 아니다. 기존 파일에서 실제 3D 모델(GLB/glTF/FBX/BLEND)을 확보하지 못했고, 장비 이미지·절차적으로 만든 컨테이너·서비스 영상·벡터 Lottie를 확인했다.

1. 기존 모션의 구간 고정, 스크롤 진행률, 진입/퇴장 시점과 장면 전환을 측정해 기준으로 보존한다.
2. 시안의 사진 속 차량·컨테이너를 실제로 이동/회전시킬 구간은 동일한 장비/컨테이너 모델 또는 렌더 시퀀스로 새로 제작한다. 배경 정지 이미지의 교차 페이드로 적재/회전을 검증했다고 하지 않는다.
3. 화물 과정의 기존 벡터 Lottie를 사실적인 장면으로 바꿀 때는 내부 자산과 움직임을 재제작해야 한다. 기존 스크롤 타임라인의 기능과 새 자산의 모션 품질을 구별한다.
4. 처음에는 운송수단 → 화물 과정 두 장면의 짧은 모션 샘플을 1440×900으로 만든다. 정지 구도, 중간 프레임의 접촉/비율, 정방향/역방향을 확인하고 스크롤에 연결한다.
5. 실제 hero/14번 및 요청 밖 구간 변경은 포함하지 않는다. 두 초안 중 구현할 방향 확인을 요청했으며 실제 사이트에 새 디자인을 적용하지 않았다.

기술 확인: 현재 프로젝트에 GSAP, Three.js, React Three Fiber가 있다. [ScrollTrigger 공식 문서](https://gsap.com/docs/v3/Plugins/ScrollTrigger)의 pin/scrub 및 타임라인 진행률 제어를 Context7로 조회했다. 새로운 라이브러리를 설치하지 않았다.
