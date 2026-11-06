# 다음 해상 시각 작업의 기준

2026-11-06 읽기 전용 조사다. 이번에는 선박·물 자산이나 생성 엔진을 바꾸지 않았다.

## 최신 코드가 빠진 상태는 아님

현재 앱 `frontend/src/app/landing/multimodal/jsl-multimodal.mjs`의 생성 헤더는 초안 저장소 commit `c9763d57bdbed14a057af9ce9016ee235d9d0460`을 가리킨다. 조사 당시 초안 저장소 HEAD도 같고 clean이었다. 선택 장면 표시 `jslSelected`, `initMarineWater`와 `sea-vessel-photo.webp` 연결을 확인했다. 같은 보관 코드를 다시 복사하는 것으로 품질 향상을 기대하지 않는다.

## 비교 후보

| 자료 위치 | 크기·성격 | 사용 범위 |
| --- | --- | --- |
| 초안 루트 `production/sea-render/outputs/water-rake-review/desktop-76-baseline.jpg` | 1440×900, Blender 기준 반사·전체 장면 비교 | 사용자가 고른 반사 성격 확인. 항공 전환 합성도 포함하며 물 텍스처 파일은 아님. |
| `D:/CodexScratch/jsl-uc-20261020/wavelets/full-v1/wavelets-desktop-65.jpg` | 1440×900, Cycles48샘플 정지 렌더 | 세밀한 수면 시각 목표. 65% 한 장이며 모션·모바일 승인 아님. |
| 초안 루트 `production/sea-render/outputs/selected-20261021/desktop-after-65.png` | 1440×900, 선택 Three.js 캡처 | 10월21일 기록. 다음 날 반사 얼룩 보완 전이므로 현재 앱 최신 캡처로 제시하지 않음. |

## 다음 실행 순서

1. 현재 앱을 같은65% 카메라·1440×900으로 캡처하고 Cycles 후보와 나란히 비교한다. 정지 렌더를 곧바로 물 배경으로 넣지 않는다.
2. 선박을 새것처럼 보이게 할 재질·선실 디테일과 자연스러운 카메라를 검토한다. 화물 연결·정지·출항 흐름을 보존한다.
3. 실시간 파형·반사 보완으로 목표를 달성할지, 별도 렌더 접근이 필요한지 판단한다. 0.5% 간격 저해상도6샘플 모션 표본을 최고 화질로 선택하지 않는다.
4. 항공·구름은 별도 고해상도 재제작이며 사용자 지정 Gemini 연결 경로를 먼저 확인한다. 내부 대시보드 주황 테마는 마지막 순서로 유지한다.
