/**
 * 법적 고지 문서 (개인정보처리방침 / 이용약관) — 다국어
 *
 * ⚠️ 표준 템플릿을 기반으로 한 초안이며 법률 검토를 받지 않았습니다.
 *
 * ⚠️ 한국어 외 번역본은 AI 1차 번역입니다. 실제 배포 전 원어민 검수가
 *    필요하며, 특히 중국어·베트남어는 반드시 검수받으세요.
 *    법적 문서는 표현 하나가 의무 범위를 바꿀 수 있어, 번역본에는
 *    "한국어본이 우선한다"는 조항(precedenceNotice)을 함께 표시합니다.
 *
 * 회사명·대표자·연락처는 landing-content.ts 의 company 를 참조합니다.
 */

import { company, getCompanyAddress } from "./landing-content"
import type { Locale } from "@/i18n/routing"

/**
 * 시행일자.
 * TODO: 실제 공개(시행) 예정일이 정해지면 그 날짜로 교체하세요.
 */
export const EFFECTIVE_DATE = "2026-08-16"

export const formatDate = (isoDate: string, locale: Locale) => {
  const [year, month, day] = isoDate.split("-")
  const m = Number(month)
  const d = Number(day)
  switch (locale) {
    case "ko":
      return `${year}년 ${m}월 ${d}일`
    case "zh":
      return `${year}年${m}月${d}日`
    case "vi":
      return `ngày ${d} tháng ${m} năm ${year}`
    default:
      return new Date(isoDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
  }
}

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface LegalDocument {
  slug: string
  title: string
  description: string
  intro?: string
  sections: LegalSection[]
  effectiveNote: string
  /** 번역본에만 표시되는 우선순위 고지 (한국어본은 null) */
  precedenceNotice: string | null
}

/**
 * 개인정보 관련 문의 창구.
 *
 * 대표 메일(hq) 하나만 쓴다. 사이트에는 한국지사 메일(kr)도 함께 노출하지만,
 * 개인정보 열람·정정 요청을 어느 창구가 받을지는 아직 정해지지 않았다.
 * 창구가 정해지면 여기도 함께 바꿀 것.
 *
 * 주소는 화면 언어에 맞춰 국문/영문 공식 표기를 고른다.
 */
const CONTACT_BULLETS = (
  locale: Locale,
  labels: {
    email: string
    address: string
    phone: string
  }
) => [
  `${labels.email}: ${company.contact.email}`,
  `${labels.address}: ${getCompanyAddress(locale)}`,
  `${labels.phone}: ${company.contact.phone}`,
]

// ── 한국어 (원본, 우선함) ───────────────────────────────────────────────
const ko = (): { privacy: LegalDocument; terms: LegalDocument } => ({
  privacy: {
    slug: "privacy",
    title: "개인정보처리방침",
    description: `${company.legalName}의 개인정보 수집·이용 및 보호에 관한 방침입니다.`,
    intro: `${company.legalName}(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 회사는 본 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.`,
    sections: [
      {
        heading: "1. 수집하는 개인정보 항목",
        paragraphs: ["회사는 웹사이트 문의(Contact) 및 AI 챗봇 상담 기능 이용 시 아래와 같은 개인정보를 수집합니다."],
        bullets: ["필수항목: 회사명, 담당자명, 이메일 주소, 문의 내용", "수집방법: 홈페이지 문의 폼, AI 챗봇 상담"],
      },
      { heading: "2. 개인정보의 수집 및 이용 목적", bullets: ["문의사항에 대한 답변 및 상담 서비스 제공", "서비스 관련 안내 및 커뮤니케이션"] },
      { heading: "3. 개인정보의 보유 및 이용 기간", paragraphs: ["회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 문의 이력은 상담 품질 관리를 위해 수집일로부터 3년간 보관 후 파기합니다."] },
      { heading: "4. 개인정보의 제3자 제공", paragraphs: ["회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의하거나 법령의 규정에 의한 경우는 예외로 합니다."] },
      { heading: "5. 개인정보의 파기절차 및 방법", paragraphs: ["전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다."] },
      {
        heading: "6. 이용자의 권리와 행사 방법",
        paragraphs: ["이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요청할 수 있으며, 아래 연락처로 요청하실 수 있습니다."],
        bullets: CONTACT_BULLETS("ko", { email: "이메일", address: "주소", phone: "전화" }),
      },
      { heading: "7. 개인정보 보호책임자", bullets: [`성명: ${company.ceo}`, `이메일: ${company.contact.email}`] },
      { heading: "8. 고지의 의무", paragraphs: ["본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가·삭제 및 정정이 있는 경우에는 개정 최소 7일 전부터 홈페이지를 통해 고지합니다."] },
    ],
    effectiveNote: `시행일자: ${formatDate(EFFECTIVE_DATE, "ko")}`,
    precedenceNotice: null,
  },
  terms: {
    slug: "terms",
    title: "이용약관",
    description: `${company.legalName} 웹사이트 및 관련 서비스의 이용조건과 절차를 규정합니다.`,
    sections: [
      { heading: "제1조 (목적)", paragraphs: [`본 약관은 ${company.legalName}(이하 "회사")가 제공하는 웹사이트 및 관련 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`] },
      { heading: "제2조 (정의)", paragraphs: [`"이용자"란 회사의 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 자를 말합니다.`] },
      { heading: "제3조 (약관의 효력 및 변경)", paragraphs: ["본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있습니다."] },
      { heading: "제4조 (서비스의 제공)", paragraphs: ["회사는 물류 서비스 소개, 문의 접수, AI 기반 상담 챗봇 등의 서비스를 제공합니다."] },
      { heading: "제5조 (이용자의 의무)", paragraphs: ["이용자는 서비스 이용 시 관련 법령과 본 약관을 준수해야 하며, 허위 정보 등록, 회사의 지적재산권 침해 등의 행위를 해서는 안 됩니다."] },
      { heading: "제6조 (면책조항)", paragraphs: ["회사는 천재지변, 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다. AI 챗봇 상담 내용은 참고용 정보이며, 정확한 견적 및 계약 조건은 별도 문의를 통해 확인해야 합니다."] },
      { heading: "제7조 (분쟁해결)", paragraphs: ["본 약관과 관련한 분쟁은 대한민국 법령에 따르며, 관할 법원은 민사소송법상의 관할 법원으로 합니다."] },
      { heading: "부칙", paragraphs: [`본 약관은 ${formatDate(EFFECTIVE_DATE, "ko")}부터 시행합니다.`] },
    ],
    effectiveNote: `시행일자: ${formatDate(EFFECTIVE_DATE, "ko")}`,
    precedenceNotice: null,
  },
})

// ── English ─────────────────────────────────────────────────────────────
const EN_PRECEDENCE =
  "This is a reference translation. The Korean version of this document is the authoritative text; in the event of any discrepancy, the Korean version prevails."

const en = (): { privacy: LegalDocument; terms: LegalDocument } => ({
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description: `How ${company.legalName} collects, uses and protects personal data.`,
    intro: `${company.legalName} (the "Company") treats users' personal data as important and complies with applicable laws, including the Personal Information Protection Act of Korea. Through this Privacy Policy, the Company explains for what purposes and in what manner the personal data you provide is used, and what measures are taken to protect it.`,
    sections: [
      {
        heading: "1. Personal data we collect",
        paragraphs: ["The Company collects the following personal data when you use the website enquiry form or the AI chatbot consultation feature."],
        bullets: ["Required: company name, contact name, email address, enquiry content", "Collection method: website enquiry form, AI chatbot consultation"],
      },
      { heading: "2. Purpose of collection and use", bullets: ["Responding to enquiries and providing consultation services", "Service-related notices and communication"] },
      { heading: "3. Retention and use period", paragraphs: ["As a rule, the Company destroys personal data without delay once the purpose of collection and use has been achieved. However, enquiry records are retained for 3 years from the date of collection for consultation quality management, and then destroyed."] },
      { heading: "4. Provision to third parties", paragraphs: ["As a rule, the Company does not provide users' personal data to external parties. Exceptions apply where the user has given prior consent or where required by law."] },
      { heading: "5. Destruction procedure and method", paragraphs: ["Personal data stored in electronic file form is deleted using technical methods that make the records irrecoverable."] },
      {
        heading: "6. Your rights and how to exercise them",
        paragraphs: ["You may at any time request access to, correction of, deletion of, or suspension of processing of your personal data. Requests can be made using the contact details below."],
        bullets: CONTACT_BULLETS("en", { email: "Email", address: "Address", phone: "Phone" }),
      },
      { heading: "7. Data protection officer", bullets: [`Name: ${company.ceoEn}`, `Email: ${company.contact.email}`] },
      { heading: "8. Notification obligation", paragraphs: ["This policy applies from its effective date. Where there are additions, deletions or corrections arising from changes in law or policy, we will announce them on our website at least 7 days before they take effect."] },
    ],
    effectiveNote: `Effective date: ${formatDate(EFFECTIVE_DATE, "en")}`,
    precedenceNotice: EN_PRECEDENCE,
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    description: `Conditions and procedures for using the ${company.legalName} website and related services.`,
    sections: [
      { heading: "Article 1 (Purpose)", paragraphs: [`These Terms set out the conditions and procedures for using the website and related services (the "Services") provided by ${company.legalName} (the "Company"), as well as the rights, obligations and responsibilities of the Company and users.`] },
      { heading: "Article 2 (Definitions)", paragraphs: [`"User" means a person who accesses the Company's Services and uses them in accordance with these Terms.`] },
      { heading: "Article 3 (Effect and amendment of the Terms)", paragraphs: ["These Terms take effect when posted on the service screen or otherwise announced. The Company may amend these Terms where necessary, within the scope permitted by applicable law."] },
      { heading: "Article 4 (Provision of Services)", paragraphs: ["The Company provides services including logistics service information, enquiry handling and an AI-based consultation chatbot."] },
      { heading: "Article 5 (Obligations of users)", paragraphs: ["Users must comply with applicable law and these Terms when using the Services, and must not register false information or infringe the Company's intellectual property rights."] },
      { heading: "Article 6 (Disclaimer)", paragraphs: ["The Company is exempt from liability where it cannot provide the Services due to natural disaster or force majeure. AI chatbot responses are for reference only; accurate quotations and contract terms must be confirmed through a separate enquiry."] },
      { heading: "Article 7 (Dispute resolution)", paragraphs: ["Disputes relating to these Terms are governed by the laws of the Republic of Korea, and the competent court shall be the court having jurisdiction under the Korean Civil Procedure Act."] },
      { heading: "Addendum", paragraphs: [`These Terms take effect from ${formatDate(EFFECTIVE_DATE, "en")}.`] },
    ],
    effectiveNote: `Effective date: ${formatDate(EFFECTIVE_DATE, "en")}`,
    precedenceNotice: EN_PRECEDENCE,
  },
})

