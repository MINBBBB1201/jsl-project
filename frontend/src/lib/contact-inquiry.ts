export type InquiryLanguage = "ko" | "en" | "zh" | "vi"
export type InquiryField = "companyName" | "contactName" | "email" | "subject" | "message"
export interface ContactNotice {
  noticeId: string
  noticeHash: string
  language: InquiryLanguage
  effectiveDate: string
  purpose: string
  items: InquiryField[]
  retentionDescription: string
  refusalConsequence: string
  privacyContact: string
}
export interface InquiryValues { company: string; name: string; email: string; subject: string; message: string; privacyConsent: boolean }
export interface InquiryReceipt { id: string; createdAt: string; status: "received"; replayed: boolean }
const fields: InquiryField[] = ["companyName", "contactName", "email", "subject", "message"]

export function readNotice(value: unknown, language: InquiryLanguage): ContactNotice | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  if (row.language !== language || typeof row.noticeHash !== "string" || !/^[a-f0-9]{64}$/.test(row.noticeHash)
    || !["noticeId", "effectiveDate", "purpose", "retentionDescription", "refusalConsequence", "privacyContact"].every(k => typeof row[k] === "string" && String(row[k]).trim())
    || !Array.isArray(row.items) || row.items.some(k => !fields.includes(k)) || new Set(row.items).size !== row.items.length
    || !["contactName", "email", "message"].every(k => row.items instanceof Array && row.items.includes(k))) return null
  return row as unknown as ContactNotice
}

export function inquiryPayload(values: InquiryValues, notice: ContactNotice) {
  return {
    ...(notice.items.includes('companyName') && values.company.trim() ? { companyName: values.company.trim() } : {}),
    contactName: values.name.trim(), email: values.email.trim().toLowerCase(),
    ...(notice.items.includes('subject') && values.subject.trim() ? { subject: values.subject.trim() } : {}), message: values.message.trim(),
    consent: { accepted: values.privacyConsent, noticeId: notice.noticeId, noticeHash: notice.noticeHash, language: notice.language },
  }
}

export function retryIdentity(values: InquiryValues, language: InquiryLanguage) {
  return JSON.stringify({ company: values.company.trim(), name: values.name.trim(), email: values.email.trim().toLowerCase(),
    subject: values.subject.trim(), message: values.message.trim(), language })
}

export function readReceipt(value: unknown): InquiryReceipt | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>; const data = row.data as Record<string, unknown> | undefined
  if (row.success !== true || typeof row.replayed !== "boolean" || !data || typeof data.id !== "string" || !data.id.trim()
    || typeof data.createdAt !== "string" || !Number.isFinite(Date.parse(data.createdAt)) || data.status !== "received") return null
  return { id: data.id, createdAt: data.createdAt, status: "received", replayed: row.replayed }
}
