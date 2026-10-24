# 공지 링크 HTTP 검사

`notice-links-check.mjs`는 배포된 JSL 앱의 서버 렌더 HTML만 읽어 네 로케일의 랜딩 푸터 공지 링크와 공지 페이지 응답을 확인하는 경량 CLI다. Node 기본 `fetch`만 사용하며 패키지 설치, 브라우저, 앱 서버 기동, 인증 우회를 하지 않는다.

## 실행

```powershell
node tools/landing-review/notice-links-check.mjs https://preview.example.com
```

base URL은 `http` 또는 `https` 절대 URL이어야 하며 credential, query, fragment를 받을 수 없다. 보호된 프리뷰에 cookie나 token을 넣는 옵션은 제공하지 않는다.

성공 시 네 줄을 출력하고 종료 코드 `0`을 반환한다.

```text
PASS ko: /landing -> /notices
PASS en: /en/landing -> /en/notices
PASS zh: /zh/landing -> /zh/notices
PASS vi: /vi/landing -> /vi/notices
```

하나라도 실패하면 응답 본문이나 인증값을 출력하지 않고 `FAIL` 한 줄과 종료 코드 `1`을 반환한다. 인수가 잘못되면 종료 코드 `2`다.

## 검사 범위

각 로케일에 대해 다음 순서로 검사한다.

1. 랜딩 경로가 redirect 없이 HTTP 200 HTML을 반환하는지 확인한다.
2. 랜딩의 `<html>` 태그에 있는 실제 `lang` 속성이 요청 로케일과 같은지 확인한다.
3. SSR HTML의 실제 문서 마크업에서 `<footer>`를 찾고, 그 안에 실제 `href` 속성이 있는 링크 중 같은 origin의 정확한 notices 경로가 있는지 확인한다.
4. notices 경로가 redirect 없이 HTTP 200 HTML을 반환하는지 확인한다.
5. notices의 `<html lang>`이 요청 로케일과 같은지 확인한다.

다음 응답은 성공으로 처리하지 않는다.

- 다른 origin 또는 로그인 경로 redirect
- HTTP 401, 403, 404와 그 밖의 non-200 상태
- HTTP 200으로 반환된 로그인 제목 또는 실제 `input[type="password"]`가 있는 문서
- HTML이 아닌 응답, 빈 문서, footer 또는 notices href 누락
- 주석, script/style/textarea 등의 raw text, template 콘텐츠 안에만 있는 footer 마크업
- 잘못된 `<html lang>` 또는 `Content-Language`
- 5초 timeout
- 선언 크기 또는 실제 읽은 크기가 2MiB를 넘는 응답

redirect는 `manual`로 처리한다. 따라서 최종 로그인 페이지의 HTTP 200이나 다른 origin의 성공 응답을 앱 성공으로 오판하지 않는다.

## 자체 검사

```powershell
node --check tools/landing-review/notice-links-check.mjs
node --check tools/landing-review/notice-links-check.test.mjs
node --test tools/landing-review/notice-links-check.test.mjs
```

테스트는 loopback 임시 HTTP 서버와 인메모리 `Response` fixture를 사용한다. 임시 서버는 테스트가 끝나면 닫는다. 정상 4로케일과 외부 redirect, 로그인 redirect·문서, `data-lang`/`data-href`만 있는 문서, 주석·script/style/textarea·template 안의 footer 문자열, 속성 값 안의 `>`, 숫자 문자 참조 password type, 이중 인코딩 href, 403, 404, href 누락, 언어 불일치, timeout, 과대 응답, CLI 실패 종료 코드를 포함한다.

## 한계

이 도구는 SSR HTML의 상태·언어·footer href를 확인한다. 주석, raw-text 요소, template 콘텐츠를 제외하는 제한된 스캐너를 사용하며 표준 HTML 파서가 아니다. 브라우저 클릭, hydration 이후 동작, 키보드 접근성, 라이트·다크 화면, 모바일 레이아웃, 시각적 품질을 검증하지 않는다. API가 없어 공지 카드가 오류 상태를 표시하는 문제도 이 도구의 대상이 아니다.
