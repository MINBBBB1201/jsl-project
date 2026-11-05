# 도로 장면 위에서 본 트럭 이미지 교체 (#51)

- 구현: Claude Opus 5.5 (`claude-opus-5-5`, Anthropic). 자체 검사이며 독립 검토는 Codex 담당.
- 기준: `feat/landing-redesign` `031406a`. 변경: `frontend/public/images/multimodal/truck-top.webp` 한 장과 같은 폴더 `SOURCES.md` 한 줄. 코드·엔진(`jsl-multimodal.mjs`)·컨테이너 지붕(`roof-quality.avif`)·항만·창고 이미지는 그대로입니다.

## 출처
- 원본: 저장소에 이미 있는 `frontend/public/images/landing/industrial/truck-original.glb`. Innerscene "Semi tractor and box trailer", CC0 ([조건](https://www.innerscene.com/tools/library/terms)). 기록은 `docs/landing/FREE-ASSET-SOURCES.md`, 바이트 일치 원본은 `tools/landing-review/artifacts/logistics-models-20261006/`.
- 새 타사 이미지는 넣지 않았습니다. 교체 전 파일은 United Carriers 레퍼런스(권리 미확인)였습니다.

## 만든 방법
Three.js 0.185(저장소 `node_modules`) + headless Chromium. 직교 카메라로 바로 위에서 2400×1200 투명 배경 렌더 → 트레일러 계열 메시(`Box_trailer`, `Trailer_chassis`, `Rear_door`, `Door_lock_rod`, `Landing_leg/shoe`, 후미등) 86개 숨김, 트랙터 112개 유지 → 캡 도장 재질(`orange`, `blue`)만 `#2b2f36`으로 → 트랙터 알파 영역으로 자르고 좌우 반전(캡이 오른쪽) → 높이 207px로 줄여 기존과 같은 1200×337 투명 캔버스의 같은 자리(오른쪽 끝 x 1175, y 68–275)에 배치. 엔진은 이 이미지 왼쪽 위에 컨테이너 지붕을 겹치므로 연결 구도는 그대로입니다.

## 전후 (운영 빌드 `next start`, 같은 스크롤 위치·같은 크기)
| 파일 | 조건 |
|---|---|
| `pc-1440x900-light-before-after.jpg` | en 1440×900, 스크롤 8400 |
| `mobile-390x844-light-before-after.jpg` | ko 390×844, 스크롤 7100 |
| `pc-truck-zoom-before-after.jpg` | PC 트럭 부분 2배 확대 |

두 위치 모두 트럭 요소 불투명도 1, 위치·크기 전후 동일(PC 245–519 × 232–309, 모바일 12–191 × 289–353), 페이지 오류 0. 다크 색 구성표로도 찍었지만 이 장면은 색 구성표와 무관하게 같은 화면이라 라이트만 올렸습니다.

## 한계
- `FREE-ASSET-SOURCES.md`는 이 모델을 측면 장면용으로 "직육면체 캡, 단색 재질로 사실성 미달"이라 판단했습니다. 위에서 보면 약 70px 크기라 차이가 작지만, 기존보다 디테일이 단순합니다. 사용자 시각 승인이 필요합니다.
- 좌우 반전이라 운전석 쪽이 바뀝니다(위에서 보는 실루엣은 대칭).
- 사이드 마커 몇 픽셀이 남아 있습니다(확대해야 보임).
- Safari·실기기는 확인하지 않았습니다.
