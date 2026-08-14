/**
 * 랜딩 페이지 문구 (임시 플레이스홀더)
 *
 * ⚠️ 이 파일의 모든 내용은 실제 회사 정보가 확정되기 전까지 사용하는 임시 문구입니다.
 *    실제 정보를 받으면 이 파일만 수정하면 되고, 컴포넌트는 건드릴 필요 없습니다.
 *
 * 실제 정보 확정 시 반드시 교체해야 하는 항목:
 *   - company.contact  : 이메일 / 전화 / 주소 (현재 전부 임시값)
 *   - stats            : 물동량, 노선 수, 온타임 배송률 등 모든 수치 (현재 전부 임시값)
 *   - services         : 실제 취급 품목·노선에 맞게 조정
 *   - plans            : 실제 서비스 등급 및 견적 정책
 *   - faq              : 실제 운영 정책 기준으로 답변 재작성
 *
 * 아직 콘텐츠가 없어 랜딩 페이지에서 제외된 섹션 (landing-page-content.tsx 참고):
 *   - LogoCarousel      : 실제 파트너사/고객사 로고 확보 후 노출
 *   - TestimonialsSection : 실제 고객 후기 확보 후 노출
 *   - BlogSection       : 실제 게시글 확보 후 노출
 */

import {
  Anchor,
  BadgeCheck,
  Boxes,
  Building2,
  ClipboardCheck,
  Clock,
  Container,
  FileCheck2,
  Globe2,
  Headset,
  MapPin,
  Package,
  PlaneTakeoff,
  Radar,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

/** 회사 기본 정보 — TODO: 실제 정보로 교체 */
export const company = {
  name: "JSL Logistics",
  tagline: "해상 · 항공 · 육상 통합 물류 서비스",
  description:
    "화물 집하부터 통관, 창고 보관, 최종 배송까지 하나의 창구에서 처리하는 종합 물류 파트너입니다.",
  contact: {
    // TODO: 실제 연락처로 교체
    email: "contact@example.com",
    phone: "02-0000-0000",
    address: "서울특별시 (주소 미정)",
    businessHours: "평일 09:00 - 18:00",
  },
}

/** 히어로 섹션 */
export const hero = {
  badge: "해상 · 항공 · 육상 통합 물류",
  headlineStart: "전 세계 어디든,",
  headlineHighlight: "안전하고 정확하게",
  headlineEnd: "화물을 운송합니다",
  subheadline:
    "수출입 화물의 집하, 운송, 통관, 보관까지 전 과정을 한 곳에서 관리합니다. 실시간 화물 추적과 전담 담당자 배정으로 예측 가능한 물류를 제공합니다.",
  primaryCta: { label: "견적 문의하기", href: "#contact" },
  secondaryCta: { label: "서비스 알아보기", href: "#features" },
}

/** 주요 지표 — TODO: 실제 수치로 교체 (현재 전부 임시값) */
export const stats: {
  icon: LucideIcon
  value: string
  label: string
  description: string
}[] = [
  {
    icon: Container,
    value: "120,000+",
    label: "연간 처리 물동량",
    description: "해상·항공 화물 누적 기준",
  },
  {
    icon: Globe2,
    value: "40+",
    label: "취급 국가",
    description: "글로벌 파트너 네트워크",
  },
  {
    icon: Clock,
    value: "98%",
    label: "온타임 배송률",
    description: "약속 기일 내 인도 비율",
  },
  {
    icon: Users,
    value: "1,500+",
    label: "거래 고객사",
    description: "제조·유통·이커머스",
  },
]

/** 회사 소개 섹션 */
export const about = {
  badge: "회사 소개",
  title: "복잡한 물류를 단순하게",
  description:
    "화주의 입장에서 가장 효율적인 운송 경로와 비용 구조를 설계합니다. 수출입 절차 전반을 대행하여 고객이 본업에만 집중할 수 있도록 지원합니다.",
  values: [
    {
      icon: ShieldCheck,
      title: "안전 최우선",
      description:
        "화물 특성에 맞는 포장과 적재 기준을 적용하고, 전 구간 적하보험으로 리스크를 관리합니다.",
    },
    {
      icon: Radar,
      title: "실시간 가시성",
      description:
        "집하부터 인도까지 각 단계의 상태를 실시간으로 공유하여 화물 위치를 언제든 확인할 수 있습니다.",
    },
    {
      icon: Headset,
      title: "전담 담당자 배정",
      description:
        "거래처마다 전담 담당자를 배정해 견적, 스케줄, 통관 문의를 하나의 창구에서 처리합니다.",
    },
    {
      icon: Globe2,
      title: "글로벌 네트워크",
      description:
        "주요 항만과 공항의 현지 파트너를 통해 도착지까지 끊김 없는 운송 구간을 확보합니다.",
    },
  ],
  ctaText: "화물 종류와 노선에 맞는 운송 방안을 안내해 드립니다.",
  primaryCta: { label: "견적 문의하기", href: "#contact" },
  secondaryCta: { label: "서비스 보기", href: "#features" },
}

/** 서비스 섹션 */
export const services = {
  badge: "서비스 안내",
  title: "수출입 전 과정을 아우르는 물류 서비스",
  description:
    "운송 수단 선택부터 통관, 보관, 국내 배송까지 필요한 단계만 골라서 이용하거나 전 구간을 일괄 위탁할 수 있습니다.",

  transport: {
    title: "화물 특성에 맞는 운송 수단",
    description:
      "납기와 비용 조건에 따라 해상·항공·육상 운송을 조합해 최적의 경로를 설계합니다.",
    items: [
      {
        icon: Anchor,
        title: "해상 운송",
        description: "FCL / LCL 컨테이너 운송 및 특수 화물 선적 지원.",
      },
      {
        icon: PlaneTakeoff,
        title: "항공 운송",
        description: "긴급 화물과 고가 화물을 위한 신속 항공 운송.",
      },
      {
        icon: Truck,
        title: "육상 운송",
        description: "항만·공항 연계 내륙 운송 및 국내 전국 배송.",
      },
      {
        icon: Package,
        title: "복합 운송",
        description: "구간별 운송 수단을 조합한 door-to-door 일괄 운송.",
      },
    ],
    primaryCta: { label: "견적 문의하기", href: "#contact" },
    secondaryCta: { label: "자주 묻는 질문", href: "#faq" },
  },

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

/**
 * 조직 소개 섹션
 * 실제 담당자 정보가 없어 부서 단위로 구성했습니다.
 * TODO: 실제 담당자 소개로 교체하거나 부서 구성 확정 시 수정
 */
export const departments = {
  badge: "조직 안내",
  title: "각 분야 담당 조직이 함께합니다",
  description:
    "견적, 운송, 통관, 창고 운영을 담당하는 조직이 유기적으로 협업하여 화물의 전 구간을 관리합니다.",
  items: [
    {
      icon: Anchor,
      name: "해상운송팀",
      role: "Ocean Freight",
      description: "선사 스케줄 확보, FCL/LCL 선적, 컨테이너 배정 업무를 담당합니다.",
    },
    {
      icon: PlaneTakeoff,
      name: "항공운송팀",
      role: "Air Freight",
      description: "항공 스페이스 확보와 긴급 화물 처리, 특송 건을 담당합니다.",
    },
    {
      icon: Truck,
      name: "내륙운송팀",
      role: "Inland Transport",
      description: "항만·공항 연계 운송과 국내 배송 차량 배차를 담당합니다.",
    },
    {
      icon: FileCheck2,
      name: "통관팀",
      role: "Customs",
      description: "수출입 신고와 요건 확인 등 통관 절차 전반을 지원합니다.",
    },
    {
      icon: Warehouse,
      name: "창고운영팀",
      role: "Warehouse",
      description: "입출고, 재고 관리, 유통가공 등 센터 운영을 담당합니다.",
    },
    {
      icon: BadgeCheck,
      name: "영업팀",
      role: "Sales",
      description: "노선별 견적 산출과 신규 거래처 상담을 담당합니다.",
    },
    {
      icon: Headset,
      name: "고객지원팀",
      role: "Customer Support",
      description: "운송 현황 안내와 클레임 접수·처리를 담당합니다.",
    },
    {
      icon: Building2,
      name: "경영지원팀",
      role: "Management",
      description: "정산, 계약 관리 등 거래 전반의 행정 업무를 담당합니다.",
    },
  ],
}

/**
 * 요금 안내 섹션
 * 물류 요금은 노선·중량·부피에 따라 달라지므로 고정 가격 대신 견적 문의로 안내합니다.
 * TODO: 실제 서비스 등급과 제공 범위 확정 시 교체
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
        "해상 · 항공 · 육상 단일 구간 운송",
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

/** FAQ — TODO: 실제 운영 정책 확정 후 답변 재작성 */
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
      question: "운송 기간은 얼마나 걸리나요?",
      answer:
        "운송 수단과 노선에 따라 다릅니다. 항공 운송은 통상 수일, 해상 운송은 노선에 따라 수 주가 소요되며, 통관 소요 시간이 추가될 수 있습니다. 정확한 일정은 스케줄 확인 후 안내해 드립니다.",
    },
    {
      value: "item-3",
      question: "통관도 함께 진행할 수 있나요?",
      answer:
        "네, 통관 대행이 가능합니다. 수출입 신고와 요건 확인, 관세 산출까지 협업 관세사와 함께 처리하며 운송과 통관을 한 번에 위탁하실 수 있습니다.",
    },
    {
      value: "item-4",
      question: "소량 화물도 의뢰할 수 있나요?",
      answer:
        "가능합니다. 컨테이너 단위에 미치지 않는 소량 화물은 LCL(혼적) 방식으로 운송하며, 긴급 건은 항공 운송으로 안내해 드립니다.",
    },
    {
      value: "item-5",
      question: "화물 위치는 어떻게 확인하나요?",
      answer:
        "운송 단계별 상태를 담당자가 공유해 드리며, 정기 계약 고객사는 대시보드를 통해 진행 중인 배송 현황을 직접 조회하실 수 있습니다.",
    },
    {
      value: "item-6",
      question: "보관 공간도 이용할 수 있나요?",
      answer:
        "네, 물류센터 보관과 항만 인근 보세창고 이용이 가능합니다. 보관 기간과 물량에 따라 조건이 달라지므로 상담 시 안내해 드립니다.",
    },
  ],
  contactPrompt: "찾으시는 답변이 없다면 언제든 문의해 주세요.",
  contactCta: { label: "문의하기", href: "#contact" },
}

