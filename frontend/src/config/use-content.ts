"use client"

import { useMessages } from "next-intl"
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

import { company } from "./landing-content"

/**
 * 로케일별 랜딩 콘텐츠 조립기
 *
 * 문구는 src/messages/{locale}.json 에서, 아이콘·링크·수치 단위 같은
 * 언어와 무관한 것들은 여기서 붙인다. 반환 형태를 기존 landing-content.ts 의
 * export 와 똑같이 맞춰서, 컴포넌트는 import 한 줄만 바꾸면 된다.
 *
 * ⚠️ 회사명·이메일·거점 인원수·물동량 숫자처럼 언어가 달라도 바뀌면 안 되는
 *    값은 messages 가 아니라 landing-content.ts 의 company 와 아래 상수에서 온다.
 */

/** 아이콘 매핑 — 메시지 키 → lucide 아이콘 */
const MODE_ICONS: Record<string, LucideIcon> = {
  AIR: PlaneTakeoff,
  SEA: Ship,
  TRUCK: Truck,
  RAIL: TrainFront,
  EXPRESS: Zap,
}

/**
 * "왜 JSL인가" 카드 아이콘.
 *
 * Layers·LayoutDashboard 같은 제네릭 대시보드 아이콘을 쓰고 있었는데,
 * 어느 SaaS 랜딩에나 붙어 있는 그림이라 이 회사가 무엇을 하는지 전혀 말하지
 * 않았다. 화물·거점·관제로 뜻이 좁혀지는 물류 아이콘으로 바꾼다.
 */
const ABOUT_VALUE_ICONS: Record<string, LucideIcon> = {
  fullLineup: Container,      // 5+1 풀라인업 — 화물 컨테이너
  ownedNetwork: Warehouse,    // 직접 운영하는 거점 — 자사 창고
  manufacturing: Factory,     // 제조기업 공급망 경험
  platform: Radar,            // 실시간 화물 가시성 — 관제
}

const CONSULTING_ICONS: Record<string, LucideIcon> = {
  diagnosis: ClipboardCheck,
  routing: Route,
  vendor: Boxes,
  ecommerce: ShoppingCart,
  marketEntry: Globe2,
  entitySetup: Building2,
  matching: Handshake,
  funding: BadgeCheck,
}

const VALUE_ADDED_ICONS: Record<string, LucideIcon> = {
  customs: FileCheck2,
  warehouse: Warehouse,
  inventory: Boxes,
  reporting: ClipboardCheck,
}

/** 언어와 무관한 값들 — 절대 번역 대상이 아니다 */
const OFFICE_FACTS = [
  { key: "seoul", cityEn: "Seoul", role: "hq", headcount: 4 },
  { key: "shanghai", cityEn: "Shanghai", role: "branch", headcount: 2 },
  { key: "weihai", cityEn: "Weihai", role: "branch", headcount: 3 },
  { key: "guangzhou", cityEn: "Guangzhou", role: "branch", headcount: 5 },
  { key: "hanoi", cityEn: "Hanoi", role: "branch", headcount: 6 },
] as const

const TOTAL_HEADCOUNT = 20

const VOLUME_FACTS = [
  { icon: PlaneTakeoff, mode: "AIR", value: "200", unitKey: "airUnit" },
  { icon: Ship, mode: "SEA", value: "100", unitKey: "seaUnit" },
  { icon: Truck, mode: "TRUCK", value: "350", unitKey: "truckUnit" },
] as const

