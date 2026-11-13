import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inquiryPayload, readNotice, readReceipt, retryIdentity, type ContactNotice } from './contact-inquiry'
const notice: ContactNotice = { noticeId: 'synthetic-v1', noticeHash: 'a'.repeat(64), language: 'en', effectiveDate: '2026-10-13', purpose: 'Synthetic test', items: ['contactName', 'email', 'message'], retentionDescription: 'Synthetic only', refusalConsequence: 'No synthetic request', privacyContact: 'Test only' }
const values = { company: 'Undisclosed company', name: ' Test ', email: ' PERSON@EXAMPLE.TEST ', subject: 'Undisclosed subject', message: ' Test cargo ', privacyConsent: true }
test('the public notice must match the requested language and known unique fields', () => {
  assert(readNotice(notice, 'en'))
  assert.equal(readNotice(notice, 'ko'), null)
  assert.equal(readNotice({ ...notice, items: [...notice.items, 'email'] }, 'en'), null)
  assert.equal(readNotice({ ...notice, noticeHash: 'invalid' }, 'en'), null)
  assert.equal(readNotice({ ...notice, items: ['email'] }, 'en'), null)
})
test('only disclosed data and current explicit consent are sent', () => {
  const body = inquiryPayload(values, notice)
  assert(!Object.prototype.hasOwnProperty.call(body, 'companyName'))
  assert(!Object.prototype.hasOwnProperty.call(body, 'subject'))
  assert.equal(body.contactName, 'Test')
  assert.equal(body.email, 'person@example.test')
  assert.equal(body.consent.accepted, true)
  assert.equal(body.consent.noticeHash, notice.noticeHash)
})
test('receipt confirmation requires success, valid metadata and omits personal data', () => {
  const result = { success: true, replayed: false, data: { id: 'synthetic-receipt', status: 'received', createdAt: '2026-10-13T00:00:00Z', email: 'private@example.test' } }
  assert.deepEqual(Object.keys(readReceipt(result)!).sort(), ['createdAt', 'id', 'replayed', 'status'])
  assert.equal(readReceipt({ ...result, success: false }), null)
  assert.equal(readReceipt({ ...result, data: { ...result.data, createdAt: 'invalid' } }), null)
})
test('retry identity normalizes data but separates changed content and language', () => {
  assert.equal(retryIdentity(values, 'en'), retryIdentity({ ...values, name: 'Test', email: 'person@example.test' }, 'en'))
  assert.notEqual(retryIdentity(values, 'en'), retryIdentity(values, 'ko'))
  assert.notEqual(retryIdentity(values, 'en'), retryIdentity({ ...values, message: 'Changed' }, 'en'))
})
