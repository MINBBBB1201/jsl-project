import { test } from 'node:test'
import assert from 'node:assert/strict'
import { retryIdentity } from './contact-inquiry'
import {
  acquireInquiryRetry, completeInquiryRetry, INQUIRY_RETRY_STORAGE_KEY, INQUIRY_RETRY_TTL_MS,
  type InquiryRetryStorage,
} from './contact-inquiry-retry'

function storage(): InquiryRetryStorage {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: key => { values.delete(key) },
  }
}
const now = 1_800_000_000_000
const values = { company: '', name: 'Synthetic Person', email: 'person@example.test', subject: '', message: 'Synthetic cargo', privacyConsent: true }
const identity = retryIdentity(values, 'ko')

test('a fresh component restores the pending key after reload without extending its deadline', async () => {
  const store = storage()
  const pending = await acquireInquiryRetry(identity, null, store, now)
  const restored = await acquireInquiryRetry(identity, null, store, now + 1000)
  assert.equal(restored.key, pending.key)
  assert.equal(restored.expiresAt, pending.expiresAt)
  assert.equal(restored.completed, false)
})

test('persisted retry metadata contains no form values or consent and uses a keyed comparison hash', async () => {
  const left = storage(), right = storage()
  await acquireInquiryRetry(identity, null, left, now)
  await acquireInquiryRetry(identity, null, right, now)
  const serialized = left.getItem(INQUIRY_RETRY_STORAGE_KEY)!
  const row = JSON.parse(serialized)
  assert.deepEqual(Object.keys(row).sort(), ['expiresAt', 'identityHash', 'key', 'version'])
  for (const value of [values.name, values.email, values.message, 'privacyConsent', 'accepted']) assert(!serialized.includes(value))
  assert.match(row.identityHash, /^[a-f0-9]{64}$/)
  assert.notEqual(row.identityHash, JSON.parse(right.getItem(INQUIRY_RETRY_STORAGE_KEY)!).identityHash)
})

test('canonical whitespace and email case reuse the key, but changed content or language does not', async () => {
  const store = storage()
  const first = await acquireInquiryRetry(identity, null, store, now)
  const equivalent = retryIdentity({ ...values, name: ` ${values.name} `, email: values.email.toUpperCase() }, 'ko')
  assert.equal((await acquireInquiryRetry(equivalent, null, store, now)).key, first.key)
  const changed = await acquireInquiryRetry(retryIdentity({ ...values, message: 'Different cargo' }, 'ko'), first, store, now)
  assert.notEqual(changed.key, first.key)
  const otherLanguage = await acquireInquiryRetry(retryIdentity(values, 'en'), changed, store, now)
  assert.notEqual(otherLanguage.key, changed.key)
})

test('receipt confirmation clears persisted metadata and the next deliberate submit uses a new key', async () => {
  const store = storage()
  const pending = await acquireInquiryRetry(identity, null, store, now)
  const completed = completeInquiryRetry(pending, store)
  assert.equal(store.getItem(INQUIRY_RETRY_STORAGE_KEY), null)
  assert.equal(completed.completed, true)
  assert.notEqual((await acquireInquiryRetry(identity, completed, store, now)).key, pending.key)
})

test('clearing a receipt does not remove a newer pending request', async () => {
  const store = storage()
  const old = await acquireInquiryRetry(identity, null, store, now)
  const newer = await acquireInquiryRetry('different identity', old, store, now)
  completeInquiryRetry(old, store)
  assert.equal(JSON.parse(store.getItem(INQUIRY_RETRY_STORAGE_KEY)!).key, newer.key)
})

test('expiration rejects the old key in memory and storage', async () => {
  const store = storage()
  const pending = await acquireInquiryRetry(identity, null, store, now)
  const next = await acquireInquiryRetry(identity, pending, store, now + INQUIRY_RETRY_TTL_MS)
  assert.notEqual(next.key, pending.key)
})

test('malformed, oversized, invalid-key and excessive-future metadata is replaced safely', async () => {
  for (const invalid of ['{', 'x'.repeat(1025), JSON.stringify({ version: 1, key: '\ninvalid', identityHash: 'a'.repeat(64), expiresAt: now + 1000 }), JSON.stringify({ version: 1, key: 'valid-key-123', identityHash: 'a'.repeat(64), expiresAt: now + INQUIRY_RETRY_TTL_MS + 1 })]) {
    const store = storage()
    store.setItem(INQUIRY_RETRY_STORAGE_KEY, invalid)
    const pending = await acquireInquiryRetry(identity, null, store, now)
    assert.equal(JSON.parse(store.getItem(INQUIRY_RETRY_STORAGE_KEY)!).key, pending.key)
    assert.equal(pending.completed, false)
  }
})

test('blocked storage preserves in-memory retry and completion semantics', async () => {
  const store: InquiryRetryStorage = {
    getItem() { throw new Error('storage disabled') },
    setItem() { throw new Error('quota exceeded') },
    removeItem() { throw new Error('storage disabled') },
  }
  const pending = await acquireInquiryRetry(identity, null, store, now)
  assert.equal((await acquireInquiryRetry(identity, pending, store, now + 1)).key, pending.key)
  const completed = completeInquiryRetry(pending, store)
  assert.notEqual((await acquireInquiryRetry(identity, completed, store, now + 2)).key, pending.key)
})

test('failed deletion never revives a confirmed key in the same component', async () => {
  const store = storage()
  const pending = await acquireInquiryRetry(identity, null, store, now)
  store.removeItem = () => { throw new Error('read-only storage') }
  const completed = completeInquiryRetry(pending, store)
  assert.equal(JSON.parse(store.getItem(INQUIRY_RETRY_STORAGE_KEY)!).key, pending.key)
  assert.notEqual((await acquireInquiryRetry(identity, completed, store, now)).key, pending.key)
})

test('missing Web Crypto hashing falls back to memory without writing raw identity', async context => {
  const store = storage()
  context.mock.method(crypto.subtle, 'digest', async () => { throw new Error('digest unavailable') })
  const pending = await acquireInquiryRetry(identity, null, store, now)
  assert.equal(store.getItem(INQUIRY_RETRY_STORAGE_KEY), null)
  assert.equal((await acquireInquiryRetry(identity, pending, store, now + 1)).key, pending.key)
})