/**
 * 제휴 항공사·특송사 로고
 *
 * ── 원칙 ───────────────────────────────────────────────────────────────
 * 파일은 아래 출처에서 받은 공식 벡터 로고 원본 그대로다. 색·비율·형태를
 * 손대지 않았고, 최적화 도구로 다시 쓰지도 않았다 (바이트 단위로 출처와
 * 대조할 수 있어야 나중에 검증이 된다). 교체할 때도 같은 원칙을 지킬 것.
 * 전부 Wikimedia 기준 퍼블릭 도메인(PD-textlogo) 이지만, 저작권과 별개로
 * 상표권은 각 사에 있다 — 실제 제휴 관계 확인 전에는 노출 범위를 넓히지 말 것.
 *
 * ── 출처 (2026-08-18 내려받음) ─────────────────────────────────────────
 *  korean-air.svg     https://commons.wikimedia.org/wiki/File:KoreanAir_logo.svg
 *  china-eastern.svg  https://en.wikipedia.org/wiki/File:China_Eastern_Airlines_logo.svg
 *  royal-mail.svg     https://commons.wikimedia.org/wiki/File:Royal_Mail_logo.svg
 *  deutsche-post.svg  https://commons.wikimedia.org/wiki/File:Logo_Deutsche_Post_2019.svg
 *  dhl.svg            https://commons.wikimedia.org/wiki/File:DHL_Logo.svg
 *  dpd.svg            https://commons.wikimedia.org/wiki/File:DPD_logo_(2015).svg
 *
 * ⚠️ korean-air.svg 는 1984–2025 년에 쓰인 이전 로고다. 대한항공이 2025년 3월
 *    CI 를 바꿨는데 Commons 에 새 로고의 자유 이용 벡터가 아직 없다. 공식
 *    브랜드킷에서 새 로고를 받으면 교체할 것.
 *
 * ── height: 잉크 면적으로 맞춘 값 ──────────────────────────────────────
 * 높이를 똑같이 맞추면 시각적 무게가 전혀 맞지 않는다. 로고마다 경계상자
 * 안에서 실제로 잉크가 차지하는 비율이 다르기 때문이다. 각 SVG 를 높이
 * 100px 로 래스터화해 불투명 픽셀을 세어 봤더니:
 *
 *     Deutsche Post  잉크 100%   (노란 판이 상자를 꽉 채운다)
 *     DHL            잉크 100%
 *     Royal Mail     잉크  97%
 *     대한항공        잉크  57%   (얇은 워드마크)
 *     dpd            잉크  39%   (아이콘 + 소문자, 내부 여백이 많다)
 *     동방항공        잉크  37%
 *
 * 예전 높이(17~26px)로는 잉크 면적이 dpd 622 ~ Deutsche Post 2621 로 4.2배나
 * 벌어져 있었다 — 같은 흰 상자에 넣어 두니 더 들쭉날쭉해 보였던 원인이다.
 *
 * 잉크 면적을 완전히 균등하게 맞추면(면적은 높이의 제곱이므로 h = 100·√(T/I))
 * 이번엔 dpd 가 42px, Deutsche Post 가 19px 로 dpd 가 압도한다. 여백이 많은
 * 로고를 키워 여백까지 보상하는 꼴이라 그렇다. 그래서 기존 높이와 균등해 를
 * 기하평균으로 절충했다(√(h_현재 · h_균등)). 결과 면적 편차 4.2배 → 2.0배.
 *
 * ── patch: 흰 배경 패치가 필요한가 ─────────────────────────────────────
 * 같은 래스터화에서 잉크 픽셀의 밝기도 쟀다. 대한항공·동방항공·dpd 는 잉크의
 * 96~100% 가 어두워서(네이비/진회색) 다크 배경 위에 그대로 올리면 묻힌다.
 * 이 셋만 로고 크기에 맞춘 최소 흰 패치를 깔고, 자기 색 판을 이미 갖고 있는
 * Deutsche Post·DHL(노랑)·Royal Mail(빨강)은 배경 위에 직접 올린다.
 *
 * ── width 는 레이아웃 예약용 근삿값 ────────────────────────────────────
 * 실제 렌더는 height 만 CSS 로 주고 width 는 auto 로 둔다 (partners-bar.tsx).
 * 아래 width 가 원본 종횡비와 소수점 단위로 어긋나도 화면에는 영향이 없다 —
 * 폭은 브라우저가 원본에서 끌어내므로 왜곡이 수학적으로 0 이다.
 */
