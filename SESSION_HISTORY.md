# JSL LOGISTICS — 프로젝트 세션 기록

이 파일은 Cowork(클라우드 Claude) 세션에서 여러 차례에 걸쳐 진행된 JSL LOGISTICS 인턴 프로젝트 작업 기록입니다. 로컬 Claude Code가 이 프로젝트를 이어서 작업할 때 맥락 파악용으로 참고하세요.

## 작업 방식 (중요 — 반드시 숙지)

이 프로젝트는 다음 방식으로 진행돼 왔습니다:

- **Cowork(클라우드) 세션**은 저장소에 직접 쓰기 접근 권한이 없고, 읽기 전용(파일 열람·스크린샷·git log 확인)으로만 코드베이스를 조사합니다. 실제 코드 작업은 **로컬 Claude Code CLI**가 수행합니다.
- Cowork는 markdown 프롬프트 파일을 작성하고, 사용자가 이를 로컬 Claude Code에 붙여넣어 실행한 뒤, 완료 리포트를 Cowork에 다시 붙여넣어 검토받는 흐름입니다.
- 이 문서 하나로도 로컬 Claude Code가 프로젝트 맥락(왜 이런 구조를 택했는지, 무엇을 이미 했는지)을 파악할 수 있도록 작성했습니다.

### 이 프로젝트에서 지켜온 표준 원칙

1. 의미 있는 작업을 지시하기 전에 항상 설명하고 확인을 받는다.
2. 진행 전에 항상 단점/대안(비용, 리스크, 범위 확장)을 먼저 짚는다.
3. **디자인 관련 작업은 절대 추상적인 텍스트 설명만으로 프롬프트를 쓰지 않는다** — 순서: 실제 레퍼런스 조사 → 비교 목업 제작(실제 라이브러리로 동작하는 인터랙티브 프리뷰 또는 실제 문서 스크린샷) → 사용자의 명시적 확인 → 그 다음에야 구현 프롬프트 작성.
4. 시크릿/자격증명은 직접 다루지 않는다.
5. 미적 목표: "AI가 만든 티가 안 나는" + 전문적인 톤. Modern Corporate / Industrial Minimalism / Swiss International Style / Tech-Driven. Kuehne+Nagel, DSV를 벤치마크로 삼는다.

### 반복적으로 쓰인 실무 패턴

- **브랜치 전략**: `feature/<slug>` 브랜치 → 여러 단계(Phase)로 나눠 진행 → 각 단계 완료 후 리포트 검토 → 전부 끝나면 PR 준비 프롬프트 → PR 본문 작성 → **Windows PowerShell 클립보드 인코딩**: `Get-Content -Raw -Encoding UTF8 <path> | Set-Clipboard` (반드시 이 방식 — `type file | clip`은 한글이 깨짐) → GitHub compare URL로 수동 PR 생성(`gh` CLI 미설치) → 브라우저로 직접 열어 렌더링 검증.
- **큰 기능은 항상 단계(Phase)로 쪼갠다** — 한 번에 다 만들지 않는다. 각 단계 완료 후 사용자가 실제 화면을 보고 다음 단계를 결정하게 한다.
- **작업 범위를 스스로 좁혀서 제안**하고, 사용자가 "네 판단대로 진행" 하면 그대로 진행한다.
- 완료 리포트에는 항상: 스크린샷(라이트/다크), 검증 결과표(tsc/lint/build/test), 지시와 다르게 판단한 부분과 그 근거, 알려진 한계를 요구한다.
- Claude Code가 스스로 발견한 버그나 범위 밖 판단(예: 시드 데이터 확장, 기존 버그 수정)은 "범위를 넘어선 판단"으로 따로 보고받고 사후 승인하는 방식으로 처리해왔다.

## 기술 스택

- 프론트엔드: Next.js 16(Turbopack) / TypeScript / Tailwind v4 / shadcn-ui / framer-motion, `next-intl` 4개 로케일(ko/en/zh/vi) 라우팅
- 백엔드: Express / MongoDB(Mongoose)
- 배포: Vercel(프론트), git push 시 프리뷰 자동 배포
- 저장소: `github.com/MINBBBB1201/jsl-project`

### 주요 관례/모듈

- **공개 도구 페이지 관례**: `[locale]/(public)/<slug>/page.tsx`(SSG) + `<slug>-client.tsx`("use client") + 필요시 `use-<slug>.ts` 훅. `PublicPageShell`로 감싸고, `middleware.ts`의 `LOCALIZED_SEGMENTS`에 새 슬러그를 반드시 추가해야 비영어 로케일에서 404가 안 남.
- **대시보드(내부, 인증 필요) 데이터 훅 관례**: `frontend/src/app/(dashboard)/dashboard/use-delay-summary.ts`의 `useAsyncResource<T>(fetcher, fallbackMessage)` 패턴 — 로딩/에러/재조회를 표준화. 이후 `use-async-resource.ts`로 공통 모듈 분리됨.
- **JSL 브랜드 색**: `frontend/src/app/globals.css`의 `--brand-navy-deep`, `--brand-orange-deep`, `--brand-slate` 등 oklch 토큰.
- **개인정보(PII) 최소제공 원칙**: "목적에 필요한 만큼만" — 목록(여러 건 한번에)에서는 고객 연락처를 빼고, 상세(담당자가 그 건을 처리하려는 화면)에서는 보여준다. `PII_EXCLUDED_FIELDS` 상수, `backend/src/controllers/shipment.controller.js` 참고.

## 지금까지 완료된 작업

### 1. 3D 커버리지 지구본 (PR #3, 병합됨)
랜딩 페이지 장식용 3D 지구본. COBE 라이브러리 사용.

