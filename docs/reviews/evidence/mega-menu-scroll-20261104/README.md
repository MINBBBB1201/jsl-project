# 메가메뉴 내부 스크롤 (#54)

- 구현: Claude Opus 5.5 (`claude-opus-5-5`, Anthropic). 자체 검사이며 독립 검토는 Codex 담당.
- 기준: `feat/landing-redesign` `031406a`. 변경: `frontend/src/components/landing/mega-menu.tsx` 최상위 div 클래스 한 줄과 주석.
- 방식: 패널 높이를 `max-h-[calc(100dvh-7.5rem)]`로 화면에 맞추고 `overflow-y-auto overscroll-contain scroll-py-6`로 내부 스크롤. Radix 뷰포트(공통 `navigation-menu.tsx`)는 내용 높이를 재므로 수정하지 않았습니다. 메뉴 구성·문구·링크·주황 테마 그대로.

## 측정 (운영 빌드 `next start`, headless Chromium, 수정 전 `031406a` → 후)
| en·vi × 1800×1000·1800×720 × For Shippers·For Forwarders (8조건) | 전 | 후 |
|---|---|---|
| 패널이 화면 안 (For Shippers 아래 끝 1000/720 화면) | 1595/1595px 밖 | 997/717px 안 |
| 키보드 Tab으로 마지막 링크 도달 시 화면에 보임 | Shippers 4건·vi Forwarders 720 실패 | 8/8 |
| 패널 위 휠 | 페이지가 움직임, 패널 0 | 페이지 고정, 패널 462~878px 스크롤 |
| 포커스 표시, Shift+Tab, Esc 닫힘·트리거 포커스 복귀 | 정상 | 정상 |
| 내용이 화면보다 짧은 Forwarders 1800×1000 | 스크롤 없음 | 스크롤 없음(변화 없음) |

앵커 회귀(같은 통합 아님, 이 브랜치 단독): 1800 메가메뉴 `#network` 움직임 켬 첫 로드·로드됨, 동작 줄이기 `#contact`, 390 모바일 메뉴 `#network` 통과(위치·해시·포커스·스크롤 잠금 해제). 모바일 메뉴는 이 컴포넌트를 쓰지 않습니다.

검사: 변경 파일 ESLint, `next build`, `tsc --noEmit --incremental false` 통과. 유닛·화물추적·전체 화면 검사는 무관한 파일이라 반복하지 않았습니다.

## 파일
- `shippers-1800x1000-before-after.jpg`, `shippers-1800x720-before-after.jpg`: Tab으로 마지막 링크까지 간 상태 전/후
- `after-open-wheel-vi.jpg`: 수정 후 열린 상태, vi 1800×720 휠 스크롤 뒤, vi Forwarders 마지막 링크

## 한계
7.5rem은 1800px 헤더 기준 값입니다(헤더 메뉴는 1728px 이상에서만 표시). Safari·실기기, 트랙패드 관성, 브라우저 확대/축소, #49·#52와의 통합 tree는 확인하지 않았습니다.
