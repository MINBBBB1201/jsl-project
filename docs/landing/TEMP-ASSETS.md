# Emons 임시 레퍼런스 자산

2026-10-05. 로컬 비교 시안 전용. 상업 공개 전에 JSL 자산으로 교체한다.
원본 미디어에는 Emons 로고·차량·건물이 포함된다. 권리 확보된 최종 JSL 영상으로 취급하지 않는다.

| 프로젝트 파일 | 원본 URL | 용도 |
|---|---|---|
| frontend/public/images/landing/emons/services.mp4 | https://www.dropbox.com/scl/fi/250zdi0b12k0udljb6vtc/Emons-3D-Animation_250528_Web.mp4?rlkey=rzz56x6ewtmt1cjgj0k7ik6oi&st=ojumbhkf&raw=1 | 46초 원본 3D 서비스 영상 |
| frontend/public/images/landing/emons/poster.webp | https://cdn.prod.website-files.com/66c856a2e1e5dc372a191eaa/687f8a88fe4d8f598c4109ed_Emons%203D%20Animation_250416_Thumbnail.webp | 로딩 전 포스터 |

출처 페이지: https://www.emons.de/

원본 비교 캡처는 외부 서버 버퍼링을 피하기 위해 Playwright의 request interception으로 동일한 영상 바이트를 공급했다. Range 요청을 지원하며, 원본 페이지의 DOM·CSS·스크롤 코드는 바꾸지 않았다. 비교 정지 프레임은 각 장면 시작 + 0.4/0.8/1.2/1.6/2.0초에서 정지해 촬영했다. 실제 재생·전환 검수와 구분한다.

## Emons → Freezpak 연결 시안 추가 자산

2026-10-05. 사용자 승인 범위: Emons 보완, Freezpak 화물 과정, 두 장면 연결. 기존 히어로·14번은 보존했다. 원본 영상·벡터는 로컬 비교용이며 공개 전 JSL 자산으로 교체할 대상이다.

아래 경로는 `frontend/public/` 기준이다. 바이트 수와 원본 URL은 `tools/landing-review/artifacts/pair-assets.json`에도 저장했다.

| 파일 | 원본 URL | 용도 |
|---|---|---|
| images/landing/freezpak/desktop.json | https://cdn.prod.website-files.com/660eb6abe8cde3bea6a9c111/6669c2d77776396910ac1f10_freezpak-logistics.json | 데스크톱 화물 과정 Lottie |
| images/landing/freezpak/mobile.json | https://cdn.prod.website-files.com/660eb6abe8cde3bea6a9c111/666ab8b5b624df6d15a73b5d_freezpak-logistics-mobile.json | 모바일 화물 과정 Lottie |
| fonts/landing-reference/ClashGrotesk-Regular.woff2 | https://cdn.prod.website-files.com/66c856a2e1e5dc372a191eaa/67040024f9f32da66ec8952e_ClashGrotesk-Regular.woff2 | Emons 본문 |
| fonts/landing-reference/ClashGrotesk-Medium.woff2 | https://cdn.prod.website-files.com/66c856a2e1e5dc372a191eaa/671a79fb19670e966650540a_ClashGrotesk-Medium.woff2 | Emons 타이포 |
| fonts/landing-reference/ClashGrotesk-Semibold.woff2 | https://cdn.prod.website-files.com/66c856a2e1e5dc372a191eaa/671a79fbfd6f29e2e55ea499_ClashGrotesk-Semibold.woff2 | Emons 버튼·목록 |
| fonts/landing-reference/MonaSansCondensed-ExtraBold.woff2 | https://cdn.prod.website-files.com/660eb6abe8cde3bea6a9c111/662646f307b4e0712180d7ba_MonaSansCondensed-ExtraBold.woff2 | Freezpak 원본 제목 폰트 |
| fonts/landing-reference/MonaSans-Variable.woff2 | https://cdn.prod.website-files.com/660eb6abe8cde3bea6a9c111/6626479bda0f1f7e5f00f607_MonaSans%5Bslnt%2Cwdth%2Cwght%5D.woff2 | 원본 Roobert 대신 쓰는 본문 폰트 |
| fonts/landing-reference/MonaSans-LICENSE.txt | https://raw.githubusercontent.com/github/mona-sans/main/LICENSE | Mona Sans OFL 라이선스 |

출처 페이지: https://www.freezpak.com/ 및 https://www.emons.de/.

Mona Sans 라이선스는 파일과 함께 보관했다. Clash Grotesk의 공식 출처는 https://www.fontshare.com/fonts/clash-grotesk 이다. 공식 라이선스 전문을 이번 조사에서 확인하지 못했으므로, 상업 공개 전 해당 조건을 확인한다. 폰트 출처 기록이 다른 사이트의 영상·애니메이션 자산에 대한 사용 허가를 뜻하지 않는다.

제목의 짧은 원본 문구는 비교 시안에 유지했다. Freezpak 본문은 JSL 서비스 내용으로 작성했으며, 원본의 냉장창고 보유 주장 등을 JSL 사실처럼 옮기지 않았다.
