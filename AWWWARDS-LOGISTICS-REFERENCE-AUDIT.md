# Awwwards “Logistics” 레퍼런스 전수 분석

조사일: 2026-09-21  ·  검색 결과: **94개**  ·  Awwwards 상세 페이지에서 원본 링크 확인: **49개**

## 조사 방식

- 검색 결과가 무한 로딩이므로 카드 수가 더 이상 증가하지 않을 때까지 실제 Chrome으로 로드했다.
- 94개 Awwwards 상세 페이지에서 설명과 원본 링크를 추출했다.
- 최신·핵심 30개는 1440×900 브라우저로 실제 렌더링하여 제목 폰트, 크기, 배경, 이미지·영상·Canvas·SVG·고정 요소 수, GSAP/Three.js/Lenis/Webflow/Next.js 흔적을 확인했다.
- 종료·차단된 사이트는 Awwwards 대표 화면과 설명만 사용했다. 확인할 수 없는 모션은 추정하지 않았다.

## 전체 결론

1. 좋은 물류 사이트는 장비 자체보다 **화물의 상태 변화, 서비스 책임, 운영 가시성**을 주인공으로 만든다.
2. 강한 사이트는 하나의 좌표계 안에서 물체가 이어진다. 서로 다른 사진을 CSS로 교차 페이드한 합성은 거의 보이지 않는다.
3. 최근 사례는 초대형 타이포를 쓰지만 본문은 단정한 산세리프를 사용한다. 세리프는 의료·고급 서비스처럼 의미가 분명한 경우에만 쓴다.
4. 3D와 Canvas는 Nash·Madar·carcompany.ai처럼 “시스템이 판단하거나 연결되는 과정”을 설명할 때 효과적이다. 단순 장식용 3D는 빠르게 AI 템플릿처럼 보인다.
5. JSL에 가장 적합한 조합은 **Emons의 서비스 구조 + Freezpak의 화물 생명주기 + Nash/Madar의 운영 데이터 + Viamaster/Aden의 인간적 신뢰**다.

## JSL 우선순위

|등급|사이트|이유|
|---|---|---|
|A|Emons, Freezpak, Nash, Madar, Gather AI, M.V.P.|서비스·화물·운영 데이터와 모션이 직접 연결됨|
|A-|carcompany.ai, Viamaster, Aden, Optimal Dynamics, Zencargo|전문성·신뢰·제품 증명이 강함|
|B|Truck’N Roll, Duyvenvoorde, Flexis, HOP, Stuart, Quivo|강한 비주얼 언어가 있으나 JSL 톤에 맞춘 절제가 필요|
|제외|AttoLabs, Pompidou, LOKA, 일반 테마 상품|검색 오탐 또는 AI/템플릿 인상이 강함|

## 사이트별 분석

### 1. M.V.P. Trans-Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/m-v-p-trans-logistics) · [원본 사이트](https://mvplogistics.eu/en/main-en/)
- **핵심 분석:** 짙은 남색·검정과 초대형 압축 타이포, 트럭 영상, 서비스 번호 체계가 결합된 영화적 기업 사이트다. 장면의 힘은 강하지만 JSL은 같은 구도를 복제하기보다 “운송 상태가 증거로 쌓이는 과정”으로 서사를 바꾸는 편이 안전하다.
- **실측:** H1 "Noto Sans KR", 32px, weight 700 · 이미지 9 · 영상 2 · Canvas 0 · SVG 2 · 고정/Sticky 0 · 감지 기술 wordpress.

