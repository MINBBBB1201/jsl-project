# 독립 리뷰 후속 조치 — 2026-10-23

PR #25에 대한 독립 리뷰(OpenCode `oc-2`, 읽기 전용)에서 확인된 결함 중 코드와 문서로 고칠 수 있는 3건의 처리 내용이다. 법적 문구와 운영 고지문은 이 문서의 범위가 아니다.

## 1. 접수 성공 후 요청 키 초기화

기존 동작: `ContactSection`의 `retryRef`(Idempotency-Key)는 내용이 바뀔 때만 새 키를 만들었다. 접수에 성공해도 키가 남아, 폼에 같은 내용이 남은 채로 다시 전송하면 같은 키로 서버가 기존 접수 번호를 그대로 돌려줬다. 사용자 화면에는 새 접수와 구분되는 표시가 없다.

이 동작은 의도된 것이었다. Review 03의 브라우저 검증이 "receipt and repeated submit retain one record"라는 흐름으로 접수 성공 직후 재전송이 레코드를 늘리지 않는지 확인했다(`tools/contact-review/browser.cjs`, VALIDATION.json의 flows). 목적은 더블 클릭과 응답 유실 후 재시도의 중복 방지다.

바꾼 이유: 요청 키가 막아야 하는 대상은 "서버가 접수했는지 클라이언트가 모르는 재전송"이다. 성공 응답을 받은 뒤에는 클라이언트가 결과를 알고 있으므로 같은 키를 유지할 근거가 없다. 성공 후 다시 보내는 것은 사용자가 의도한 새 문의로 보는 쪽이 맞다고 판단했다.

변경: 접수 확정(`setReceipt`) 직후 `retryRef.current = null`. 실패·응답 유실·고지 변경 409에서는 키를 유지하므로 재시도 보호는 그대로다. 서버는 키 단위로만 중복을 판정하므로 새 키로 같은 내용을 보내면 새 레코드가 생긴다(`contact-inquiry.repository.js`의 `saveOnce`).

남는 한계: 성공 후에도 폼 값과 제출 버튼이 그대로라서, 성공 직후 같은 내용을 의도 없이 한 번 더 누르면 문의가 2건 접수된다. 폼을 비우는 동작은 요청 범위 밖이라 바꾸지 않았다.

이에 맞춰 `tools/contact-review/browser.cjs`의 해당 흐름과 이후 레코드 수 기대값(2→3, 3→4)을 새 동작에 맞췄다. 이 스크립트는 Playwright와 Chrome이 필요해 이번에 실행하지 못했다. `evidence/review-03`의 산출물은 당시 실행 결과이므로 고치지 않았다.

## 2. 문의 통합 테스트 실행 경로

`backend/tests/contact-readiness.node.cjs`는 `node:test` 형식이고 파일명이 `.node.cjs`라서 jest의 `testMatch`(`*.test|spec.[jt]s`)에 잡히지 않는다. 기본 `npm test`를 통과해도 이 17건은 실행되지 않는다.

`backend/package.json`에 `"test:contact": "node --test tests/contact-readiness.node.cjs"`를 추가했다. 의존성과 lockfile은 바꾸지 않았다. 실행법은 [RELEASE-PLAN.md](RELEASE-PLAN.md)의 "테스트 재실행"에 적었다. 기본 `npm test`에 합치지 않은 이유는 jest 설정이나 테스트 러너를 바꾸는 더 큰 변경이 되기 때문이다.

## 3. 공개 API 계약 변경

[CONTACT-API-COMPATIBILITY.md](CONTACT-API-COMPATIBILITY.md)에 기록했다. 코드는 바꾸지 않았다.

## 검증 (2026-10-23)

- `npm run test:contact`: 17건 통과. 폐기 가능한 MongoDB 7.0.24와 메인 체크아웃의 `node_modules`를 `NODE_PATH`로 읽기 전용 재사용했다.
- frontend: `eslint .` 통과, `tsc --noEmit` 통과, `npm run test:units` 70건 통과.
- 기본 `npm test`(jest, `--runInBand`): 94건 중 43건 통과, 51건 실패, 3개 스위트 실패. 실패한 스위트는 모두 `mongod` 기동 단계의 `fassert() failure`와 연결 시간 초과였다. 실행 시점에 C: 드라이브 여유 공간이 약 10MB였고, 이번 변경은 backend 소스를 건드리지 않았다. 디스크 부족이 원인이라는 직접 증거(ENOSPC 메시지)는 확인하지 못했으므로 충분한 디스크에서 다시 실행해야 한다.
- 요청 키 초기화는 컴포넌트 안의 한 줄이며 이를 단독으로 검증하는 자동 테스트는 없다(프런트 유닛 테스트에 컴포넌트 렌더링 환경이 없다). `tools/contact-review/browser.cjs`는 문법만 확인했고 실행하지 못했다.
