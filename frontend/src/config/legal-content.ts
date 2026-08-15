/**
 * 법적 고지 문서 (개인정보처리방침 / 이용약관)
 *
 * ⚠️ 표준 템플릿을 기반으로 한 초안입니다. 법률 검토를 받지 않았습니다.
 *    실제 공개 전에 법무 검토를 거쳐야 합니다.
 *
 * 회사명·대표자·연락처는 landing-content.ts 의 company 를 참조합니다.
 * 주소/전화번호가 확정되면 그 파일 한 곳만 고치면 두 문서에 함께 반영됩니다.
 */

import { company } from "./landing-content"

/**
 * 시행일자.
 * TODO: 실제 공개(시행) 예정일이 정해지면 그 날짜로 교체하세요.
 *       법적 효력의 기준일이라 배포일과 다를 수 있습니다.
 */
export const EFFECTIVE_DATE = "2026-08-16"

export const formatKoreanDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-")
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
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
}

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "개인정보처리방침",
  description: `${company.legalName}의 개인정보 수집·이용 및 보호에 관한 방침입니다.`,
  intro: `${company.legalName}(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 회사는 본 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.`,
  sections: [
    {
      heading: "1. 수집하는 개인정보 항목",
      paragraphs: [
        "회사는 웹사이트 문의(Contact) 및 AI 챗봇 상담 기능 이용 시 아래와 같은 개인정보를 수집합니다.",
      ],
      bullets: [
        "필수항목: 회사명, 담당자명, 이메일 주소, 문의 내용",
        "수집방법: 홈페이지 문의 폼, AI 챗봇 상담",
      ],
    },
    {
      heading: "2. 개인정보의 수집 및 이용 목적",
      bullets: [
        "문의사항에 대한 답변 및 상담 서비스 제공",
        "서비스 관련 안내 및 커뮤니케이션",
      ],
    },
    {
      heading: "3. 개인정보의 보유 및 이용 기간",
      paragraphs: [
        "회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 문의 이력은 상담 품질 관리를 위해 수집일로부터 3년간 보관 후 파기합니다.",
      ],
    },
    {
      heading: "4. 개인정보의 제3자 제공",
      paragraphs: [
        "회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의하거나 법령의 규정에 의한 경우는 예외로 합니다.",
      ],
    },
    {
      heading: "5. 개인정보의 파기절차 및 방법",
      paragraphs: [
        "전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.",
      ],
    },
    {
      heading: "6. 이용자의 권리와 행사 방법",
      paragraphs: [
        "이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요청할 수 있으며, 아래 연락처로 요청하실 수 있습니다.",
      ],
      bullets: [
        `이메일: ${company.contact.email}`,
        `주소: ${company.contact.address}`,
        `전화: ${company.contact.phone}`,
      ],
    },
    {
      heading: "7. 개인정보 보호책임자",
      bullets: [
        `성명: ${company.ceo} (대표)`,
        `이메일: ${company.contact.email}`,
      ],
    },
    {
      heading: "8. 고지의 의무",
      paragraphs: [
        "본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가·삭제 및 정정이 있는 경우에는 개정 최소 7일 전부터 홈페이지를 통해 고지합니다.",
      ],
    },
  ],
  effectiveNote: `시행일자: ${formatKoreanDate(EFFECTIVE_DATE)}`,
}

export const termsOfService: LegalDocument = {
  slug: "terms",
  title: "이용약관",
  description: `${company.legalName} 웹사이트 및 관련 서비스의 이용조건과 절차를 규정합니다.`,
  sections: [
    {
      heading: "제1조 (목적)",
      paragraphs: [
        `본 약관은 ${company.legalName}(이하 "회사")가 제공하는 웹사이트 및 관련 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
      ],
    },
    {
      heading: "제2조 (정의)",
      paragraphs: [
        `"이용자"란 회사의 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 자를 말합니다.`,
      ],
    },
    {
      heading: "제3조 (약관의 효력 및 변경)",
      paragraphs: [
        "본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있습니다.",
      ],
    },
    {
      heading: "제4조 (서비스의 제공)",
      paragraphs: [
        "회사는 물류 서비스 소개, 문의 접수, AI 기반 상담 챗봇 등의 서비스를 제공합니다.",
      ],
    },
    {
      heading: "제5조 (이용자의 의무)",
      paragraphs: [
        "이용자는 서비스 이용 시 관련 법령과 본 약관을 준수해야 하며, 허위 정보 등록, 회사의 지적재산권 침해 등의 행위를 해서는 안 됩니다.",
      ],
    },
    {
      heading: "제6조 (면책조항)",
      paragraphs: [
        "회사는 천재지변, 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다. AI 챗봇 상담 내용은 참고용 정보이며, 정확한 견적 및 계약 조건은 별도 문의를 통해 확인해야 합니다.",
      ],
    },
    {
      heading: "제7조 (분쟁해결)",
      paragraphs: [
        "본 약관과 관련한 분쟁은 대한민국 법령에 따르며, 관할 법원은 민사소송법상의 관할 법원으로 합니다.",
      ],
    },
    {
      heading: "부칙",
      paragraphs: [
        `본 약관은 ${formatKoreanDate(EFFECTIVE_DATE)}부터 시행합니다.`,
      ],
    },
  ],
  effectiveNote: `시행일자: ${formatKoreanDate(EFFECTIVE_DATE)}`,
}

export const legalDocuments = [privacyPolicy, termsOfService]
