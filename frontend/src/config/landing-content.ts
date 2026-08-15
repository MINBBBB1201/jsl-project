/**
 * 랜딩 페이지 문구
 *
 * 출처: JSL LOGISTICS 회사소개서 (박재석 대표 제공)
 *
 * 아직 확정되지 않아 placeholder로 남아 있는 항목:
 *   - company.contact.address : 본사 도로명 주소 미확정
 *   - company.contact.phone   : 대표 전화번호 미확정
 *   - plans                   : 실제 요금 정책 미확정 (기존 임시 문구 유지)
 *   - faq                     : 실제 운영 정책 기준 재작성 필요 (기존 임시 문구 유지)
 *   - services.valueAdded     : 소개서에 없는 항목이라 미검증 (아래 주석 참고)
 *
 * 아직 콘텐츠가 없어 랜딩 페이지에서 제외된 섹션 (landing-page-content.tsx 참고):
 *   - LogoCarousel        : 고객사 실명 공개 여부 컨펌 후 노출
 *   - TestimonialsSection : 실제 고객 후기 확보 후 노출
 *   - BlogSection         : 실제 게시글 확보 후 노출
 */

import {
  BadgeCheck,
  Boxes,
  Building2,
  ClipboardCheck,
  Container,
  Factory,
  FileCheck2,
  Globe2,
  Handshake,
  Layers,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  PlaneTakeoff,
  Radar,
  Route,
  ShoppingCart,
  Ship,
  TrainFront,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react"

/** 회사 기본 정보 */
export const company = {
  name: "JSL Logistics",
  legalName: "JSL LOGISTICS CO., LTD",
  legalNameKo: "제이에스엘 로지스틱스",
  founded: 2023,
  ceo: "박재석",
  ceoEn: "Park Jae-Seok",
  tagline: "항공 · 해상 · 육상 · 철도 · 특송 통합 물류 서비스",
  description:
    "서울 본사와 상해·위해·광주·하노이 4개 해외법인을 직접 운영하며, 5개 운송 모드를 아우르는 원스톱 물류 서비스를 제공합니다.",
  contact: {
    email: "hq@jsl-logis.com",
    // TODO: 대표 전화번호 확정 시 교체
    phone: "[대표번호 확정 예정]",
    // TODO: 본사 도로명 주소 확정 시 교체
    address: "서울특별시 [주소 확정 예정]",
    businessHours: "평일 09:00 - 18:00",
  },
}

/** 히어로 섹션 */
export const hero = {
  badge: "항공 · 해상 · 육상 · 철도 · 특송",
  headlineStart: "한국 · 중국 · 베트남을 잇는",
  headlineHighlight: "5+1 종합물류",
  headlineEnd: "파트너",
  subheadline:
    "2023년 설립 이후 서울·상해·위해·광주·하노이 5개 거점을 직접 운영하며, 5개 운송 모드와 물류 컨설팅을 하나의 창구에서 제공합니다.",
  primaryCta: { label: "견적 문의하기", href: "#contact" },
  secondaryCta: { label: "서비스 알아보기", href: "#features" },
}

/** 주요 지표 — 출처: 회사소개서 (2025 회계연도 기준) */
export const stats: {
  icon: LucideIcon
  value: string
  label: string
  description: string
}[] = [
  {
    icon: TrendingUp,
    value: "180억원",
    label: "연간 매출",
    description: "2025 회계연도 기준",
  },
  {
    icon: Globe2,
    value: "5개",
    label: "글로벌 거점",
    description: "서울 본사 + 해외법인 4개 직영",
  },
  {
    icon: Users,
    value: "30개사+",
    label: "고객사",
    description: "제조 · 이커머스 · 유통",
  },
  {
    icon: Handshake,
    value: "50개사+",
    label: "파트너사",
    description: "글로벌 협력 네트워크",
  },
]

/** 월간 처리 물동량 — 출처: 회사소개서 */
export const monthlyVolumes: {
  icon: LucideIcon
  mode: string
  value: string
  unit: string
}[] = [
  { icon: PlaneTakeoff, mode: "AIR", value: "200", unit: "톤 / 월" },
  { icon: Ship, mode: "SEA", value: "100", unit: "TEU / 월" },
  { icon: Truck, mode: "TRUCK", value: "350", unit: "대 / 월" },
]

export const volumesHeading = {
  title: "월간 처리 물동량",
  description: "항공·해상·육상 3개 모드 기준 월 평균 처리량입니다.",
}

/** 회사 소개 섹션 */
export const about = {
  badge: "회사 소개",
  title: "5개 운송 모드를 하나의 파트너로",
  description:
    "JSL LOGISTICS는 2023년 설립된 종합 물류 기업으로, 서울 본사를 중심으로 상해·위해·광주·하노이 4개 해외법인을 직접 운영하며 항공·해상·육상·철도·특송 5개 운송 모드를 아우르는 원스톱 물류 서비스를 제공합니다.",
  valuesTitle: "왜 JSL인가",
  values: [
    {
      icon: Layers,
      title: "5+1 풀라인업 종합물류",
      description:
        "항공·해상·육상·철도·특송 5개 운송 모드에 물류 컨설팅까지, 하나의 파트너로 해결합니다.",
    },
    {
      icon: Building2,
      title: "직접 운영하는 글로벌 거점",
      description:
        "한국·중국·베트남 현지법인을 직접 운영해 중간 대리점 없이 안정적인 서비스를 제공합니다.",
    },
    {
      icon: Factory,
      title: "글로벌 제조기업 운영 경험",
      description:
        "대기업 공급망 운영 노하우를 보유한 인력이 화주 관점에서 물류를 설계합니다.",
      /* TODO: 고객사 실명 공개 여부 컨펌 후 반영 */
    },
    {
      icon: LayoutDashboard,
      title: "자체 디지털 운영 플랫폼",
      description:
        "JSL-EXPRESS 등 자체 시스템으로 실시간 화물 가시성과 배송 상태 연동을 제공합니다.",
    },
  ],
  ctaText: "화물 종류와 노선에 맞는 운송 방안을 안내해 드립니다.",
  primaryCta: { label: "견적 문의하기", href: "#contact" },
  secondaryCta: { label: "서비스 보기", href: "#features" },
}

/** 서비스 섹션 — 5개 운송 모드 */
export const services = {
  badge: "서비스 안내",
  title: "5개 운송 모드 풀라인업",
  description:
    "납기와 비용 조건에 따라 항공·해상·육상·철도·특송을 조합해 최적의 경로를 설계합니다.",

  modes: [
    {
      icon: PlaneTakeoff,
      code: "AIR",
      title: "항공운송",
      summary: "전자제품·이커머스 화물에 특화된 항공 운송 서비스입니다.",
      highlights: [
        "화남 → 산동, 산동 → 인천(ICN) 주요 항로 운영",
        "인천 → 유럽 / LAX / ORD 등 장거리 노선 연계",
        "월 200톤 처리",
      ],
    },
    {
      icon: Ship,
      code: "SEA",
      title: "해상 · 해상-항공 복합운송",
      summary:
        "광동-상해 CFS 통합과 중국 내륙 트럭킹·페리를 연계한 해상 및 SEA-AIR 복합운송입니다.",
      highlights: [
        "광동-상해 CFS 통합 + 중국 내륙 트럭킹 + 페리 연계",
        "인천 환적을 통한 미국·유럽向 SEA-AIR 복합운송",
        "상해 CFS 입고부터 공항창고 입고까지 8단계 표준 프로세스",
        "월 100TEU 처리",
      ],
    },
    {
      icon: Truck,
      code: "TRUCK",
      title: "육상운송",
      summary:
        "중국 전역과 동남아 국경통과 트럭킹을 직접 운영합니다.",
      highlights: [
        "중국 전역 31개 성 FTL / LTL 대응, 월 300대",
        "베트남·태국向 국경통과 트럭킹 월 150대 직접 운영",
      ],
    },
    {
      icon: TrainFront,
      code: "RAIL",
      title: "철도운송",
      summary:
        "중국-유럽을 잇는 유라시아 철도와 Sea&Rail 복합운송을 제공합니다.",
      highlights: [
        "중국 → 유럽 / 러시아 / 중앙아시아 유라시아 철도",
        "시안 · 청두 · 충칭 등 중국 내륙 거점 연계",
        "인천 · 부산 연계 Sea&Rail 복합운송",
      ],
    },
    {
      icon: Zap,
      code: "EXPRESS",
      title: "특송",
      summary:
        "자체 구축 API 시스템으로 배송 상태를 실시간 연동하는 door-to-door 특송입니다.",
      highlights: [
        "한국 → 유럽 5~7일 door-to-door",
        "자체 시스템 'JSL-EXPRESS Logistics' API 실시간 연동",
        "Royal Mail · Deutsche Post · DHL · dpd 등 현지 라스트마일 파트너",
      ],
    },
  ],

  /**
   * 부가 서비스
   * TODO: 이 블록은 소개서에 없던 기존 임시 문구입니다.
   *       실제 취급 범위 확인 후 교체하거나 섹션에서 제외해야 합니다.
   */
  valueAdded: {
    title: "통관과 보관까지 한 번에",
    description:
      "관세사 협업을 통한 통관 대행과 물류센터 보관·재고 관리로 입고 이후 과정까지 지원합니다.",
    items: [
      {
        icon: FileCheck2,
        title: "통관 대행",
        description: "수출입 신고, 관세 산출, 요건 확인 등 통관 절차 대행.",
      },
      {
        icon: Warehouse,
        title: "창고 보관",
        description: "상온·정온 보관 및 항만 인근 보세창고 운영.",
      },
      {
        icon: Boxes,
        title: "재고 · 유통가공",
        description: "입출고 관리, 피킹·패킹, 라벨링 등 부가 작업 처리.",
      },
      {
        icon: ClipboardCheck,
        title: "화물 추적 · 리포트",
        description: "운송 현황 실시간 조회와 월간 물류 실적 리포트 제공.",
      },
    ],
    primaryCta: { label: "상담 신청", href: "#contact" },
    secondaryCta: { label: "요금 안내", href: "#pricing" },
  },
}

/** 물류 컨설팅 섹션 — 소개서상 신규(NEW) 서비스 라인 */
export const consulting = {
  badge: "NEW",
  title: "물류 컨설팅",
  description:
    "운송 대행을 넘어 공급망 구조와 해외 진출 전략까지 함께 설계합니다. 화주와 포워더 각각의 과제에 맞춘 컨설팅을 제공합니다.",
  groups: [
    {
      audience: "화주 (Client)",
      description: "공급망 구조를 진단하고 비용·리드타임을 다시 설계합니다.",
      items: [
        {
          icon: ClipboardCheck,
          title: "공급망 진단",
          description:
            "Supply Chain Diagnosis — 현재 물류 구조의 비용·리드타임 병목을 분석합니다.",
        },
        {
          icon: Route,
          title: "멀티모드 라우팅 설계",
          description:
            "항공·해상·육상·철도를 조합해 납기와 비용 조건에 맞는 경로를 설계합니다.",
        },
        {
          icon: Boxes,
          title: "물류파트너 최적화",
          description:
            "분산된 벤더를 통합해 관리 포인트와 단가 구조를 정리합니다.",
        },
        {
          icon: ShoppingCart,
          title: "이커머스 / FBA 물류 자문",
          description:
            "이커머스 물동 특성과 FBA 입고 요건에 맞춘 물류 운영을 자문합니다.",
        },
      ],
    },
    {
      audience: "포워더 (Forwarder)",
      description: "해외 진출 단계별로 현지 실행까지 동행합니다.",
      items: [
        {
          icon: Globe2,
          title: "해외진출 전략 자문",
          description:
            "진출 국가와 시장 진입 방식, 초기 운영 구조를 함께 설계합니다.",
        },
        {
          icon: Building2,
          title: "현지법인 설립 동행",
          description:
            "한국·중국·베트남 현지법인 운영 경험을 바탕으로 설립 전 과정을 지원합니다.",
        },
        {
          icon: Handshake,
          title: "파트너 매칭",
          description:
            "현지 검증된 협력사 네트워크를 연결해 초기 영업 기반을 확보합니다.",
        },
        {
          icon: BadgeCheck,
          title: "정부지원금 확보 지원",
          description:
            "해외진출 관련 정부지원 사업 발굴과 신청 절차를 지원합니다.",
        },
      ],
    },
  ],
  primaryCta: { label: "컨설팅 문의", href: "#contact" },
}

/** 글로벌 네트워크 섹션 — 5개 거점 / 총 20명 */
export const network = {
  badge: "글로벌 네트워크",
  title: "5개 거점을 직접 운영합니다",
  description:
    "서울 본사와 상해·위해·광주·하노이 4개 해외법인을 직영으로 운영합니다. 중간 대리점을 거치지 않아 현지 상황에 바로 대응할 수 있습니다.",
  totalHeadcount: 20,
  items: [
    {
      icon: MapPin,
      city: "서울",
      cityEn: "Seoul",
      role: "본사 (HQ)",
      headcount: 4,
      description: "전사 운영 총괄, 영업 및 견적, 한국発 항공·특송 운영.",
    },
    {
      icon: MapPin,
      city: "상해",
      cityEn: "Shanghai",
      role: "해외법인",
      headcount: 2,
      description: "CFS 통합 운영과 SEA / SEA-AIR 복합운송 거점.",
    },
    {
      icon: MapPin,
      city: "위해",
      cityEn: "Weihai",
      role: "해외법인",
      headcount: 3,
      description: "산동-인천 항로와 페리 연계 운송을 담당합니다.",
    },
    {
      icon: MapPin,
      city: "광주",
      cityEn: "Guangzhou",
      role: "해외법인",
      headcount: 5,
      description: "화남 지역 집하와 광동-상해 CFS 연계를 담당합니다.",
    },
    {
      icon: MapPin,
      city: "하노이",
      cityEn: "Hanoi",
      role: "해외법인",
      headcount: 6,
      description: "베트남 내륙 운송과 국경통과 트럭킹 운영 거점.",
    },
  ],
}

/**
 * 요금 안내 섹션
 * 물류 요금은 노선·중량·부피에 따라 달라지므로 고정 가격 대신 견적 문의로 안내합니다.
 * TODO: 실제 서비스 등급과 제공 범위 확정 시 교체 (현재 임시 문구)
 */
export const plans = {
  badge: "요금 안내",
  title: "화물 조건에 맞춰 견적을 산출합니다",
  description:
    "운송 구간, 화물 중량과 부피, 납기 조건에 따라 요금이 달라집니다. 아래 이용 형태를 참고해 문의해 주시면 상세 견적을 안내해 드립니다.",
  note: "노선과 물량에 따라 조건이 달라집니다.",
  noteCta: { label: "담당자에게 문의하기", href: "#contact" },
  items: [
    {
      name: "스팟 운송",
      description: "건별로 필요한 구간만 이용하는 단발성 운송",
      priceLabel: "건별 견적",
      priceCaption: "화물 조건에 따라 산출",
      features: [
        "항공 · 해상 · 육상 단일 구간 운송",
        "건별 견적 및 스케줄 안내",
        "기본 화물 추적 제공",
        "통관 대행 선택 이용",
      ],
      cta: "견적 문의",
      popular: false,
    },
    {
      name: "정기 계약",
      description: "정기적으로 발생하는 물량을 계약 단가로 운영",
      priceLabel: "월 정액 견적",
      priceCaption: "물량 기준 단가 협의",
      includesPrevious: "스팟 운송 제공 범위 포함",
      features: [
        "노선별 계약 단가 적용",
        "전담 담당자 배정",
        "정기 스케줄 사전 배정",
        "월간 물류 실적 리포트",
        "창고 보관 연계 이용",
      ],
      cta: "상담 신청",
      popular: true,
    },
    {
      name: "3PL 위탁",
      description: "보관부터 배송까지 물류 전 과정을 위탁 운영",
      priceLabel: "맞춤 견적",
      priceCaption: "운영 범위에 따라 협의",
      includesPrevious: "정기 계약 제공 범위 포함",
      features: [
        "물류센터 보관 및 재고 관리",
        "입출고 · 유통가공 대행",
        "주문 연동 출고 처리",
        "전용 운영 인력 배치",
        "맞춤 리포트 및 정산 지원",
      ],
      cta: "도입 문의",
      popular: false,
    },
  ],
}

/** FAQ — TODO: 실제 운영 정책 확정 후 답변 재작성 (현재 임시 문구) */
export const faq = {
  badge: "자주 묻는 질문",
  title: "자주 묻는 질문",
  description: "견적, 운송 기간, 통관 절차에 대해 자주 문의하시는 내용을 정리했습니다.",
  items: [
    {
      value: "item-1",
      question: "견적은 어떻게 요청하나요?",
      answer:
        "출발지와 도착지, 화물의 품목과 중량·부피, 희망 납기를 알려주시면 담당자가 확인 후 견적을 안내해 드립니다. 페이지 하단 문의 양식이나 대표 이메일로 접수하실 수 있습니다.",
    },
    {
      value: "item-2",
      question: "어떤 운송 모드를 이용할 수 있나요?",
      answer:
        "항공, 해상(SEA / SEA-AIR 복합운송), 육상, 철도, 특송 5개 모드를 모두 운영합니다. 납기와 비용 조건을 알려주시면 단일 모드 또는 복합운송으로 최적 경로를 설계해 드립니다.",
    },
    {
      value: "item-3",
      question: "중국·베트남 현지 운송도 가능한가요?",
      answer:
        "가능합니다. 상해·위해·광주·하노이 현지법인을 직접 운영하고 있어 중국 전역 31개 성 FTL/LTL과 베트남·태국向 국경통과 트럭킹을 직접 처리합니다.",
    },
    {
      value: "item-4",
      question: "운송 기간은 얼마나 걸리나요?",
      answer:
        "운송 수단과 노선에 따라 다릅니다. 특송은 한국에서 유럽까지 5~7일 door-to-door, 항공은 통상 수일, 해상은 노선에 따라 수 주가 소요되며 통관 시간이 추가될 수 있습니다.",
    },
    {
      value: "item-5",
      question: "화물 위치는 어떻게 확인하나요?",
      answer:
        "자체 구축한 JSL-EXPRESS 시스템의 API 연동으로 배송 상태를 실시간 확인하실 수 있으며, 정기 계약 고객사는 대시보드에서 진행 중인 건을 직접 조회하실 수 있습니다.",
    },
    {
      value: "item-6",
      question: "물류 컨설팅은 어떤 내용인가요?",
      answer:
        "화주에게는 공급망 진단, 멀티모드 라우팅 설계, 물류파트너 최적화, 이커머스·FBA 자문을 제공합니다. 포워더에게는 해외진출 전략 자문, 현지법인 설립 동행, 파트너 매칭, 정부지원금 확보를 지원합니다.",
    },
  ],
  contactPrompt: "찾으시는 답변이 없다면 언제든 문의해 주세요.",
  contactCta: { label: "문의하기", href: "#contact" },
}

/** 하단 CTA 섹션 */
export const cta = {
  badge: "물류 상담",
  highlights: ["항공 · 해상 · 육상 · 철도 · 특송", "물류 컨설팅", "현지법인 직영"],
  headlineStart: "복잡한 국제물류,",
  headlineHighlight: "한 곳에서",
  headlineEnd: "해결하세요",
  description:
    "노선과 화물 조건만 알려주시면 담당자가 최적의 운송 방안과 예상 비용을 정리해 드립니다.",
  primaryCta: { label: "견적 문의하기", href: "#contact" },
  secondaryCta: { label: "서비스 알아보기", href: "#features" },
  trustIndicators: ["5개 거점 직영 운영", "5+1 풀라인업", "실시간 화물 가시성"],
}

/** 문의 섹션 */
export const contact = {
  badge: "문의하기",
  title: "화물 운송이 필요하신가요?",
  description:
    "노선과 화물 정보를 남겨주시면 담당자가 확인 후 견적과 스케줄을 안내해 드립니다.",
  channels: [
    {
      icon: Package,
      title: "견적 문의",
      description:
        "출발지·도착지와 화물 정보를 알려주시면 운송 방안과 예상 비용을 안내해 드립니다.",
    },
    {
      icon: MapPin,
      title: "화물 추적",
      description:
        "진행 중인 건의 운송 현황이 궁금하시면 예약 번호와 함께 문의해 주세요.",
    },
    {
      icon: Mail,
      title: "이메일 문의",
      description: `${company.contact.email} · ${company.contact.businessHours}`,
    },
  ],
  formTitle: "문의 남기기",
  formPlaceholders: {
    company: "(주)예시상사",
    name: "홍길동",
    email: "name@example.com",
    subject: "인천 → 유럽 특송 견적 문의",
    message:
      "화물 품목, 중량·부피, 출발지와 도착지, 희망 납기를 함께 적어주시면 더 빠르게 안내해 드립니다.",
  },
  submitLabel: "문의 보내기",
}

/** 푸터 */
export const footer = {
  description:
    "2023년 설립된 종합 물류 기업으로, 서울·상해·위해·광주·하노이 5개 거점을 직접 운영하며 항공·해상·육상·철도·특송과 물류 컨설팅을 제공합니다.",
  newsletter: {
    title: "물류 소식 받아보기",
    description: "운임 동향과 노선 공지를 이메일로 보내드립니다.",
    placeholder: "이메일 주소를 입력하세요",
    submitLabel: "구독하기",
  },
  links: {
    서비스: [
      { name: "항공운송", href: "#features" },
      { name: "해상 · 복합운송", href: "#features" },
      { name: "육상운송", href: "#features" },
      { name: "철도운송", href: "#features" },
      { name: "특송", href: "#features" },
    ],
    회사: [
      { name: "회사 소개", href: "#about" },
      { name: "물류 컨설팅", href: "#consulting" },
      { name: "글로벌 네트워크", href: "#network" },
      { name: "문의하기", href: "#contact" },
    ],
    // TODO: 실제 페이지 준비되면 링크 연결
    고객지원: [
      { name: "자주 묻는 질문", href: "#faq" },
      { name: "화물 추적", href: "#contact" },
      { name: "견적 요청", href: "#contact" },
      { name: "공지사항", href: "#" },
    ],
    약관: [
      { name: "이용약관", href: "#" },
      { name: "개인정보처리방침", href: "#" },
    ],
  },
}

/** 네비게이션 */
export const navigation = {
  items: [
    { name: "홈", href: "#hero" },
    { name: "회사 소개", href: "#about" },
    { name: "서비스", href: "#features", hasMegaMenu: true },
    { name: "물류 컨설팅", href: "#consulting" },
    { name: "글로벌 네트워크", href: "#network" },
    { name: "FAQ", href: "#faq" },
    { name: "문의", href: "#contact" },
  ],
  megaMenu: [
    {
      title: "운송 서비스",
      items: [
        {
          title: "항공운송",
          description: "전자제품·이커머스 특화, 월 200톤",
          icon: PlaneTakeoff,
          href: "#features",
        },
        {
          title: "해상 · 복합운송",
          description: "SEA / SEA-AIR, 월 100TEU",
          icon: Ship,
          href: "#features",
        },
        {
          title: "육상운송",
          description: "중국 31개 성 · 국경통과 트럭킹",
          icon: Truck,
          href: "#features",
        },
        {
          title: "철도운송",
          description: "유라시아 철도 · Sea&Rail",
          icon: TrainFront,
          href: "#features",
        },
        {
          title: "특송",
          description: "한국→유럽 5~7일 door-to-door",
          icon: Zap,
          href: "#features",
        },
      ],
    },
    {
      title: "물류 컨설팅",
      items: [
        {
          title: "공급망 진단",
          description: "비용·리드타임 병목 분석",
          icon: ClipboardCheck,
          href: "#consulting",
        },
        {
          title: "멀티모드 라우팅 설계",
          description: "조건에 맞는 경로 설계",
          icon: Route,
          href: "#consulting",
        },
        {
          title: "해외진출 전략 자문",
          description: "포워더 해외 진출 동행",
          icon: Globe2,
          href: "#consulting",
        },
        {
          title: "현지법인 설립 동행",
          description: "설립 전 과정 지원",
          icon: Building2,
          href: "#consulting",
        },
      ],
    },
    {
      title: "회사 · 고객 지원",
      items: [
        {
          title: "글로벌 네트워크",
          description: "5개 거점 직영 운영",
          icon: Globe2,
          href: "#network",
        },
        {
          title: "화물 추적",
          description: "진행 중인 운송 현황 조회",
          icon: Radar,
          href: "#contact",
        },
        {
          title: "자주 묻는 질문",
          description: "운송 모드, 기간, 컨설팅 안내",
          icon: BadgeCheck,
          href: "#faq",
        },
        {
          title: "견적 요청",
          description: "노선별 운임 견적 안내",
          icon: Container,
          href: "#contact",
        },
      ],
    },
  ],
}
