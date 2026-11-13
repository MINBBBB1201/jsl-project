# 선택한 실적B안 연결

2026-11-06. 사용자는 B가 덜AI처럼 느껴진다고 선택하고 기존 애니메이션을 최대한 보존하도록 요청했다. B의 어두운 비대칭 구성에 기존 주황·종이색을 유지했다.

## 변경

월간AIR/SEA/TRUCK을 먼저, 회사 규모4항목을 보조 열로 배치했다. 같은 크기 카드·아이콘·상단발광과200/160px 빈 공간을 없앴다. 시안보다 제목·숫자를 줄이고 굵기를400/600으로 정리했다. 네 언어 설명·수치·단위와 CountUp7개는 기존소스에서 읽는다. 모바일은 세로 배치와 테마 버튼용 여백을 쓴다.

원본 CountUp의1.2초 이징·40%진입·한 번 재생·동작 줄이기 처리를 보존했다. 별도 운영 요약 API컴포넌트와 실패 시 접기 동작도 유지했다. API·메시지·요금·정책·해상생성 모듈은 변경하지 않았다.

## 확인

- 최종webpack빌드·TypeScript·78정적페이지, 변경TSXlint·diff·Impeccable detector 통과.
- en1440,ko390,zh390,vi320의 실제 앱 캡처와 수치7개·넘침0·오류0 확인.
- 일반 모션의 대표수치0→200과 총47개 표시값(시작·최종값 포함) 관찰. 합성요약503 접기와 성공 패널 유지 확인.
- 특정모바일위치 수치가림을 발견해 보정한 뒤 같은 좌표와 전체텍스트 스윕에서 재검사했다.
- 전체유닛·문의DB는 이 시각변경 때문에 반복하지 않았다. Safari·실기기·최신 타사리뷰는 남는다.

[실제 캡처와 한계](evidence/stats-b-20261106/README.md). 미적용 A/B 정지안은 외부 검수 폴더에 보존했으며 실제 앱 캡처와 구분한다.

## 참고 조사

공식DHL About/KeyFigures와 Rotterdam Facts & Figures에서 수치의 단위·기준과 정보를 구분하는 방식을 확인했다. 사진·로고·외부실적을 복제하지 않았다.

- https://group.dhl.com/en/about-us.html
- https://reporting-hub.group.dhl.com/2025-fy/en/the-company/key-figures/
- https://www.portofrotterdam.com/sites/default/files/2026-03/containers-fact-sheet-2025.pdf

무료GLM latestdelta 검토는 이전bcaba55를 대상으로90초 동안 출력이 없었다. 실제서빙·검토결과 미확인으로 종료했고 반복·유료전환하지 않았다. 이번B안의 타사리뷰 완료로 계산하지 않는다. main 병합·운영배포는 하지 않았다.