// ── 中文 ────────────────────────────────────────────────────────────────
const ZH_PRECEDENCE =
  "本文为参考译文。本文件以韩文版为准，如译文与韩文版有出入，以韩文版为准。"

const zh = (): { privacy: LegalDocument; terms: LegalDocument } => ({
  privacy: {
    slug: "privacy",
    title: "隐私政策",
    description: `${company.legalName} 关于个人信息收集、使用及保护的政策。`,
    intro: `${company.legalName}（以下简称"公司"）重视用户的个人信息，并遵守《个人信息保护法》等相关法律法规。公司通过本隐私政策告知用户所提供的个人信息将以何种用途和方式使用，以及为保护个人信息采取了哪些措施。`,
    sections: [
      {
        heading: "1. 收集的个人信息项目",
        paragraphs: ["用户使用网站咨询(Contact)及 AI 聊天机器人咨询功能时，公司收集以下个人信息。"],
        bullets: ["必填项：公司名称、联系人姓名、电子邮箱、咨询内容", "收集方式：网站咨询表单、AI 聊天机器人咨询"],
      },
      { heading: "2. 个人信息的收集及使用目的", bullets: ["答复咨询事项并提供咨询服务", "服务相关通知与沟通"] },
      { heading: "3. 个人信息的保存及使用期限", paragraphs: ["公司原则上在达成个人信息收集及使用目的后立即销毁相关信息。但咨询记录为咨询质量管理之目的，自收集之日起保存3年后销毁。"] },
      { heading: "4. 向第三方提供个人信息", paragraphs: ["公司原则上不向外部提供用户的个人信息。但用户事先同意或依据法律规定的情形除外。"] },
      { heading: "5. 个人信息的销毁程序及方法", paragraphs: ["以电子文件形式保存的个人信息，采用无法复原记录的技术手段予以删除。"] },
      {
        heading: "6. 用户的权利及行使方式",
        paragraphs: ["用户可随时要求查阅、更正、删除其个人信息或停止处理，可通过以下联系方式提出。"],
        bullets: CONTACT_BULLETS("zh", { email: "邮箱", address: "地址", phone: "电话" }),
      },
      { heading: "7. 个人信息保护负责人", bullets: [`姓名：${company.ceoEn}`, `邮箱：${company.contact.email}`] },
      { heading: "8. 告知义务", paragraphs: ["本政策自施行之日起适用。因法律法规及政策变更而有增加、删除或更正内容时，将于修订生效前至少7日通过网站予以公告。"] },
    ],
    effectiveNote: `施行日期：${formatDate(EFFECTIVE_DATE, "zh")}`,
    precedenceNotice: ZH_PRECEDENCE,
  },
  terms: {
    slug: "terms",
    title: "使用条款",
    description: `规定 ${company.legalName} 网站及相关服务的使用条件与流程。`,
    sections: [
      { heading: "第1条（目的）", paragraphs: [`本条款旨在规定 ${company.legalName}（以下简称"公司"）提供的网站及相关服务（以下简称"服务"）的使用条件与流程，以及公司与用户的权利、义务及责任事项。`] },
      { heading: "第2条（定义）", paragraphs: [`"用户"是指接入公司服务并依据本条款使用服务的人。`] },
      { heading: "第3条（条款的效力及变更）", paragraphs: ["本条款自在服务页面公示或以其他方式公告之时起生效。公司在不违反相关法律法规的范围内，可根据需要变更本条款。"] },
      { heading: "第4条（服务的提供）", paragraphs: ["公司提供物流服务介绍、咨询受理、基于 AI 的咨询聊天机器人等服务。"] },
      { heading: "第5条（用户的义务）", paragraphs: ["用户在使用服务时应遵守相关法律法规及本条款，不得登记虚假信息、侵害公司知识产权等。"] },
      { heading: "第6条（免责条款）", paragraphs: ["因自然灾害或不可抗力致使无法提供服务时，公司免除责任。AI 聊天机器人的咨询内容仅供参考，准确的报价及合同条件须通过另行咨询确认。"] },
      { heading: "第7条（争议解决）", paragraphs: ["与本条款相关的争议适用大韩民国法律，管辖法院为《民事诉讼法》规定的管辖法院。"] },
      { heading: "附则", paragraphs: [`本条款自 ${formatDate(EFFECTIVE_DATE, "zh")} 起施行。`] },
    ],
    effectiveNote: `施行日期：${formatDate(EFFECTIVE_DATE, "zh")}`,
    precedenceNotice: ZH_PRECEDENCE,
  },
})