### 2. 3D 컨테이너 적재 계산기 (PR #4, 병합됨) — `/container-planner`
실무 도구. 4단계로 진행:
- 엔진: `binpackingjs`를 조사했으나 지지면(support surface)/중력 개념이 없어 **커스텀 bin-packing 엔진을 직접 구현**(정수 mm 단위, CoG 계산, 무게중심 ±10% 톨러런스).
- 뷰어: react-three-fiber + drei, 좌표계 매핑(LoadPlan Z-up ↔ three.js Y-up, y축 부호 반전 필수).
- 폼: 화물 입력(CRUD), 결과 패널.
- 폴리시: 네비 노출(푸터 + 화주 메가메뉴), 모바일 터치 회전 버그 수정(`touch-action: pan-y`).
- 공유 모듈 `frontend/src/lib/brand-colors.ts`(oklch→RGB 변환, WebGL 감지)를 여기서 만들어 커버리지 지구본도 리팩터링해 같이 씀.

### 3. Groq 기반 RAG 챗봇 — 이미 완료된 상태로 발견됨 (Cowork가 만든 게 아님)
`backend/src/controllers/chat.controller.js` 등, `main`에 이미 병합돼 있던 걸 발견. Groq의 OpenAI 호환 엔드포인트 사용, MongoDB `$text` 검색 + 한국어 조사 제거 토크나이저, 샘플/플레이스홀더 문서 제외(`isSample` 플래그). 프론트는 `(dashboard)/chat/`. 폴리시 불필요 판단, 그대로 완료 처리.

### 4. 대시보드 실데이터화 (PR #5, #6, 병합됨) — `/dashboard`
shadcn 어드민 데모 템플릿의 가짜 데이터를 실제 화물(Shipment) 데이터로 교체:
- **PR #5 (1+2단계 통합)**: KPI 카드 3개(처리 건수/온타임 배송률/활성 건수) + 트렌드 차트를 실데이터로. 온타임 배송률의 "완료 시각"은 `history` 배열의 가장 최근 `delivered` 전환 시각(되돌린 이력 대응), 없으면 `updatedAt` 폴백 — `utils/delivery-completion.js`. 메인 테이블(연방계약 데모 템플릿 원본, 4탭+드래그정렬)을 완전히 걷어내고 실제 배송 목록(`shipment-table.tsx`, 서버사이드 필터/정렬/페이지네이션, 기존 `GET /api/shipments` 재사용, 백엔드 변경 없음)으로 교체. `@dnd-kit/*`, `@tanstack/react-table` 의존성 제거.
- **PR #6 (상세 Drawer)**: 배송 목록에서 운송장번호 클릭 시 상세 패널. `getShipmentByTrackingNumber`(인증된 내부 엔드포인트)가 `customer` 필드를 부당하게 제외하고 있던 걸 발견해 수정(목록은 여전히 제외 — PII 최소제공 원칙 유지, 상세만 포함). `withFreshRisk` 누락 버그도 같이 수정.
- 알려진 후속 과제: 목록/상세 간 PII 노출 경계를 지켜줄 자동 테스트 없음(컨트롤러 테스트 하네스 자체가 백엔드에 없음). 백엔드 `npm run lint`는 ESLint 8인데 설정 파일이 없어 실행 불가(이 프로젝트 이전부터 있던 상태).

## 진행 중 — 무역서류 생성기(상업송장 / 포장명세서)

새 백로그 항목. 실제 DHL·eForms·Drip Capital(UN Layout Key 기준) 템플릿을 조사해 상업송장/포장명세서의 실제 구조(레터헤드+메타데이터 → 2단 Shipper/Consignee 블록 → 배송조건 스트립 → 품목 테이블 → 합계+서명)를 확인하고, 그 구조로 목업(상업송장 스크린샷)을 만들어 승인받았습니다.

**2단계로 분리하기로 함**:
- **1단계 (공개 preview)** — `/document-generator`. 로그인 불필요, 실제 화물 DB와 무관, 순수 클라이언트 사이드(백엔드 변경 없음). 방문자가 직접 입력해서 PDF 생성. PDF 라이브러리는 `@react-pdf/renderer` 유력 후보(클라이언트 사이드 생성, 한글 폰트 임베딩 검증 필요) — **프롬프트는 이미 작성해서 전달함, 로컬 Claude Code에서 실행 여부는 이 문서 작성 시점 기준 미확인**. 실행했다면 브랜치명은 `feature/document-generator`.
- **2단계 (내부 연동, 아직 시작 안 함)** — `/dashboard` 안, 로그인 필요. 실제 화물 기록을 골라 추적번호/고객/출발도착이 자동으로 채워지고, 단가·HS코드·통화 같은 무역서류 전용 필드만 추가 입력. 새 데이터 모델(화물과 연결된 별도 컬렉션 — `Shipment.items`에는 가격/HS코드가 없어서 스키마 확장 또는 별도 컬렉션 필요, 아직 설계 확정 안 됨) 필요.

## 남은 백로그

- 공지사항(Notices) 페이지 — 작고 빠른 작업, 기존 푸터 TODO를 닫는 정도 규모.
- 무역서류 생성기 2단계(내부 연동).
- PII 경계 자동 테스트(백엔드 컨트롤러 테스트 하네스 자체를 먼저 만들어야 함).
- 백엔드 ESLint 설정 추가(현재 설정 파일 자체가 없어 lint가 안 돌아감).

## PR 이력

| PR | 내용 | 상태 |
|---|---|---|
| #3 | 3D 커버리지 지구본 | 병합됨 |
| #4 | 3D 컨테이너 적재 계산기 | 병합됨 |
| #5 | 대시보드 KPI/차트/메인테이블 실데이터화 | 병합됨 |
| #6 | 배송 상세보기 Drawer | 병합됨 |
