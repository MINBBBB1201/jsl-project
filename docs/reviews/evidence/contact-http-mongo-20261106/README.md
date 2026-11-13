# 실제 로컬 HTTP·MongoDB 문의 통합 검사

2026-11-06. `contact-http-mongo-browser.cjs`로 실제 로컬 Next4192 → HTTP Express 문의 router5000 → 임시 MongoDB7.0.24를 연결했다. 합성 정책과 합성 문의만 사용했다. 운영 DB·정책·계정·알림 발송을 사용하지 않았다.

최종12조건 통과: 실제503 입력·접수 차단, ko/en/zh/vi 각각201과DB저장, 저장 후 모든 응답 유실→새로고침→같은 키200/접수번호·문서1건, 실제409 이후 고지 재조회·동의 해제, 개인정보 공개 페이지4언어 미확정 내용 차단, 실제 브라우저 OPTIONS5건204.

최종 실행에서는 API route mocking/interception이 없다. 브라우저 DNS를 이 테스트 프로세스에서 loopback 외 실패하도록 설정했고, Express는 ::1에만 바인딩했다. 검사 후 브라우저·Express5000·임시 MongoDB를 종료했다. 기존 Next4192 검수 서버는 유지했다.

첫 도구 실행은 재조회 버튼·체크박스의 중복 선택자로 실패했다. 다음 실행에서 한 번만 응답을 끊으면 브라우저가 재시도할 수 있음을 고려하지 못했다. 모든 성공 응답을 잠시 끊고 15초 프런트 제한보다 길게 기다리도록 고쳤다. 세 번째 실행은 Playwright route interception이 OPTIONS를 생략해 실제 CORS 검사에 실패했다. 최종 실행은 interception을 제거해 실제 OPTIONS를 확인했다. 이 도구 보정 실패를 앱 결함이나 통과 수에 합산하지 않았다.

## 한계와 재실행

- 실제 source router·service·repository·body parser를 사용하지만 전체 server.js와 운영 origin허용 설정은 실행하지 않았다. 로컬 CORS 성공을 운영 CORS·Render·알림 전달 확인으로 계산하지 않는다.
- SYNTHETIC LOCAL REVIEW 정책과 receipt 캡처이며 회사 고지나 실제 접수가 아니다. 검사 소스는 실행 당시 미커밋 상태였고 결과 JSON에 주요 소스 LF SHA-256을 기록했다.
- 설치·다운로드 없이 기존 Express/Mongoose/MongoMemoryServer/Playwright와 Mongo7.0.24 바이너리를 쓴다. JSL_PLAYWRIGHT_MODULE, JSL_CHROMIUM_PATH, NODE_PATH, MONGOMS_SYSTEM_BINARY, MONGOMS_RUNTIME_DOWNLOAD=false와 증거 출력 경로를 지정한다.
- 현재 로컬 리뷰 빌드의 loopback API 번들을 명시적으로 검사한다. 그 묶음 이름이 달라지면 실제 API가 localhost5000인지 확인하고 도구의 대상 경로를 갱신해야 한다. 기존5000 서비스가 있으면 실패하며 다른 프로세스를 종료하지 않는다.
- 실행: 저장소 루트에서 `node --max-old-space-size=256 tools/landing-review/contact-http-mongo-browser.cjs`. 물리1200MB·가상1800MB 이상, 단독 검수 실행을 확인한다.

[결과·소스 해시](results.json), [합성 로컬 접수 캡처](synthetic-local-http-mongo-receipt-en.png).