### 2. Reform HQ

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/reform-hq) · [원본 사이트](https://www.reformhq.com/)
- **핵심 분석:** 검정 배경, 80px Instrument Sans, 제품 UI 카드와 AI 에이전트 흐름을 중심으로 한 제품 주도형 사이트다. 추상 3D보다 실제 운영 화면을 큰 카드로 보여 주며 신뢰를 만든다. JSL 대시보드·문서·추적 기능을 랜딩에 연결할 때 가장 실용적인 레퍼런스다.
- **실측:** H1 "Instrument Sans", Arial, sans-serif, 80px, weight 500 · 이미지 72 · 영상 1 · Canvas 0 · SVG 40 · 고정/Sticky 3 · 감지 기술 webflow.

### 3. carcompany.ai - Clinical Moves

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/carcompany-ai-clinical-moves) · [원본 사이트](https://carcompany.ai/)
- **핵심 분석:** 116px Newsreader 세리프와 Inter를 조합해 의료 물류를 편집 디자인처럼 표현한다. GSAP·Three.js·Lenis, Canvas를 사용하지만 모션은 “환자·약·장비가 목적지에 도착하는 이유”를 설명한다. 기술 과시보다 서비스 의미를 강화하는 모션의 좋은 예다.
- **실측:** H1 Newsreader, "Times New Roman", serif, 116px, weight 400 · 이미지 5 · 영상 0 · Canvas 1 · SVG 14 · 고정/Sticky 3 · 감지 기술 gsap, three, lenis.

### 4. Gather AI

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/gather-ai) · [원본 사이트](https://gather.ai)
- **핵심 분석:** 창고를 저채도 3D 공간과 데이터 레이어로 해석한다. 73.6px Montserrat 라이트, 영상, 다수의 이미지와 고정 요소를 사용하며 제품의 물리적 가시성을 중심 메시지로 삼는다. JSL의 추적·파손판정·컨테이너 플래너를 실제 운영 장면과 연결하는 데 적합하다.
- **실측:** H1 Montserrat, "Montserrat Placeholder", sans-serif, 73.6px, weight 300 · 이미지 113 · 영상 1 · Canvas 0 · SVG 7 · 고정/Sticky 7 · 감지 기술 lenis.

### 5. Truck’N Roll®

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/truckn-roll-r) · [원본 사이트](https://trucknroll.com/)
- **핵심 분석:** 검정 배경, 정면 트럭, 200px 초대형 압축 타이포로 투어 물류의 긴장감을 만든다. Three.js와 Lenis 흔적이 있고 장면 전환이 브랜드 태도와 직접 연결된다. 장비를 크게 쓰되 물체 접촉과 관성까지 사실적으로 완성해야 효과가 난다는 기준점이다.
- **실측:** H1 "National 2 Condensed", sans-serif, 200.012px, weight 900 · 이미지 11 · 영상 0 · Canvas 0 · SVG 29 · 고정/Sticky 6 · 감지 기술 three, lenis, react.

### 6. Duyvenvoorde

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/duyvenvoorde) · [원본 사이트](https://duyvenvoorde.nl)
- **핵심 분석:** 꽃 유통이라는 소재를 검정 배경, 강한 색의 제품 사진, 153px 타이포와 흐르는 선으로 구성한다. 물류를 차량보다 상품의 생명주기와 품질로 설명한다. JSL도 화물 종류와 취급 조건을 시각적 주인공으로 만들 수 있다는 참고 사례다.
- **실측:** H1 bricolage, "bricolage Fallback", 153.5px, weight 800 · 이미지 52 · 영상 1 · Canvas 0 · SVG 50 · 고정/Sticky 6 · 감지 기술 next.

### 7. https://www.nash.ai/

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/https-www-nash-ai) · [원본 사이트](https://www.nash.ai/)
- **핵심 분석:** 짙은 남색 바탕에 발광하는 네트워크·지도·실시간 주문 수치를 배치한 물류 AI 플랫폼이다. GSAP·Three.js·Canvas를 사용하며 “스스로 회복하는 물류”를 시스템 모션으로 설명한다. JSL의 컨트롤타워 장면에 가장 직접적인 레퍼런스다.
- **실측:** H1 "Host Grotesk", sans-serif, 56px, weight 700 · 이미지 46 · 영상 1 · Canvas 2 · SVG 38 · 고정/Sticky 3 · 감지 기술 gsap, three, webflow.

### 8. Viamaster International

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/viamaster-international) · [원본 사이트](https://www.viamaster-intl.com/)
- **핵심 분석:** 전면 영상·사진 위에 149px 확장형 타이포를 얹은 정통 운송사 사이트다. 기술보다 지역성·사람·책임감을 강조한다. JSL의 기업 신뢰 구간과 실제 현장 사진 사용법을 참고하기 좋다.
- **실측:** H1 archivo-expanded, helvetica, -apple-system, arial, sans-serif, 149.273px, weight 300 · 이미지 22 · 영상 1 · Canvas 0 · SVG 10 · 고정/Sticky 1 · 감지 기술 wordpress.

### 9. Flexis

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/flexis-1) · [원본 사이트](https://flexis-mobility.com)
- **핵심 분석:** 전기 상용차와 도시 물류를 어두운 네이비, 대형 Britti Sans, 전면 영상으로 설명한다. 고정 요소가 많고 제품 자체를 주인공으로 유지한다. JSL에서는 장비 자산의 질이 충분할 때만 유효하다.
- **실측:** H1 "Britti Sans", 80px, weight 500 · 이미지 49 · 영상 1 · Canvas 0 · SVG 15 · 고정/Sticky 15 · 감지 기술 wordpress.

### 10. Madar

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/madar) · [원본 사이트](https://madarplatform.com/en)
- **핵심 분석:** 120px Suisse, 흰색 타이포, 짙은 배경, 3D/Canvas 기반 운영 플랫폼 시각화가 핵심이다. 속도·온도·중량·경로 같은 실시간 데이터를 장면 속 오브젝트에 붙인다. JSL의 추적 데이터와 컨테이너 계산 결과를 시각화할 때 유용하다.
- **실측:** H1 Suisse, helvetica, arial, sans-serif, 120px, weight 300 · 이미지 44 · 영상 0 · Canvas 1 · SVG 38 · 고정/Sticky 23 · 감지 기술 three.

### 11. Raqi

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/raqi-2) · [원본 사이트](https://raqi.com)
- **핵심 분석:** 따뜻한 베이지와 짙은 색, Gambarino 세리프와 Geist의 조합으로 WhatsApp 기반 물류 운영을 차분하게 설명한다. GSAP·Lenis가 쓰이지만 제품 사용 흐름이 우선이다. 화려함을 줄이면서도 고급스러운 B2B 경험을 만드는 예다.
- **실측:** H1 Gambarino, "Times New Roman", sans-serif, 72px, weight 400 · 이미지 32 · 영상 0 · Canvas 0 · SVG 22 · 고정/Sticky 1 · 감지 기술 gsap, lenis, webflow.

### 12. Nextcrew

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/nextcrew) · [원본 사이트](https://nextcrew.at)
- **핵심 분석:** 현재 원본은 공사 중 페이지뿐이라 현재 디자인을 평가할 수 없다. Awwwards 대표 화면만 보존 자료로 사용할 수 있으며 JSL 핵심 레퍼런스로 삼기에는 근거가 부족하다.
- **실측:** H1 미검출 · 이미지 1 · 영상 0 · Canvas 0 · SVG 0 · 고정/Sticky 1 · 감지 기술 wordpress.

### 13. Emons

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/emons) · [원본 사이트](https://www.emons.de/)
- **핵심 분석:** 도로·물류·항공·해상·철도·디지털을 01–05 서비스 체계로 분류하고 GSAP·Lenis로 전환한다. 과장된 단일 장면보다 다중 운송수단의 정보 구조가 강점이다. JSL 서비스 구조와 가장 직접적으로 대응한다.
- **실측:** H1 Clashgrotesk, sans-serif, 41.7998px, weight 400 · 이미지 30 · 영상 1 · Canvas 0 · SVG 118 · 고정/Sticky 8 · 감지 기술 gsap, lenis, webflow.

### 14. Freezpak

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/freezpak) · [원본 사이트](https://www.freezpak.com/)
- **핵심 분석:** 180px Mona Sans Condensed와 차가운 녹색/백색 팔레트로 콜드체인의 전문성을 강하게 표현한다. 항만→보관→운송이라는 생명주기를 한 흐름으로 보여 준다. JSL의 한 건의 화물 서사를 설계할 때 유용하다.
- **실측:** H1 "Mona Sans Condensed", sans-serif, 180px, weight 800 · 이미지 49 · 영상 0 · Canvas 0 · SVG 12 · 고정/Sticky 2 · 감지 기술 webflow.

### 15. BPRO Better Catering Solutions

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/bpro-better-catering-solutions) · [원본 사이트](https://www.bpro-solutions.com/de)
- **핵심 분석:** 산업 제품과 급식 물류를 정교한 제품 사진·96px Helvetica Neue·촘촘한 정보 구조로 설명한다. 물류 회사보다는 산업 제품 카탈로그에 가깝지만 장비 상세와 솔루션 분류 방식은 참고할 수 있다.
- **실측:** H1 "Helvetica Neue", sans-serif, 96.16px, weight 500 · 이미지 9 · 영상 1 · Canvas 0 · SVG 92 · 고정/Sticky 0 · 감지 기술 next, react.

### 16. HAULK

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/haulk) · [원본 사이트](https://wezom.com/portfolio/haulk-ecommerce)
- **핵심 분석:** 실제 회사 사이트가 아니라 WEZOM의 물류 이커머스 구축 사례 페이지다. 68px Manrope와 어두운 포트폴리오 레이아웃이지만 JSL 랜딩의 직접 레퍼런스보다 기능 설명·성과 정리 형식을 참고하는 편이 맞다.
- **실측:** H1 Manrope, "Manrope Fallback", Helvetica, Arial, Helvetica, Arial, sans-serif, 68px, weight 700 · 이미지 6 · 영상 0 · Canvas 0 · SVG 36 · 고정/Sticky 7 · 감지 기술 three, next, react.

### 17. Logika / Beyond Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/logika-beyond-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 18. Flexis

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/flexis) · [원본 사이트](https://flexis-mobility.com/)
- **핵심 분석:** 전기 상용차와 도시 물류를 어두운 네이비, 대형 Britti Sans, 전면 영상으로 설명한다. 고정 요소가 많고 제품 자체를 주인공으로 유지한다. JSL에서는 장비 자산의 질이 충분할 때만 유효하다.
- **실측:** H1 "Britti Sans", 80px, weight 500 · 이미지 49 · 영상 1 · Canvas 0 · SVG 15 · 고정/Sticky 15 · 감지 기술 wordpress.

### 19. XCOLD

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/xcold) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 20. LOGICORE CO.,LTD.

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/logicore-co-ltd) · [원본 사이트](https://logicore-osaka.jp/)
- **핵심 분석:** 라이브 사이트는 보안 차단으로 확인되지 않았다. 보존 썸네일은 흑백 창고 사진, 세리프 로고타입, 절제된 일본 편집 디자인을 사용한다. 분위기 참고는 가능하지만 모션 근거는 없다.
- **실측:** H1 미검출 · 이미지 1 · 영상 0 · Canvas 0 · SVG 0 · 고정/Sticky 0 · 감지 기술 wordpress.

### 21. HPS Trade Co., Ltd.

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/hps-trade-co-ltd) · [원본 사이트](https://www.hps-trade.co.th/)
- **핵심 분석:** 현재 라이브 접근이 차단됐다. Awwwards 대표 화면은 강한 인물 사진과 대형 영문 타이포를 사용해 국제 네트워크를 강조한다. JSL의 파트너·거점 섹션에 제한적으로 참고할 수 있다.
- **실측:** H1 미검출 · 이미지 1 · 영상 0 · Canvas 0 · SVG 0 · 고정/Sticky 0 · 감지 기술 wordpress.

### 22. Satalia

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/satalia) · [원본 사이트](https://www.satalia.com)
- **핵심 분석:** 보라색 그라디언트·구형 3D 오브젝트·59px WPP 산세리프로 AI와 공급망 최적화를 표현한다. Lenis와 영상이 있지만 전형적인 AI 기업 미학이 강하다. JSL이 피하려는 “AI 티”가 날 수 있어 데이터 표현만 선별해야 한다.
- **실측:** H1 wpp, sans-serif, 59.896px, weight 500 · 이미지 36 · 영상 2 · Canvas 0 · SVG 35 · 고정/Sticky 15 · 감지 기술 lenis, wordpress.

### 23. Manuport Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/manuport-logistics-2) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 24. Resonant Link

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/resonant-link) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 25. Manuport Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/manuport-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 26. Skylan Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/skylan-logistics) · [원본 사이트](http://www.skylan.it)
- **핵심 분석:** 검정 중심의 국제 운송 브랜드로 지도·네트워크·강한 로고 그래픽을 사용한다. 현 사이트는 비교적 정적인 정보형이며 러시아어 중심이다. 고급감보다 노선·통관·보험의 구체성을 참고할 가치가 있다.
- **실측:** H1 Inter, Arial, sans-serif, 35px, weight 700 · 이미지 97 · 영상 0 · Canvas 0 · SVG 7 · 고정/Sticky 6 · 감지 기술 특정 흔적 없음.

### 27. DAMU LOGISTICS

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/damu-logistics-1) · [원본 사이트](https://damu.liqium.com/)
- **핵심 분석:** 라이브 사이트는 종료됐다. 보존 화면은 넓은 흰 여백, 연한 회청색 구조 그래픽, 산업단지 중심의 제도적 디자인이다. JSL의 기업·거점 소개를 포멀하게 만드는 참고 자료다.
- **실측:** H1 "Segoe UI", Arial, "Malgun Gothic", Gulim, sans-serif, 24px, weight 400 · 이미지 2 · 영상 0 · Canvas 0 · SVG 0 · 고정/Sticky 0 · 감지 기술 react, vue.

### 28. AttoLabs

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/attolabs) · [원본 사이트](https://attolabs.eu/)
- **핵심 분석:** AI·개발사 사이트로 물류와 직접 관련은 약하다. 모노스페이스 기반 68px 타이포와 다수 Canvas/Three.js 장면을 사용한다. 사용자가 피하고 싶은 AI형 비주얼과 모노 폰트의 대표 사례이므로 제외 기준으로 유용하다.
- **실측:** H1 "Fontsfree Net Maison Neue Mono", sans-serif, 68.4px, weight 400 · 이미지 34 · 영상 1 · Canvas 5 · SVG 0 · 고정/Sticky 2 · 감지 기술 three, wordpress.

### 29. HOP envios

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/hop-envios) · [원본 사이트](https://www.hopenvios.com.ar/)
- **핵심 분석:** 청록과 주황, 일러스트, 72px Be Vietnam Pro로 소비자 배송을 친근하게 설명한다. Next.js와 Lenis, 다수 SVG 애니메이션을 사용한다. JSL 공공 랜딩에는 다소 캐주얼하지만 추적 CTA와 단계 설명은 참고할 만하다.
- **실측:** H1 __beVietnamPro_4c384e, __beVietnamPro_Fallback_4c384e, 72px, weight 500 · 이미지 26 · 영상 0 · Canvas 0 · SVG 85 · 고정/Sticky 2 · 감지 기술 lenis, next.

### 30. Future of Last Mile Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/future-of-last-mile-logistics) · [원본 사이트](https://www.rajapack.co.uk/future-last-mile-logistics)
- **핵심 분석:** 현재는 봇 차단으로 원본을 확인하기 어렵다. 보존 화면은 파란 배경과 단순 도형으로 미래 배송 시나리오를 설명하는 인포그래픽형 캠페인이다. 장기 스토리텔링 구조는 참고 가능하나 기업 신뢰 화면으로는 가볍다.
- **실측:** H1 Raleway, "Raleway fallback", "Raleway Arial fallback", Arial, sans-serif, 40px, weight 900 · 이미지 2 · 영상 0 · Canvas 0 · SVG 0 · 고정/Sticky 1 · 감지 기술 특정 흔적 없음.

### 31. Impilo Health Care

- **분류:** 인접 산업/플랫폼
- **자료:** [Awwwards](https://www.awwwards.com/sites/impilo-health-care) · 원본 링크 없음/종료
- **핵심 분석:** 인접 산업/플랫폼 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 32. Aden Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/aden-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 33. LODISNA Transport & Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/lodisna-transport-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 34. Stuart

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/stuart) · [원본 사이트](https://www.stuart.com)
- **핵심 분석:** 밝은 시안, 아이소메트릭 도시, 48px 압축 타이포로 라스트마일 배송을 쉽게 설명한다. 영상과 3D 흔적이 있으나 정보 구조는 가격·운송 옵션·실시간 추적 중심이다. 서비스 이해도는 높지만 JSL의 포멀한 국제 물류 톤에는 색을 절제해야 한다.
- **실측:** H1 gt-walsheim-condensed, sans-serif, 48px, weight 700 · 이미지 46 · 영상 1 · Canvas 0 · SVG 15 · 고정/Sticky 4 · 감지 기술 three, react.

### 35. SOS Global

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/sos-global) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 36. Zencargo

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/zencargo) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 37. Pompidou

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/pompidou) · [원본 사이트](http://pompidou.pl/index.html)
- **핵심 분석:** 창작 에이전시 사이트로 물류 검색의 오탐이다. 영상과 밝은 카피 중심이며 JSL 레퍼런스에서 제외하는 것이 맞다.
- **실측:** H1 "Open Sans", sans-serif, 40px, weight 300 · 이미지 3 · 영상 1 · Canvas 0 · SVG 0 · 고정/Sticky 3 · 감지 기술 webflow.

### 38. O'Neill & Brennan

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/oneill-brennan) · [원본 사이트](https://constructionlogistics.com)
- **핵심 분석:** 현재 SSL 오류로 원본 사이트가 열리지 않는다. 보존 화면은 청록·회색, 건축 사진, 얇은 타이포를 사용한 건설 물류 포트폴리오다. 구조물과 현장 맥락을 차분하게 보여 주는 방식만 참고 가능하다.
- **실측:** H1 "Segoe UI", Arial, "Malgun Gothic", Gulim, sans-serif, 24px, weight 400 · 이미지 2 · 영상 0 · Canvas 0 · SVG 0 · 고정/Sticky 0 · 감지 기술 react, vue.

### 39. Highwave

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/highwave) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 40. Quivo

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/quivo) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 41. Coros

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/coros) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 42. InSofa, Ideas of Comfort

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/insofa-ideas-of-comfort) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 43. Air Ocean Cargo

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/air-ocean-cargo) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 44. LOKA

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/loka) · [원본 사이트](https://www.loka.com/)
- **핵심 분석:** 개발·AI 컨설팅 회사로 물류 직접 사례가 아니다. “Stop talking. Start shipping.”이라는 카피가 검색에 걸린 오탐이며 JSL 디자인 레퍼런스에서 제외해야 한다.
- **실측:** H1 "Alliance No 2", sans-serif, 38px, weight 500 · 이미지 81 · 영상 1 · Canvas 0 · SVG 21 · 고정/Sticky 10 · 감지 기술 lenis.

### 45. Optimal Dynamics Website

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/optimal-dynamics-website) · [원본 사이트](https://www.optimaldynamics.com/)
- **핵심 분석:** 80px Poppins, 흰 배경, 8개 영상과 98개 SVG를 이용한 운송 의사결정 SaaS다. 제품 화면·성과·솔루션을 차례로 증명한다. JSL의 기능 소개와 실제 업무 효율 수치 배치에 매우 유용하다.
- **실측:** H1 Poppins, sans-serif, 80px, weight 700 · 이미지 47 · 영상 8 · Canvas 0 · SVG 98 · 고정/Sticky 2 · 감지 기술 webflow, react.

### 46. Chowdeck

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/chowdeck-1) · [원본 사이트](https://chowdeck.com/)
- **핵심 분석:** 직접 물류 사례다. Chowdeck Technologies is a logistics company in Lagos, Nigeria providing quality and dependable consumer services and swift delivery to a network of customers,... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Chowdeck Technologies is a logistics company in Lagos, Nigeria providing quality and dependable consumer services and swift delivery to a network of customers,...

### 47. Biocycle

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/biocycle) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 48. ArtQuality Chenue do Brasil

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/artquality-chenue-do-brasil) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 49. Maersk Disconnected

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/maersk-connected) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 50. The Mind of Movement

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/the-mind-of-movement) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 51. Dajemyslowo.com

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/dajemyslowo-com) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 52. Maersk Upside

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/maersk-upside) · [원본 사이트](https://www.maersk.com/upside/)
- **핵심 분석:** 직접 물류 사례다. A campaign site for Maersk named "Welcome to the Upside". Logistics has a huge untapped potential for business growth in this decade. This message was... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** A campaign site for Maersk named "Welcome to the Upside". Logistics has a huge untapped potential for business growth in this decade. This message was...

### 53. Nash

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/nash) · [원본 사이트](https://www.usenash.com/)
- **핵심 분석:** 직접 물류 사례다. The most reliable way to organize and manage delivery. Capture all your last-mile delivery tech, logistics, and operations with Nash, and offer a rewarding... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** The most reliable way to organize and manage delivery. Capture all your last-mile delivery tech, logistics, and operations with Nash, and offer a rewarding...

### 54. LogIndustria

- **분류:** 인접 산업/플랫폼
- **자료:** [Awwwards](https://www.awwwards.com/sites/logindustria) · [원본 사이트](https://logindustria.com/ru/)
- **핵심 분석:** 인접 산업/플랫폼 사례다. This is a corporate website for a logistic company. We tried to make it entertaining yet informative. Is solves all the usual purposes and has some eye... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** This is a corporate website for a logistic company. We tried to make it entertaining yet informative. Is solves all the usual purposes and has some eye...

### 55. Siemens Mobility

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/siemens-mobility) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 56. Baldor

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/baldor) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 57. Logistics Labs

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/logistics-labs) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 58. Deliverer

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/deliverer) · [원본 사이트](https://deliverer-wcopilot.webflow.io/)
- **핵심 분석:** 직접 물류 사례다. Discover a comprehensive Transportation, Cargo, and Logistics Website Template designed for a sleek and professional online presence. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Discover a comprehensive Transportation, Cargo, and Logistics Website Template designed for a sleek and professional online presence.

### 59. Cargoful

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/cargoful) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 60. Logi 128

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/logi-128) · [원본 사이트](https://logi-128.webflow.io/)
- **핵심 분석:** 직접 물류 사례다. The Logi 128 Transport Website Template is perfect for transportation companies, logistics businesses, and other similar websites, it helps to reflect... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** The Logi 128 Transport Website Template is perfect for transportation companies, logistics businesses, and other similar websites, it helps to reflect...

### 61. Log'in by Daher

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/login-by-daher-1) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 62. Freight Consolidators

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/freight-consolidators) · [원본 사이트](https://freightconsol.com/)
- **핵심 분석:** 직접 물류 사례다. Freight Consolidators provides global shipping, logistics and supply-chain solutions to keep your business moving across the world. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Freight Consolidators provides global shipping, logistics and supply-chain solutions to keep your business moving across the world.

### 63. Success Formula

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/success-formula) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 64. Ship Wizard

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/ship-wizard) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 65. Transmetrics.ai

