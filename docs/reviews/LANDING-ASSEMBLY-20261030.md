# 승인 장면 랜딩 조립 — 2026-10-30

## 이번 결과

기존 PR #29 브랜치에 main `8a615c86a87c2359e3aca4f48b706bffbbc387e9`을 자동 병합했다. 충돌 없이 만든 staged tree가 `git merge-tree` 결과와 같음을 확인한 뒤 `11b21a7`로 저장했다.

페이지 구성은 main의 기존 섹션 목록을 기준으로 복원했다. IndustrialJourney 자리에 기존 승인 MultimodalJourney를 연결하고, 네트워크·회사소개만 승인 초안에서 옮긴 React 컴포넌트로 교체했다. 나머지 히어로, 장비, 별도 해상·항공 장면, 서비스·운영·가격·FAQ·문의·인증·푸터를 유지했다. 기존 섹션 파일은 삭제하지 않았다. PR29의 격자 네트워크와 획일화한 전체 슬라이드 구성은 이번 조립에서 쓰지 않는다.

Claude Opus 5.5가 외부 폴더에 작성한 TSX/CSS 네 파일을 Codex가 검토하고 앱에 연결했다. Codex는 회사소개에 위치·레이어를 추가해 앞선 비행기가 본문을 덮는 문제를 막고, 두 CTA를 기존 SiteLink로 연결했다. 임시 iframe 연결은 제거했다. native 페이지에서 iframe 0개, network/about ID 각 1개, 거점 5개·가치 4개를 확인했다.

## 자산 경계

- 지구본 land.geojson은 기존 승인 초안에서 복사했다. 출처·배포 조건의 최종 승인을 이번 검사로 대신하지 않는다.
- 회사소개 외부 참고 이미지는 `NODE_ENV=development`일 때만 URL prop을 넘긴다. `public/assembly-review/`는 gitignore로 제외했다. JSL 현장 또는 사용 허가가 확정된 이미지로 표현하지 않는다.
- 운영 모드에는 참고 이미지 대신 본문·CTA가 남는 무매체 구도가 나온다. 따라서 로컬 사진 화면과 운영 화면이 같다고 보고하지 않는다.
- 기존 운송 자산의 라이선스 문제도 해결됐다고 주장하지 않는다.

## 실행한 검사

- Next typegen 성공 후 전체 TypeScript `tsc --noEmit --incremental false`: 통과.
- 이번 변경 TSX 세 파일 ESLint: 통과. 마지막 레이어·SiteLink 변경 후 다시 검사했다.
- staged 병합 및 조립 diff whitespace 검사: 통과.
- Next webpack 개발 서버에서 영어 랜딩 실제 렌더: 통과.
- 데스크톱 기본 브라우저 크기와 모바일 390×844에서 지구본·회사소개 캡처.
- 지구본 데이터 ready, 다섯 거점 표시, 클릭·ArrowRight 선택/포커스 이동 확인.
- 회사소개 참고 이미지 naturalWidth 1920, 가치 4개, CTA #contact/#features 확인.
- 모바일 가로 넘침 없음. 페이지 내 중복 ID 없음. 확인 시 브라우저 오류 로그 0건.
- React 검토: 육지 데이터 지연 로딩·캐시, Observer 해제, RAF 취소, 늦게 도착한 데이터 무시를 확인했다. 성능 측정이나 장애 주입 검사는 하지 않았다.

캡처는 로컬 `D:/jsl-validation/release-20261030/landing-assembly/captures/`의 network-desktop/mobile 및 company-desktop/mobile PNG 네 장이다. 참고 이미지가 포함되어 저장소에는 올리지 않았다.

## 남은 항목과 인계

1. 한국어 기본 /landing에 로컬 307 반복을 관찰했다(127.0.0.1에서 localhost로 이동 후 같은 주소 반복). 영어 /en/landing은 200이다. 운영 회귀로 단정하지 않았고 라우팅 소스는 변경하지 않았다. Claude가 현재 로컬 서버의 기본 로케일 경로부터 재현·원인을 좁힌다.
2. 한국어·중국어·베트남어 제목/라벨과 축소·역방향/동작 줄이기 검수는 아직 남았다. 새 디자인이나 전체 글꼴 통일은 하지 않는다.
3. 이번 회차에는 전체 production build·모든 유닛·운영 배포를 실행하지 않았다. 승인된 구도 선택 후 최종 통합 검증을 한다.
4. 기존 해상·항공 장면과 운송 시퀀스는 보존을 위해 함께 남겼다. 반복 여부와 연결 길이는 사용자와 실제 화면으로 결정하고 임의 삭제하지 않는다.
5. 참고 매체 교체와 권리 확인, 독립 전체 diff 리뷰 전까지 PR28/29는 Draft다. main 병합·운영 배포는 별도 사용자 승인이다.
6. 회사 정책 입력이 필요한 PR25와 운영 계정 작업은 이번 디자인 회차에서 변경하지 않았다.

Codex가 이번 턴 작업을 마친 뒤 Claude가 기존 전용 worktree에서 단독 작성자로 이어갈 수 있다. 구체적 재개 순서와 파일 소유권은 로컬 CLAUDE-RESUME.md에 있다.
