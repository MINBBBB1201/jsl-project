# JSL Logistics — 프로젝트 베이스

인턴십용으로 준비한 풀스택 프로젝트 스캐폴드입니다. Claude Code로 이어서 다듬는 걸 전제로, 구조와 의존성 설치까지 검증해뒀습니다.

## 구성

```
jsl-project/
├── frontend/   Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
│               (shadcnstore/shadcn-dashboard-landing-template 기반)
└── backend/    Node.js + Express + MongoDB (Mongoose)
                (Anuj-er/cargo-tracker-backend 기반)
```

### frontend에서 정리한 것
원본 템플릿의 데모용 페이지(mail, tasks, calendar, pricing, users, faqs, dashboard-2, 로그인/회원가입 변형 2·3번)는 삭제했습니다. 남긴 것:
- `src/app/landing` — 대외용 마케팅 페이지 (히어로/소개/서비스/통계/FAQ/문의폼 섹션 포함, JSL 콘텐츠로 교체 예정)
- `src/app/(dashboard)/dashboard` — 내부 운영 대시보드 셸 (AI 챗봇/화물추적/검수 도구를 여기에 얹으면 됨)
- `src/app/(dashboard)/chat` — 채팅 UI 틀 (사내 RAG 챗봇으로 재활용 가능)
- `src/app/(dashboard)/settings`, `(auth)/*` — 계정/인증 페이지

`framer-motion`, `gsap`는 package.json에 이미 추가해뒀습니다.

### backend
`cargo-tracker-backend`의 shipment 추적 모델(위치/경로/ETA/이력)이 이미 잡혀있습니다. `src/models`, `src/routes`, `src/controllers`를 확장해서 문의폼 제출, 챗봇 로그, 화물조회 API 등을 추가하면 됩니다.

## 실행 방법

```bash
# frontend
cd frontend
npm install
npm run dev      # http://localhost:3000

# backend
cd backend
npm install
cp env.example .env   # MONGO_URI 등 채우기
npm run dev       # http://localhost:5000
```

## 알아둘 점

- **node_modules는 포함하지 않았습니다.** 각 폴더에서 `npm install`을 먼저 실행하세요.
- **frontend TypeScript 체크는 통과합니다** (`npx tsc --noEmit`), 다만 템플릿 자체의 `src/components/ui/chart.tsx`(recharts 래퍼)에서 타입 버전 불일치로 인한 경고가 8개 남아있습니다. 개발에는 영향 없고, 나중에 recharts 버전을 맞추면 해결됩니다.
- **이 환경(샌드박스)에서는 `next build` 프로덕션 빌드가 메모리 부족(Bus error)으로 실패했습니다.** 로컬 개발 환경에서는 문제없이 빌드될 가능성이 높습니다 — 리소스 제약 없는 로컬/Claude Code 환경에서 다시 시도해보세요.

## 다음 단계 (디자인 고도화)

앞서 논의한 트렌디 리소스들을 이 순서로 적용하면 좋습니다.

1. **콘텐츠 교체**: `src/app/landing/components/*`를 JSL 실제 정보(서비스, 연락처)로 교체
2. **히어로 임팩트**: Spline로 3D 지구본/항로 비주얼 제작 → 히어로 섹션에 삽입, GSAP로 스크롤 트리거 애니메이션 추가
3. **프리미엄 블록**: Aceternity UI / Magic UI / Cult UI / Un-common Components에서 스포트라이트 카드, 마퀴, bento 그리드 등을 골라 서비스/통계 섹션에 적용
4. **아이콘/일러스트**: 지금 emoji 아이콘을 Shapefest(3D 일러스트) 또는 Craftwork 아이콘으로 교체
5. **타이포그래피**: Fontshare에서 헤드라인용 폰트 선정, `layout.tsx`의 폰트 설정 교체
6. **배경 디테일**: Pattern Monster로 섹션 배경에 은은한 항로/그리드 패턴 추가
7. **차트**: 내부 대시보드의 화물추적/수요예측 차트는 Bklit UI 컴포넌트로 교체 검토
8. **백엔드 연동**: 문의폼 → backend `/api/contact`(신규 추가 필요), AI 챗봇 → RAG 파이프라인, 화물조회 → 기존 `/api/shipments` 활용