- **분류:** 인접 산업/플랫폼
- **자료:** [Awwwards](https://www.awwwards.com/sites/transmetrics-ai) · 원본 링크 없음/종료
- **핵심 분석:** 인접 산업/플랫폼 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 66. Giga Cloud Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/giga-cloud-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 67. Fendale Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/fendale-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 68. Veryable Business Portal

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/veryable-business-portal) · [원본 사이트](https://portal.veryableops.com/)
- **핵심 분석:** 직접 물류 사례다. Veryable is the on-demand marketplace for mfg, logistics and warehousing labor. Our flexible labor solution connects businesses with high-quality workers... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Veryable is the on-demand marketplace for mfg, logistics and warehousing labor. Our flexible labor solution connects businesses with high-quality workers...

### 69. ByTorp.com

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/bytorp-com) · [원본 사이트](https://www.bytorp.com/en/)
- **핵심 분석:** 직접 물류 사례다. ByTorp provides logistics in a slightly different manner. Differently — and better! In ByTorp, We deliver anything, anywhere, on time and in proper condition. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** ByTorp provides logistics in a slightly different manner. Differently — and better! In ByTorp, We deliver anything, anywhere, on time and in proper condition.

### 70. Greenleaf Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/greenleaf-logistics) · [원본 사이트](http://greenleaflogistics.com/)
- **핵심 분석:** 직접 물류 사례다. Web design and brand messaging project for high end logistics company. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Web design and brand messaging project for high end logistics company.

### 71. Xample Logistics - Palletways

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/xample-logistics-palletways) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 72. Holt Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/holt-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 73. IMPACT - plan it play it

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/impact-plan-it-play-it) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 74. Blume Global Corporate Website

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/blume-global) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 75. TOKEMA

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/tokema) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 76. W2C Customs Trade Management

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/w2c-customs-trade-management) · [원본 사이트](https://w2c.ca/en/)
- **핵심 분석:** 직접 물류 사례다. W2C offers Canadian and American customs brokerage, customs consultancy, logistical transport support as well as customs training. The website allows... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** W2C offers Canadian and American customs brokerage, customs consultancy, logistical transport support as well as customs training. The website allows...

### 77. EFL

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/efl) · [원본 사이트](http://www.expofreight.com)
- **핵심 분석:** 직접 물류 사례다. EFL is a logistics solutions provider based in the subcontinent. Most websites in this industry always carry images of ships and planes and imply transport... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** EFL is a logistics solutions provider based in the subcontinent. Most websites in this industry always carry images of ships and planes and imply transport...

### 78. Eagle - Logistics, Cargo & Transportation WordPress Theme

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/eagle-logistics-cargo-transportation-wordpress-theme) · [원본 사이트](http://preview.themeforest.net/item/eagle-logistics-cargo-transportation-wordpress-theme/full_screen_preview/16914029?_ga=1.115327623.1408589210.1471516186)
- **핵심 분석:** 직접 물류 사례다. Want to create and incredible Logistics/Warehouse/Transportation theme? Sick of testing and evaluating themes? Choose the ONE completely versatile theme... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Want to create and incredible Logistics/Warehouse/Transportation theme? Sick of testing and evaluating themes? Choose the ONE completely versatile theme...

### 79. Stratim

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/stratim) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 80. CB Fashion

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/cb-fashion) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 81. TruckPress - Warehouse, Logistics & Transportation WP Theme

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/truckpress-warehouse-logistics-transportation-wp-theme) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 82. Triple M

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/triple-m) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 83. Trucking - Transportation & Logistics

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/trucking-transportation-logistics) · 원본 링크 없음/종료
- **핵심 분석:** 직접 물류 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 84. Deliver Analytics

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/deliver-analytics) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 85. CargoPress - WordPress Theme

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/cargopress-wordpress-theme) · [원본 사이트](https://www.proteusthemes.com/themes/?theme=cargopress-wp)
- **핵심 분석:** 직접 물류 사례다. CargoPress is the best premium WordPress theme for transportation, trucking freight, and logistics businesses. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** CargoPress is the best premium WordPress theme for transportation, trucking freight, and logistics businesses.

### 86. Event Lab

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/event-lab) · [원본 사이트](http://www.eventlab.net)
- **핵심 분석:** 직접 물류 사례다. Creating award-winning, unforgettable moments for clients around the world. From initial idea to full execution — design, décor, floral, logistics, cuisine,... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Creating award-winning, unforgettable moments for clients around the world. From initial idea to full execution — design, décor, floral, logistics, cuisine,...

### 87. HEIPEX.com

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/heipex-com) · [원본 사이트](http://heipex.com)
- **핵심 분석:** 직접 물류 사례다. The most advanced transport and logistic exchange in the world. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** The most advanced transport and logistic exchange in the world.

### 88. Baraclit S.p.A.

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/baraclit-s-p-a) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 89. European Gateway Services

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/european-gateway-services) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 90. Linc Group

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/linc-group) · 원본 링크 없음/종료
- **핵심 분석:** 검색 오탐·간접 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 91. Turnkey Ecommerce

