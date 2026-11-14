import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inquiryPayload, readInputRejection, readNotice, readReceipt, retryIdentity, type ContactNotice } from './contact-inquiry'
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
test('a server 400 input rejection is an input error, not an unconfirmed receipt', () => {
  // 프런트 형식 검사를 통과했지만 서버 isEmail()이 거부한 경우(예: 65자 이상 로컬 부분)
  const rejected = { success: false, code: 'VALIDATION_FAILED', errors: [{ field: 'email', code: 'INVALID_EMAIL' }] }
  assert.deepEqual(readInputRejection(400, rejected), ['email'])
  assert.deepEqual(readInputRejection(400, { ...rejected, errors: [{ field: 'consent', code: 'CONSENT_REQUIRED' }] }), ['consent'])
  assert.deepEqual(readInputRejection(400, { ...rejected, errors: [{ field: 'form', code: 'UNEXPECTED_FIELD' }] }), [])
  assert.deepEqual(readInputRejection(400, { ...rejected, errors: [{ field: 'contactName' }, { field: 'unknown' }, null] }), ['contactName'])
  assert.equal(readInputRejection(409, rejected), null)
  assert.equal(readInputRejection(400, { success: false, code: 'INVALID_JSON' }), null)
  assert.equal(readInputRejection(400, { success: false, code: 'INVALID_REQUEST_KEY' }), null)
  assert.equal(readInputRejection(400, null), null)
})
test('retry identity normalizes data but separates changed content and language', () => {
  assert.equal(retryIdentity(values, 'en'), retryIdentity({ ...values, name: 'Test', email: 'person@example.test' }, 'en'))
  assert.notEqual(retryIdentity(values, 'en'), retryIdentity(values, 'ko'))
  assert.notEqual(retryIdentity(values, 'en'), retryIdentity({ ...values, message: 'Changed' }, 'en'))
})