/** 하단 CTA 섹션 */
export const cta = {
  badge: "물류 상담",
  highlights: ["해상 · 항공 · 육상 운송", "통관 대행", "창고 보관"],
  headlineStart: "복잡한 수출입,",
  headlineHighlight: "한 곳에서",
  headlineEnd: "해결하세요",
  description:
    "노선과 화물 조건만 알려주시면 담당자가 최적의 운송 방안과 예상 비용을 정리해 드립니다.",
  primaryCta: { label: "견적 문의하기", href: "#contact" },
  secondaryCta: { label: "서비스 알아보기", href: "#features" },
  trustIndicators: ["전담 담당자 배정", "전 구간 적하보험", "실시간 화물 추적"],
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
      icon: Headset,
      title: "전화 상담",
      description: `${company.contact.phone} · ${company.contact.businessHours}`,
    },
  ],
  formTitle: "문의 남기기",
  formPlaceholders: {
    company: "(주)예시상사",
    name: "홍길동",
    email: "name@example.com",
    subject: "부산 → 로테르담 해상 운송 견적 문의",
    message:
      "화물 품목, 중량·부피, 출발지와 도착지, 희망 납기를 함께 적어주시면 더 빠르게 안내해 드립니다.",
  },
  submitLabel: "문의 보내기",
}

