# 문의 고지 조회 상태와 대체 연락 경로

실제 로컬 Next 운영 빌드를 Chromium으로 열어 캡처했다. 고지 API는 지연 후 503을 반환하는 합성 응답이며 실제 회사 고지나 접수 결과가 아니다. 이메일 링크는 포커스만 확인했고 메일 앱을 실행하거나 메시지를 보내지 않았다.

- en 1440×1000 / ko·zh·vi 390×844, 동작 줄이기 설정.
- 조회 중 안내, aria-busy=true, 재조회 비활성 확인.
- 503 뒤 기존 이메일 두 개의 mailto 연결, 키보드 포커스, 고지 없는 제출 차단 확인.
- 네 조합 모두 페이지 오류·가로 넘침 없음. 결과는 results.json.
- 캡처: `*-loading.png`, `*-unavailable.png`. 주황 테두리는 실제 키보드 포커스 표시다.

언어/조회 회차와 마지막 완료 회차를 비교해 로딩을 계산한다. 첫 구현의 effect 내부 동기 setState가 ESLint에 걸려 수정했고 최종 변경 파일 lint를 통과했다. 최종 `next build --webpack`의 컴파일·TypeScript·정적 페이지 생성도 통과했다. 설치나 lockfile 변경은 없으며 로컬 Turbopack 재현은 아니다.

정책 사전검사 도구는 별도 node:test 11개를 통과했다. 운영 정책 원문·DB·계정·배포를 변경하지 않았다. 승인·외부 입력은 `docs/landing/EXTERNAL-INPUTS.md`로 분리했다.

최종 문의 회귀: ko/en PC, ko/vi 모바일 네 조합 × 다섯 흐름, 총 20/20 통과. 고지 실패 차단·필수 입력 포커스·합성 201·유실 후 동일 키 재시도·409 재동의 포함. fixture-contact-summary.json 참조.