// ── Tiếng Việt ──────────────────────────────────────────────────────────
const VI_PRECEDENCE =
  "Đây là bản dịch tham khảo. Bản tiếng Hàn của tài liệu này là bản có hiệu lực; nếu có sai khác, bản tiếng Hàn được ưu tiên áp dụng."

const vi = (): { privacy: LegalDocument; terms: LegalDocument } => ({
  privacy: {
    slug: "privacy",
    title: "Chính sách bảo mật",
    description: `Chính sách của ${company.legalName} về việc thu thập, sử dụng và bảo vệ thông tin cá nhân.`,
    intro: `${company.legalName} (sau đây gọi là "Công ty") coi trọng thông tin cá nhân của người dùng và tuân thủ các quy định pháp luật liên quan, bao gồm Luật Bảo vệ Thông tin Cá nhân của Hàn Quốc. Thông qua Chính sách bảo mật này, Công ty thông báo thông tin cá nhân bạn cung cấp được sử dụng cho mục đích gì, theo cách nào, và những biện pháp nào đang được áp dụng để bảo vệ thông tin đó.`,
    sections: [
      {
        heading: "1. Các mục thông tin cá nhân được thu thập",
        paragraphs: ["Công ty thu thập các thông tin cá nhân sau khi bạn sử dụng biểu mẫu liên hệ trên website hoặc tính năng tư vấn bằng chatbot AI."],
        bullets: ["Bắt buộc: tên công ty, tên người liên hệ, địa chỉ email, nội dung yêu cầu", "Phương thức thu thập: biểu mẫu liên hệ trên website, tư vấn qua chatbot AI"],
      },
      { heading: "2. Mục đích thu thập và sử dụng", bullets: ["Phản hồi các yêu cầu và cung cấp dịch vụ tư vấn", "Thông báo và trao đổi liên quan đến dịch vụ"] },
      { heading: "3. Thời gian lưu giữ và sử dụng", paragraphs: ["Về nguyên tắc, Công ty hủy thông tin cá nhân ngay sau khi đạt được mục đích thu thập và sử dụng. Tuy nhiên, lịch sử yêu cầu được lưu giữ 3 năm kể từ ngày thu thập nhằm quản lý chất lượng tư vấn, sau đó sẽ được hủy."] },
      { heading: "4. Cung cấp cho bên thứ ba", paragraphs: ["Về nguyên tắc, Công ty không cung cấp thông tin cá nhân của người dùng ra bên ngoài. Ngoại lệ áp dụng khi người dùng đã đồng ý trước hoặc khi pháp luật có quy định."] },
      { heading: "5. Quy trình và phương pháp hủy thông tin", paragraphs: ["Thông tin cá nhân lưu dưới dạng tệp điện tử được xóa bằng biện pháp kỹ thuật khiến dữ liệu không thể khôi phục."] },
      {
        heading: "6. Quyền của người dùng và cách thực hiện",
        paragraphs: ["Bạn có thể yêu cầu xem, chỉnh sửa, xóa hoặc tạm dừng xử lý thông tin cá nhân của mình bất cứ lúc nào, qua các đầu mối liên hệ dưới đây."],
        bullets: CONTACT_BULLETS("vi", { email: "Email", address: "Địa chỉ", phone: "Điện thoại" }),
      },
      { heading: "7. Người phụ trách bảo vệ thông tin cá nhân", bullets: [`Họ tên: ${company.ceoEn}`, `Email: ${company.contact.email}`] },
      { heading: "8. Nghĩa vụ thông báo", paragraphs: ["Chính sách này được áp dụng từ ngày có hiệu lực. Khi có nội dung bổ sung, xóa bỏ hoặc chỉnh sửa do thay đổi pháp luật hoặc chính sách, chúng tôi sẽ thông báo trên website ít nhất 7 ngày trước khi có hiệu lực."] },
    ],
    effectiveNote: `Ngày hiệu lực: ${formatDate(EFFECTIVE_DATE, "vi")}`,
    precedenceNotice: VI_PRECEDENCE,
  },
  terms: {
    slug: "terms",
    title: "Điều khoản sử dụng",
    description: `Quy định điều kiện và thủ tục sử dụng website cùng các dịch vụ liên quan của ${company.legalName}.`,
    sections: [
      { heading: "Điều 1 (Mục đích)", paragraphs: [`Điều khoản này quy định điều kiện, thủ tục sử dụng website và các dịch vụ liên quan (sau đây gọi là "Dịch vụ") do ${company.legalName} (sau đây gọi là "Công ty") cung cấp, cùng quyền, nghĩa vụ và trách nhiệm của Công ty và người dùng.`] },
      { heading: "Điều 2 (Định nghĩa)", paragraphs: [`"Người dùng" là người truy cập Dịch vụ của Công ty và sử dụng theo Điều khoản này.`] },
      { heading: "Điều 3 (Hiệu lực và sửa đổi Điều khoản)", paragraphs: ["Điều khoản này có hiệu lực khi được đăng trên màn hình dịch vụ hoặc thông báo bằng phương thức khác. Công ty có thể sửa đổi Điều khoản khi cần thiết, trong phạm vi không trái với pháp luật liên quan."] },
      { heading: "Điều 4 (Cung cấp Dịch vụ)", paragraphs: ["Công ty cung cấp các dịch vụ gồm giới thiệu dịch vụ logistics, tiếp nhận yêu cầu và chatbot tư vấn dựa trên AI."] },
      { heading: "Điều 5 (Nghĩa vụ của người dùng)", paragraphs: ["Khi sử dụng Dịch vụ, người dùng phải tuân thủ pháp luật liên quan và Điều khoản này, không được đăng thông tin sai sự thật hay xâm phạm quyền sở hữu trí tuệ của Công ty."] },
      { heading: "Điều 6 (Miễn trừ trách nhiệm)", paragraphs: ["Công ty được miễn trách nhiệm khi không thể cung cấp Dịch vụ do thiên tai hoặc lý do bất khả kháng. Nội dung tư vấn của chatbot AI chỉ mang tính tham khảo; báo giá và điều kiện hợp đồng chính xác phải được xác nhận qua liên hệ riêng."] },
      { heading: "Điều 7 (Giải quyết tranh chấp)", paragraphs: ["Tranh chấp liên quan đến Điều khoản này được điều chỉnh theo pháp luật Hàn Quốc, và tòa án có thẩm quyền là tòa án theo quy định của Luật Tố tụng Dân sự Hàn Quốc."] },
      { heading: "Phụ lục", paragraphs: [`Điều khoản này có hiệu lực từ ${formatDate(EFFECTIVE_DATE, "vi")}.`] },
    ],
    effectiveNote: `Ngày hiệu lực: ${formatDate(EFFECTIVE_DATE, "vi")}`,
    precedenceNotice: VI_PRECEDENCE,
  },
})

const BUILDERS = { ko, en, zh, vi } as const

export const getLegalDocuments = (locale: Locale) =>
  (BUILDERS[locale] ?? BUILDERS.ko)()

export const getPrivacyPolicy = (locale: Locale) => getLegalDocuments(locale).privacy
export const getTermsOfService = (locale: Locale) => getLegalDocuments(locale).terms