/** 푸터 */
export const footer = {
  description:
    "해상·항공·육상 운송부터 통관과 창고 보관까지, 수출입 전 과정을 지원하는 종합 물류 파트너입니다.",
  newsletter: {
    title: "물류 소식 받아보기",
    description: "운임 동향과 노선 공지를 이메일로 보내드립니다.",
    placeholder: "이메일 주소를 입력하세요",
    submitLabel: "구독하기",
  },
  links: {
    서비스: [
      { name: "해상 운송", href: "#features" },
      { name: "항공 운송", href: "#features" },
      { name: "육상 운송", href: "#features" },
      { name: "통관 대행", href: "#features" },
    ],
    회사: [
      { name: "회사 소개", href: "#about" },
      { name: "조직 안내", href: "#team" },
      { name: "요금 안내", href: "#pricing" },
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
    { name: "조직 안내", href: "#team" },
    { name: "요금 안내", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
    { name: "문의", href: "#contact" },
  ],
  megaMenu: [
    {
      title: "운송 서비스",
      items: [
        {
          title: "해상 운송",
          description: "FCL / LCL 컨테이너 운송",
          icon: Anchor,
          href: "#features",
        },
        {
          title: "항공 운송",
          description: "긴급 화물 신속 운송",
          icon: PlaneTakeoff,
          href: "#features",
        },
        {
          title: "육상 운송",
          description: "내륙 운송 및 국내 배송",
          icon: Truck,
          href: "#features",
        },
        {
          title: "복합 운송",
          description: "door-to-door 일괄 운송",
          icon: Package,
          href: "#features",
        },
      ],
    },
    {
      title: "부가 서비스",
      items: [
        {
          title: "통관 대행",
          description: "수출입 신고 및 요건 확인",
          icon: FileCheck2,
          href: "#features",
        },
        {
          title: "창고 보관",
          description: "상온·정온 및 보세창고",
          icon: Warehouse,
          href: "#features",
        },
        {
          title: "재고 · 유통가공",
          description: "입출고, 피킹·패킹, 라벨링",
          icon: Boxes,
          href: "#features",
        },
        {
          title: "3PL 위탁",
          description: "물류 전 과정 위탁 운영",
          icon: Container,
          href: "#pricing",
        },
      ],
    },
    {
      title: "고객 지원",
      items: [
        {
          title: "견적 요청",
          description: "노선별 운임 견적 안내",
          icon: ClipboardCheck,
          href: "#contact",
        },
        {
          title: "화물 추적",
          description: "진행 중인 운송 현황 조회",
          icon: Radar,
          href: "#contact",
        },
        {
          title: "자주 묻는 질문",
          description: "운송 기간, 통관 절차 안내",
          icon: BadgeCheck,
          href: "#faq",
        },
        {
          title: "요금 안내",
          description: "이용 형태별 요금 구조",
          icon: Building2,
          href: "#pricing",
        },
      ],
    },
  ],
}
