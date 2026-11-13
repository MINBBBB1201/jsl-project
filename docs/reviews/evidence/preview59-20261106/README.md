# PR #59 실제 프리뷰 확인

- 검토 소스: `11d8aeae0e4550ef05b74571f6f9ac30b68f1218`
- Vercel deployment: `dpl_7biMwNYrPskhqG4aD4hy2KHzw6DJ`, READY, Git 메타데이터의 SHA가 위 소스와 일치.
- 주소: https://jsl-logistics-frontend-4c7df8z4n-minbbbb1201s-projects.vercel.app
- Chromium, en 1440×1000 / ko 390×844, 동작 줄이기 설정. 인증된 프리뷰 접근을 사용했으며 인증 URL·토큰·쿠키는 저장하지 않음.
- 실제 배포를 읽었고 API fixture는 사용하지 않음. GET/HEAD/OPTIONS 외 요청은 도구에서 차단하도록 설정. 실제 차단 대상 요청은 0건이고 문의 제출·로그인은 하지 않음.

## 관찰

1. 두 언어 랜딩 모두 200, html lang 일치, 페이지 JavaScript 오류 0, 가로 넘침 없음.
2. 회사소개 PNG가 1672×941로 정상 해독됨. PC의 한 줄 제목·큰 JSL, 모바일의 두 줄 제목·세로 크롭을 실제 캡처에서 확인. 이미지 자체는 AI 콘셉트이며 실제 JSL 현장 사진이 아님.
3. Render의 실제 `/api/contact/notice?language=en`과 `language=ko`가 404를 반환. 직접 GET으로도 JSON `{"status":"fail","message":"Route not found."}` 확인. 해당 프리뷰 Origin을 허용하는 CORS 응답 헤더가 있음. 이번 요청이 CORS 때문에 차단된 것으로 판정하지 않음.
4. 고지 없음 상태에서 두 화면 모두 이름·이메일·내용·동의·제출이 비활성화되고, 준비 중 안내·다시 확인 버튼·기존 연락처·개인정보처리방침 링크가 유지됨.
5. `/en/notices`, `/en/tracking`, `/sign-in` 직접 GET은 최종 경로 유지, 모두 200. 로그인 성공이나 페이지의 업무 기능을 확인한 것은 아님.

첫 관찰에서는 고지 요청이 `ERR_ABORTED`였고 다음 모바일 요청은 관찰 종료 시 완료되지 않았다. 이를 서버 상태로 확정하지 않았다. 두 번째 관찰은 폼의 10초 제한보다 길게 기다렸고 양쪽 404를 확인했다. 최초 지연의 원인은 계측하지 않아 알 수 없다. `results.json`은 두 번째 관찰 결과다.

## 캡처

- [회사소개 PC](company-en-1440.png)
- [회사소개 모바일](company-ko-390.png)
- [문의 PC](contact-en-1440.png)
- [문의 모바일](contact-ko-390.png)
- [응답·DOM 상태 측정](results.json)

## 한계와 다음 순서

프런트가 실제 API에 연결된 것과 문의 접수가 가능한 것은 별개다. 새 문의 백엔드 배포, 고유 인덱스 준비와 회사 승인 고지가 남았다. 승인된 고지·실제 문의 저장·알림·직원 로그인·Safari·실기기·일반 모션의 전체 스크롤은 이번 검사에서 확인하지 않았다. 기존 로컬의 합성 접수 테스트와 구분한다.

이후 문서와 이 증빙만 추가하므로 이미 통과한 앱 빌드·테스트를 반복하지 않았다. main 병합·운영 배포는 하지 않았다.