- **분류:** 인접 산업/플랫폼
- **자료:** [Awwwards](https://www.awwwards.com/sites/turnkey-ecommerce) · 원본 링크 없음/종료
- **핵심 분석:** 인접 산업/플랫폼 항목이다. Awwwards에 대표 화면은 남아 있지만 설명과 라이브 링크가 없어 모션·반응형 동작을 현재 기준으로 확정할 수 없다.

### 92. Llibres.cat - Catalonian online library

- **분류:** 검색 오탐·간접
- **자료:** [Awwwards](https://www.awwwards.com/sites/llibres-cat-catalonian-online-library) · [원본 사이트](http://www.llibres.cat/)
- **핵심 분석:** 검색 오탐·간접 사례다. Cleverly designed, Catalonian online library and editorial reference site. Presents a wide variety of editorial content in a smart, user oriented way,... 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Cleverly designed, Catalonian online library and editorial reference site. Presents a wide variety of editorial content in a smart, user oriented way,...

### 93. Magellan Trans

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/magellan-trans) · [원본 사이트](http://www.magellantrans.ru/en/)
- **핵심 분석:** 직접 물류 사례다. Transportation and Logistics 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** Transportation and Logistics

### 94. LiXUS CORPORATION

- **분류:** 직접 물류
- **자료:** [Awwwards](https://www.awwwards.com/sites/lixus-corporation) · [원본 사이트](http://www.lixus.co.jp/)
- **핵심 분석:** 직접 물류 사례다. A website of a logistics company.A track navigates the page and the contents are displayed on the page interactively with scrolling. 대표 화면의 구성과 Awwwards 설명은 확인했지만, 최신 30개 정밀 렌더링 대상 밖이므로 세부 모션 판단은 보존 자료 범위로 제한한다.
- **Awwwards 설명:** A website of a logistics company.A track navigates the page and the contents are displayed on the page interactively with scrolling.

## JSL에 적용할 때의 구체적 원칙

- 장비 장면은 단일 3D 리그 또는 사전 렌더 프레임 시퀀스로 만든다. 사진 레이어의 크기·투명도 보간으로 회전을 흉내 내지 않는다.
- 각 장면은 “상태 입력 → 시스템 판단 → 물리적 이동 → 증빙 생성”의 네 단계로 연결한다.
- 히어로는 하나의 강한 문장과 하나의 살아 있는 오브젝트만 둔다. 기능 카드는 첫 화면에 겹치지 않는다.
- 색은 JSL 네이비를 공간·정보의 기반으로, 오렌지를 화물·경고·진행 상태에만 제한한다.
- 공개 랜딩은 900×900, 1280×800, 1440×900, 모바일에서 전체 스크롤 영상을 검수한 뒤 승인한다.