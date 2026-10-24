// Only retry metadata is persisted. Form values and consent stay in memory.
export const INQUIRY_RETRY_STORAGE_KEY = 'jsl.contact.retry.v1'
export const INQUIRY_RETRY_TTL_MS = 30 * 60 * 1000

export interface InquiryRetryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface InquiryRetry {
  identity: string
  key: string
  expiresAt: number
  completed: boolean
}

interface StoredRetry {
  version: 1
  key: string
  identityHash: string
  expiresAt: number
}

export function inquiryRetryStorage(): InquiryRetryStorage | null {
  try {
    return (globalThis as typeof globalThis & { sessionStorage?: InquiryRetryStorage }).sessionStorage ?? null
  } catch {
    return null
  }
}

function removeStored(storage: InquiryRetryStorage | null) {
  try { storage?.removeItem(INQUIRY_RETRY_STORAGE_KEY) } catch { /* Storage may be disabled. */ }
}

function readStored(storage: InquiryRetryStorage | null, now: number): StoredRetry | null {
  try {
    const value = storage?.getItem(INQUIRY_RETRY_STORAGE_KEY)
    if (!value) return null
    const row = value.length <= 1024 ? JSON.parse(value) : null
    if (row?.version === 1 && typeof row.key === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(row.key)
      && typeof row.identityHash === 'string' && /^[a-f0-9]{64}$/.test(row.identityHash)
      && Number.isSafeInteger(row.expiresAt) && row.expiresAt > now
      && row.expiresAt - now <= INQUIRY_RETRY_TTL_MS) return row as StoredRetry
  } catch { /* Ignore malformed or inaccessible metadata. */ }
  removeStored(storage)
  return null
}

async function identityHash(identity: string, key: string): Promise<string> {
  // The random request key salts the comparison hash; this is not encryption.
  const bytes = new TextEncoder().encode(`${key}\0${identity}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function acquireInquiryRetry(
  identity: string,
  current: InquiryRetry | null,
  storage: InquiryRetryStorage | null,
  now = Date.now(),
): Promise<InquiryRetry> {
  if (current && !current.completed && current.identity === identity && current.expiresAt > now) return current

  const stored = readStored(storage, now)
  if (stored && !(current?.completed && current.key === stored.key)) {
    try {
      if (await identityHash(identity, stored.key) === stored.identityHash) {
        return { identity, key: stored.key, expiresAt: stored.expiresAt, completed: false }
      }
    } catch { /* Web Crypto unavailable: retain in-memory retry protection. */ }
  }

  const retry = { identity, key: crypto.randomUUID(), expiresAt: now + INQUIRY_RETRY_TTL_MS, completed: false }
  if (storage) {
    try {
      const persisted: StoredRetry = {
        version: 1, key: retry.key, identityHash: await identityHash(identity, retry.key), expiresAt: retry.expiresAt,
      }
      storage.setItem(INQUIRY_RETRY_STORAGE_KEY, JSON.stringify(persisted))
    } catch { /* Do not block a submission when storage or hashing is unavailable. */ }
  }
  return retry
}

export function completeInquiryRetry(retry: InquiryRetry, storage: InquiryRetryStorage | null): InquiryRetry {
  try {
    const value = storage?.getItem(INQUIRY_RETRY_STORAGE_KEY)
    if (value && value.length <= 1024 && JSON.parse(value)?.key === retry.key) removeStored(storage)
  } catch { /* Remember completion in memory even if storage cannot be cleared. */ }
  return { ...retry, completed: true }
}
