function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

/** 기존 오류 필드를 우선하고 공통 공개 오류의 message만 추가로 읽는다. */
export function getApiErrorMessage(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback

  const firstError = Array.isArray(body.errors) ? body.errors[0] : undefined
  const legacyMessage =
    nonEmptyString(body.error) ??
    (isRecord(firstError) ? nonEmptyString(firstError.msg) : undefined)

  if (legacyMessage) return legacyMessage
  if (body.status === "fail" || body.status === "error") {
    return nonEmptyString(body.message) ?? fallback
  }
  return fallback
}
