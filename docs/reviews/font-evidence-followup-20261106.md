# GeneralSans 조사 보완과 남은 조건

읽기 전용 조사 에이전트는 [Fontshare 라이선스 페이지](https://www.fontshare.com/licenses/itf-ffl)가 로드하는 [공식 JS 번들](https://www.fontshare.com/js/main.d962d2d8.js)의 FFL 항목을 확인했다. 보고된 표기는 Version 2.0, 17 Aug 2026이다. 자체 웹사이트에 호스팅하는 조건과 저장소 등으로 파일을 재배포하는 조건은 따로 다뤄야 한다. 부모의 웹 텍스트 도구는 라이선스 페이지에서 JavaScript 안내만 받았고 FAQ API를 읽지 못했다. 원문 확인의 실행 주체·접근 방식이 다름을 기록한다.

공식 폰트 API의 General Sans 분류와 CSS API의 400/500/600/700 URL 연결도 조사했다. 이번에는 폰트 바이너리를 다운로드하지 않았다. #36의 2026-11-02 기록에는 이미 400/700의 공식 CDN 직접 바이트 대조가 있으므로 이전 HEAD/ETag 한계만으로 다시 미완료라고 쓰지 않는다. 500/600 직접 대조도 아래 후속 조사에서 완료했다.

도입 커밋의 Fontshare 취득 기록만으로 회사의 동의·당시 적용 버전을 입증하지 않는다. 현재 공개 저장소의 바이너리 보관 방식, 취득·동의 근거와 적용 조건은 별도 확인이 필요하다. 서체 교체, 외부 CDN 전환, 저장소 공개 범위 변경, 이력 수정은 하지 않았다. 이 기록은 법률상 사용 허가 확정이나 #36 완료 판단이 아니다.


## 500·600 공식 CDN 직접 대조 완료

2026-11-06 읽기 전용 조사 에이전트가 공식 CSS API의 font-weight 선언에서 URL을 얻고, 응답 바이트를 메모리로 읽어 SHA-256을 계산했다. 새 폰트 바이너리를 디스크에 저장하지 않았다. 두 응답은 HTTP 200, Content-Type `font/woff2`였으며 현재 통합본 파일과 일치했다.

| 두께 | 크기(bytes) | CDN·로컬 공통 SHA-256 |
| --- | ---: | --- |
| 500 | 22,904 | `c30377df1de8444d07161725c751f458beec07c28034df2fd275d1aa587a239f` |
| 600 | 23,092 | `94a2a0e1ef59728eb65498ed7fe26e5af7e2858a3a4a278a89ac1f83a0544945` |

- [공식 CSS API](https://api.fontshare.com/v2/css?f%5B%5D=general-sans%40400%2C500%2C600%2C700&display=swap)
- [500 WOFF2](https://cdn.fontshare.com/wf/3RZHWSNONLLWJK3RLPEKUZOMM56GO4LJ/BPDRY7AHVI3MCDXXVXTQQ76H3UXA63S3/SB2OEB6IKZPRR6JT4GFJ2TFT6HBB6AZN.woff2)
- [600 WOFF2](https://cdn.fontshare.com/wf/K46YRH762FH3QJ25IQM3VAXAKCHEXXW4/ISLWQPUZHZF33LRIOTBMFOJL57GBGQ4B/3ZLMEXZEQPLTEPMHTQDAUXP5ZZXCZAEN.woff2)

같은 에이전트가 공식 JS 번들도 Python urllib로 HTTP 200 응답을 받아 gzip 해제 후 확인했다(411,500 bytes). FFL Version 2.0, 17 Aug 2026 표기와 Section 01 자체 호스팅, Section 02 저장소 등 재배포 제한 및 자체 호스팅 예외를 확인했다. 일반 페이지의 JS 안내와 직접 번들 본문 확인을 구분한다.

400/700 기존 대조와 합쳐 네 두께의 파일 정체 확인은 끝났다. 회사 취득·동의 근거, 적용 라이선스 버전과 공개 저장소의 바이너리 보관·재배포 방식은 여전히 확인 대상이다. 바이트 일치를 사용 허가나 #36 완료로 처리하지 않는다.