const PARTNER_LOGOS = {
  koreanAir: { src: "/logos/partners/korean-air.svg", width: 151, height: 18, patch: true },
  chinaEastern: { src: "/logos/partners/china-eastern.svg", width: 128, height: 28, patch: true },
  royalMail: { src: "/logos/partners/royal-mail.svg", width: 86, height: 22, patch: false },
  deutschePost: { src: "/logos/partners/deutsche-post.svg", width: 95, height: 21, patch: false },
  dhl: { src: "/logos/partners/dhl.svg", width: 95, height: 21, patch: false },
  dpd: { src: "/logos/partners/dpd.svg", width: 79, height: 33, patch: true },
} as const

const CONSULTING_CLIENT_KEYS = ["diagnosis", "routing", "vendor", "ecommerce"] as const
const CONSULTING_FORWARDER_KEYS = ["marketEntry", "entitySetup", "matching", "funding"] as const

type Msg = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

/** 메가메뉴 방문자 세그먼트 */
export type MegaMenuAudience = "shipper" | "forwarder"

interface NavItem {
  name: string
  href: string
  /** 값이 있으면 그 세그먼트의 메가메뉴를 드롭다운으로 연다 */
  megaMenu?: MegaMenuAudience
}

export function useContent() {
  const m = useMessages() as unknown as Msg

  const hero = {
    badge: m.hero.badge as string,
    headlineStart: m.hero.headlineStart as string,
    headlineHighlight: m.hero.headlineHighlight as string,
    headlineEnd: m.hero.headlineEnd as string,
    subheadline: m.hero.subheadline as string,
    primaryCta: { label: m.hero.primaryCta as string, href: "#contact" },
    secondaryCta: { label: m.hero.secondaryCta as string, href: "#features" },
    /*
      히어로 벤토그리드의 5개 칸.

      제목과 한 줄 설명은 services.modes 를 그대로 쓴다. 히어로용으로 문구를
      따로 두면 같은 서비스를 두 가지 표현으로 부르게 되고, 번역도 두 벌이 된다.
      사진 대체텍스트(alt)만 별도 키를 쓰는데, 사진에 무엇이 찍혔는지는 서비스
      설명과 다른 이야기라 그렇다.

      href 는 같은 페이지의 서비스 카드 앵커다 (features-section 의 article id).
    */
    bento: {
      modes: Object.entries(MODE_ICONS).map(([code, icon]) => ({
        icon,
        code,
        title: m.services.modes[code].title as string,
        summary: m.services.modes[code].summary as string,
        alt: m.heroBentoAlt[code] as string,
        href: `#${code.toLowerCase()}`,
      })),
    },
  }

  const stats = [
    { icon: TrendingUp, ...m.stats.revenue },
    { icon: Globe2, ...m.stats.locations },
    { icon: Users, ...m.stats.clients },
    { icon: Handshake, ...m.stats.partners },
  ]

  const monthlyVolumes = VOLUME_FACTS.map((v) => ({
    icon: v.icon,
    mode: v.mode,
    value: v.value,
    unit: m.volumes[v.unitKey],
  }))

  const volumesHeading = { title: m.volumes.title, description: m.volumes.description }

  const partners = {
    title: m.partners.title,
    description: m.partners.description,
    note: m.partners.note,
    groups: [
      {
        label: m.partners.groupAir,
        items: [
          { name: m.partners.koreanAir, logo: PARTNER_LOGOS.koreanAir },
          { name: m.partners.chinaEastern, logo: PARTNER_LOGOS.chinaEastern },
        ],
      },
      {
        label: m.partners.groupExpress,
        items: [
          { name: "Royal Mail", logo: PARTNER_LOGOS.royalMail },
          { name: "Deutsche Post", logo: PARTNER_LOGOS.deutschePost },
          { name: "DHL", logo: PARTNER_LOGOS.dhl },
          { name: "DPD", logo: PARTNER_LOGOS.dpd },
        ],
      },
    ],
  }

  const about = {
    badge: m.about.badge,
    title: m.about.title,
    description: m.about.description,
    valuesTitle: m.about.valuesTitle,
    values: Object.entries(ABOUT_VALUE_ICONS).map(([key, icon]) => ({
      icon,
      title: m.about.values[key].title,
      description: m.about.values[key].description,
    })),
    ctaText: m.about.ctaText,
    primaryCta: { label: m.about.primaryCta, href: "#contact" },
    secondaryCta: { label: m.about.secondaryCta, href: "#features" },
  }

  const services = {
    badge: m.services.badge,
    title: m.services.title,
    description: m.services.description,
    modes: Object.entries(MODE_ICONS).map(([code, icon]) => ({
      icon,
      code,
      title: m.services.modes[code].title,
      summary: m.services.modes[code].summary,
      highlights: m.services.modes[code].highlights as string[],
    })),
    valueAdded: {
      title: m.services.valueAdded.title,
      description: m.services.valueAdded.description,
      items: Object.entries(VALUE_ADDED_ICONS).map(([key, icon]) => ({
        icon,
        title: m.services.valueAdded[key].title,
        description: m.services.valueAdded[key].description,
      })),
      primaryCta: { label: m.services.valueAdded.primaryCta, href: "#contact" },
      secondaryCta: { label: m.services.valueAdded.secondaryCta, href: "#pricing" },
    },
  }

  const consultingItem = (key: string) => ({
    icon: CONSULTING_ICONS[key],
    title: m.consulting.items[key].title,
    subtitle: m.consulting.items[key].subtitle,
    description: m.consulting.items[key].description,
    detail: m.consulting.items[key].detail,
  })

  const consulting = {
    badge: m.consulting.badge,
    title: m.consulting.title,
    description: m.consulting.description,
    groups: [
      {
        // 메가메뉴의 화주/포워더 진입 경로가 이 앵커로 연결된다 (#shipper, #forwarder)
        id: "shipper",
        audience: m.consulting.clientAudience,
        description: m.consulting.clientDescription,
        items: CONSULTING_CLIENT_KEYS.map(consultingItem),
      },
      {
        id: "forwarder",
        audience: m.consulting.forwarderAudience,
        description: m.consulting.forwarderDescription,
        items: CONSULTING_FORWARDER_KEYS.map(consultingItem),
      },
    ],
    primaryCta: { label: m.consulting.primaryCta, href: "/landing#contact" },
    detailCta: { label: m.consulting.detailCta, href: "/consulting" },
    page: {
      eyebrow: m.consulting.badge,
      title: m.consulting.title,
      lead: m.consulting.page.lead,
      note: m.consulting.page.note,
      contact: {
        title: m.consulting.page.contactTitle,
        description: m.consulting.page.contactDescription,
        primaryCta: { label: m.consulting.page.contactCta, href: "/landing#contact" },
      },
    },
  }

  const network = {
    badge: m.network.badge,
    title: m.network.title,
    description: m.network.description,
    totalHeadcount: TOTAL_HEADCOUNT,
    totalLabel: (m.network.totalLabel as string).replace("{count}", String(TOTAL_HEADCOUNT)),
    headcountUnit: m.network.headcountUnit,
    items: OFFICE_FACTS.map((o) => ({
      // 다섯 칸 모두 지도핀이면 아이콘이 아무것도 구분하지 못한다 — 본사만 가른다
      icon: o.role === "hq" ? Building2 : MapPin,
      city: m.network.offices[o.key].city,
      cityEn: o.cityEn,
      role: o.role === "hq" ? m.network.roleHq : m.network.roleBranch,
      headcount: o.headcount,
      description: m.network.offices[o.key].description,
    })),
  }

  /**
   * 요금 안내.
   * ⚠️ 실제 요금 정책이 확정되지 않은 임시 구성이다. 확정되면 messages 의
   *    plans 블록을 교체해야 한다.
   */
  const planKeys = ["spot", "contract", "tpl"] as const
  const plans = {
    badge: m.plans.badge as string,
    title: m.plans.title as string,
    description: m.plans.description as string,
    note: m.plans.note as string,
    noteCta: { label: m.plans.noteCta as string, href: "#contact" },
    items: planKeys.map((key, i) => ({
      name: m.plans[key].name as string,
      description: m.plans[key].description as string,
      priceLabel: m.plans[key].priceLabel as string,
      priceCaption: m.plans[key].priceCaption as string,
      features: m.plans[key].features as string[],
      cta: m.plans[key].cta as string,
      popular: key === "contract",
      // 앞 등급 포함 문구는 두 번째 등급부터
      includesPrevious:
        i === 0
          ? undefined
          : (m.plans.includesPrevious as string).replace(
              "{plan}",
              m.plans[planKeys[i - 1]].name as string
            ),
    })),
  }

  const faq = {
    badge: m.faq.badge,
    title: m.faq.title,
    description: m.faq.description,
    items: (m.faq.items as { question: string; answer: string }[]).map((it, i) => ({
      value: `item-${i + 1}`,
      ...it,
    })),
    contactPrompt: m.faq.contactPrompt,
    contactCta: { label: m.faq.contactCta, href: "#contact" },
  }

  const cta = {
    badge: m.cta.badge as string,
    headlineStart: m.cta.headlineStart as string,
    headlineHighlight: m.cta.headlineHighlight as string,
    headlineEnd: m.cta.headlineEnd as string,
    description: m.cta.description as string,
    highlights: m.cta.highlights as string[],
    trustIndicators: m.cta.trustIndicators as string[],
    primaryCta: { label: m.cta.primaryCta as string, href: "#contact" },
    secondaryCta: { label: m.cta.secondaryCta as string, href: "#features" },
  }

  const contact = {
    badge: m.contact.badge,
    title: m.contact.title,
    description: m.contact.description,
    channels: [
      { icon: Package, ...m.contact.channelQuote },
      { icon: MapPin, ...m.contact.channelTracking },
      {
        icon: Mail,
        title: m.contact.channelEmail.title,
        description: `${company.contact.email} · ${m.contact.businessHours}`,
      },
    ],
    formTitle: m.contact.formTitle,
    fields: {
      company: m.contact.fieldCompany,
      name: m.contact.fieldName,
      email: m.contact.fieldEmail,
      subject: m.contact.fieldSubject,
      message: m.contact.fieldMessage,
    },
    formPlaceholders: {
      company: m.contact.placeholderCompany,
      name: m.contact.placeholderName,
      email: m.contact.placeholderEmail,
      subject: m.contact.placeholderSubject,
      message: m.contact.placeholderMessage,
    },
    consentLabel: m.contact.consentLabel,
    consentLink: m.contact.consentLink,
    consentDetail: m.contact.consentDetail,
    submitLabel: m.contact.submit,
    submittingLabel: m.contact.submitting,
    successTitle: m.contact.successTitle,
    successDescription: m.contact.successDescription,
    errorTitle: m.contact.errorTitle,
  }

  const footer = {
    description: m.footer.description,
    newsletter: {
      title: m.footer.newsletterTitle,
      description: m.footer.newsletterDescription,
      placeholder: m.footer.newsletterPlaceholder,
      submitLabel: m.footer.newsletterSubmit,
    },
    links: {
      [m.footer.colServices]: [
        { name: m.services.modes.AIR.title, href: "/landing#features" },
        { name: m.services.modes.SEA.title, href: "/landing#features" },
        { name: m.services.modes.TRUCK.title, href: "/landing#features" },
        { name: m.services.modes.RAIL.title, href: "/landing#features" },
        { name: m.services.modes.EXPRESS.title, href: "/landing#features" },
      ],
      [m.footer.colCompany]: [
        { name: m.nav.about, href: "/landing#about" },
        { name: m.nav.consulting, href: "/consulting" },
        { name: m.nav.network, href: "/landing#network" },
        { name: m.nav.contact, href: "/landing#contact" },
      ],
      [m.footer.colSupport]: [
        { name: m.nav.faq, href: "/landing#faq" },
        { name: m.nav.tracking, href: "/tracking" },
        { name: m.footer.linkQuote, href: "/landing#contact" },
        { name: m.footer.linkNotice, href: "#" },
      ],
      [m.footer.colLegal]: [
        { name: m.footer.linkTerms, href: "/terms" },
        { name: m.footer.linkPrivacy, href: "/privacy" },
      ],
    },
    legalLinks: [
      { name: m.footer.linkTerms, href: "/terms" },
      { name: m.footer.linkPrivacy, href: "/privacy" },
    ],
    rights: m.footer.rights,
  }

  /**
   * 메가메뉴 — 방문자 세그먼트별로 진입 경로를 나눈다.
   *
   * 화주(짐을 맡기는 기업)와 포워더(파트너사)는 찾는 것이 다르다. 예전에는 하나의
   * "서비스" 드롭다운에 둘의 항목이 섞여 있어서, 컨설팅 페이지에 들어가 화주 4개 ·
   * 포워더 4개를 눈으로 골라내야 했다. 네비게이션에서부터 갈라 각자 관련된 항목이
   * 먼저 보이게 한다. 페이지 구조는 그대로 두고 진입 경로만 나눈 것이다.
   */
  const modeItems = Object.entries(MODE_ICONS).map(([code, icon]) => ({
    title: m.services.modes[code].title,
    description: m.services.modes[code].summary,
    icon,
    href: "/landing#features",
  }))

  const megaMenus = {
    shipper: {
      question: m.megaMenu.shipperQuestion as string,
      lead: m.megaMenu.shipperLead as string,
      cta: { label: m.megaMenu.shipperCta as string, href: "/consulting#shipper" },
      sections: [
        { title: m.megaMenu.shipperServices as string, items: modeItems },
        {
          title: m.megaMenu.shipperConsulting as string,
          items: CONSULTING_CLIENT_KEYS.map((key) => ({
            title: m.consulting.items[key].title,
            description: m.consulting.items[key].description,
            icon: CONSULTING_ICONS[key],
            href: "/consulting#shipper",
          })),
        },
        {
          title: m.nav.contact as string,
          items: [
            { title: m.nav.tracking, description: m.tracking.subtitle, icon: Radar, href: "/tracking" },
            { title: m.footer.linkQuote, description: m.contact.channelQuote.title, icon: Container, href: "/landing#contact" },
            { title: m.nav.faq, description: m.faq.description, icon: BadgeCheck, href: "/landing#faq" },
          ],
        },
      ],
    },
    forwarder: {
      question: m.megaMenu.forwarderQuestion as string,
      lead: m.megaMenu.forwarderLead as string,
      cta: { label: m.megaMenu.forwarderCta as string, href: "/consulting#forwarder" },
      sections: [
        {
          title: m.megaMenu.forwarderPrograms as string,
          items: CONSULTING_FORWARDER_KEYS.map((key) => ({
            title: m.consulting.items[key].title,
            description: m.consulting.items[key].description,
            icon: CONSULTING_ICONS[key],
            href: "/consulting#forwarder",
          })),
        },
        {
          title: m.megaMenu.forwarderSupport as string,
          items: [
            { title: m.nav.network, description: m.megaMenu.networkDescription, icon: Globe2, href: "/landing#network" },
            { title: m.megaMenu.partnershipTitle, description: m.megaMenu.partnershipDescription, icon: Handshake, href: "/landing#contact" },
            { title: m.nav.faq, description: m.faq.description, icon: BadgeCheck, href: "/landing#faq" },
          ],
        },
      ],
    },
  }

  const navItems: NavItem[] = [
    { name: m.nav.home, href: "#hero" },
    { name: m.nav.about, href: "#about" },
    { name: m.nav.shipper, href: "#features", megaMenu: "shipper" },
    { name: m.nav.forwarder, href: "/consulting#forwarder", megaMenu: "forwarder" },
    { name: m.nav.network, href: "#network" },
    { name: m.nav.tracking, href: "/tracking" },
    { name: m.nav.faq, href: "#faq" },
    { name: m.nav.contact, href: "#contact" },
  ]

  const navigation = {
    items: navItems,
    megaMenus,
    dashboard: m.nav.dashboard,
    signIn: m.nav.signIn,
    quoteCta: m.nav.quoteCta,
  }

  return {
    company,
    hero,
    stats,
    monthlyVolumes,
    volumesHeading,
    partners,
    about,
    services,
    consulting,
    network,
    plans,
    faq,
    cta,
    contact,
    footer,
    navigation,
  }
}
