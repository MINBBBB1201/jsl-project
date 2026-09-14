/**
 * 무역서류 API (Phase 2a — 백엔드).
 *
 * 다루는 것: draft 생성 → 편집 → 발행(번호 부여) → 개정 체인 → 삭제,
 * 그리고 인증·상태 가드. PDF·화면은 이 단계 범위 밖(클라이언트에서 처리).
 */
const request = require('supertest');

const db = require('./helpers/db');
const { buildApp } = require('./helpers/app');
const { createUser, createShipment } = require('./helpers/factories');

const app = buildApp();
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const sampleInput = (over = {}) => ({
  invoiceDate: '2026-09-10',
  referenceNo: 'JSL-TEST-00001',
  shipper: { companyName: 'ACME Export', address: 'Seoul', contact: '', taxId: '' },
  consignee: { companyName: 'Rhein Handel', address: 'Hamburg', contact: '', taxId: '' },
  countryOfOrigin: 'KR',
  countryOfDestination: 'DE',
  shipMode: 'SEA',
  incoterm: 'FOB',
  paymentTerm: 'T/T',
  currency: 'USD',
  items: [{ description: 'Widgets', quantity: 10, unit: 'CTN', unitPrice: 25, packages: 10 }],
  ...over,
});

const newDraft = async (token, body = {}) =>
  request(app)
    .post('/api/trade-documents')
    .set(auth(token))
    .send({ type: 'commercial_invoice', input: sampleInput(), ...body });

beforeAll(async () => {
  await db.connect();
});
afterEach(async () => {
  await db.clear();
});
afterAll(async () => {
  await db.disconnect();
});

describe('auth', () => {
  test('토큰 없이는 목록도 생성도 403', async () => {
    expect((await request(app).get('/api/trade-documents')).status).toBe(403);
    expect(
      (await request(app).post('/api/trade-documents').send({ type: 'commercial_invoice', input: sampleInput() }))
        .status
    ).toBe(403);
  });
});

describe('POST /api/trade-documents — draft 생성', () => {
  test('201, draft 상태 / 번호 없음 / version 1 / 체인 루트는 자기 자신', async () => {
    const { token } = await createUser();
    const res = await newDraft(token);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'commercial_invoice',
      status: 'draft',
      documentNo: null,
      version: 1,
    });
    expect(res.body.data.revisionRootId).toBe(res.body.data.id);
    // input.invoiceNo 는 documentNo 를 따라간다 (아직 없으므로 빈 문자열)
    expect(res.body.data.input.invoiceNo).toBe('');
  });

  test('알 수 없는 type 은 400', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post('/api/trade-documents')
      .set(auth(token))
      .send({ type: 'bill_of_lading', input: sampleInput() });
    expect(res.status).toBe(400);
  });

  test('존재하지 않는 shipmentId 는 404', async () => {
    const { token } = await createUser();
    const res = await newDraft(token, { shipmentId: '64b7f9b2c1a2b3d4e5f60718' });
    expect(res.status).toBe(404);
  });

  test('유효한 shipmentId 는 연결된다', async () => {
    const { token } = await createUser();
    const shipment = await createShipment();
    const res = await newDraft(token, { shipmentId: shipment._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body.data.shipmentId).toBe(shipment._id.toString());
  });

  test('숫자 필드에 빈 문자열/문자열이 와도 Number·null 로 정규화된다', async () => {
    const { token } = await createUser();
    const res = await newDraft(token, {
      input: sampleInput({
        items: [
          { description: 'A', quantity: '5', unitPrice: '12.5', netWeightKg: '', packages: '3' },
        ],
      }),
    });
    const item = res.body.data.input.items[0];
    expect(item.quantity).toBe(5);
    expect(item.unitPrice).toBe(12.5);
    expect(item.packages).toBe(3);
    expect(item.netWeightKg).toBeNull();
  });
});

describe('GET — 목록 / 단건', () => {
  test('목록은 체인당 최신 버전만, 필터가 먹는다', async () => {
    const { token } = await createUser();
    await newDraft(token);
    await request(app)
      .post('/api/trade-documents')
      .set(auth(token))
      .send({ type: 'packing_list', input: sampleInput() });

    const all = await request(app).get('/api/trade-documents').set(auth(token));
    expect(all.body.total).toBe(2);

    const onlyPl = await request(app).get('/api/trade-documents?type=packing_list').set(auth(token));
    expect(onlyPl.body.total).toBe(1);
    expect(onlyPl.body.data[0].type).toBe('packing_list');
  });

  test('mine=1 은 내가 만든 것만', async () => {
    const a = await createUser({ email: 'a@jsl-test.local' });
    const b = await createUser({ email: 'b@jsl-test.local' });
    await newDraft(a.token);
    await newDraft(b.token);

    const mine = await request(app).get('/api/trade-documents?mine=1').set(auth(a.token));
    expect(mine.body.total).toBe(1);
  });

  test('단건은 versions 체인 요약을 함께 준다', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    const res = await request(app)
      .get(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.versions).toHaveLength(1);
    expect(res.body.versions[0]).toMatchObject({ version: 1, status: 'draft' });
  });
});

describe('PATCH — draft 편집', () => {
  test('draft 는 input 을 바꿀 수 있다', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    const res = await request(app)
      .patch(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(token))
      .send({ input: sampleInput({ currency: 'EUR' }) });
    expect(res.status).toBe(200);
    expect(res.body.data.input.currency).toBe('EUR');
  });

  test('issued 서류는 409', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    await request(app).post(`/api/trade-documents/${created.body.data.id}/issue`).set(auth(token));

    const res = await request(app)
      .patch(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(token))
      .send({ input: sampleInput({ currency: 'EUR' }) });
    expect(res.status).toBe(409);
  });
});

describe('POST /:id/issue — 발행', () => {
  test('draft → issued, 번호가 CI-<year>-0001 로 붙는다', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    const res = await request(app)
      .post(`/api/trade-documents/${created.body.data.id}/issue`)
      .set(auth(token));

    expect(res.status).toBe(200);
    const year = new Date().getFullYear();
    expect(res.body.data.status).toBe('issued');
    expect(res.body.data.documentNo).toBe(`CI-${year}-0001`);
    expect(res.body.data.issuedAt).toBeTruthy();
    expect(res.body.data.input.invoiceNo).toBe(`CI-${year}-0001`);
  });

  test('같은 종류는 시퀀스가 이어지고, 종류가 다르면 따로 센다', async () => {
    const { token } = await createUser();
    const year = new Date().getFullYear();

    const ci1 = await newDraft(token);
    await request(app).post(`/api/trade-documents/${ci1.body.data.id}/issue`).set(auth(token));
    const ci2 = await newDraft(token);
    const ci2Issued = await request(app)
      .post(`/api/trade-documents/${ci2.body.data.id}/issue`)
      .set(auth(token));
    expect(ci2Issued.body.data.documentNo).toBe(`CI-${year}-0002`);

    const pl = await request(app)
      .post('/api/trade-documents')
      .set(auth(token))
      .send({ type: 'packing_list', input: sampleInput() });
    const plIssued = await request(app)
      .post(`/api/trade-documents/${pl.body.data.id}/issue`)
      .set(auth(token));
    expect(plIssued.body.data.documentNo).toBe(`PL-${year}-0001`);
  });

  test('이미 발행된 서류를 또 발행하면 409', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    await request(app).post(`/api/trade-documents/${created.body.data.id}/issue`).set(auth(token));
    const again = await request(app)
      .post(`/api/trade-documents/${created.body.data.id}/issue`)
      .set(auth(token));
    expect(again.status).toBe(409);
  });

  test('동시에 두 번 발행해도 정확히 한 번만 성공하고 번호가 안 겹친다', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);

    const [a, b] = await Promise.all([
      request(app).post(`/api/trade-documents/${created.body.data.id}/issue`).set(auth(token)),
      request(app).post(`/api/trade-documents/${created.body.data.id}/issue`).set(auth(token)),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const final = await request(app)
      .get(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(token));
    expect(final.body.data.status).toBe('issued');
    // 진 쪽이 만든 번호가 조용히 최종 상태를 덮어쓰지 않았는지 확인
    const winner = a.status === 200 ? a : b;
    expect(final.body.data.documentNo).toBe(winner.body.data.documentNo);
  });
});

describe('개정본 체인', () => {
  const issueFresh = async (token) => {
    const created = await newDraft(token);
    const issued = await request(app)
      .post(`/api/trade-documents/${created.body.data.id}/issue`)
      .set(auth(token));
    return issued.body.data;
  };

  test('revise 는 input 을 복사한 version 2 draft 를 만든다', async () => {
    const { token } = await createUser();
    const v1 = await issueFresh(token);

    const res = await request(app)
      .post(`/api/trade-documents/${v1.id}/revise`)
      .set(auth(token));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'draft',
      version: 2,
      documentNo: null,
      previousVersionId: v1.id,
      revisionRootId: v1.revisionRootId,
    });
    expect(res.body.data.input.items[0].description).toBe('Widgets');
  });

  test('발행 안 된 서류는 revise 불가(409), 열린 draft 가 있어도 409', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    expect(
      (await request(app).post(`/api/trade-documents/${created.body.data.id}/revise`).set(auth(token)))
        .status
    ).toBe(409);

    const v1 = await issueFresh(token);
    await request(app).post(`/api/trade-documents/${v1.id}/revise`).set(auth(token));
    const twice = await request(app).post(`/api/trade-documents/${v1.id}/revise`).set(auth(token));
    expect(twice.status).toBe(409);
  });

  test('동시에 두 번 개정해도 정확히 한 draft 만 만들어진다 ({revisionRootId,version} unique 가 최종 방어선)', async () => {
    const { token } = await createUser();
    const v1 = await issueFresh(token);

    const [a, b] = await Promise.all([
      request(app).post(`/api/trade-documents/${v1.id}/revise`).set(auth(token)),
      request(app).post(`/api/trade-documents/${v1.id}/revise`).set(auth(token)),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);

    const list = await request(app).get('/api/trade-documents?allVersions=1').set(auth(token));
    const v2s = list.body.data.filter((d) => d.revisionRootId === v1.revisionRootId && d.version === 2);
    expect(v2s).toHaveLength(1);
  });

  test('개정본을 발행하면 root 번호를 물려받고 이전 버전은 superseded 로 넘어간다', async () => {
    const { token } = await createUser();
    const year = new Date().getFullYear();
    const v1 = await issueFresh(token);

    const v2Draft = await request(app)
      .post(`/api/trade-documents/${v1.id}/revise`)
      .set(auth(token));
    const v2 = await request(app)
      .post(`/api/trade-documents/${v2Draft.body.data.id}/issue`)
      .set(auth(token));

    expect(v2.body.data.documentNo).toBe(`CI-${year}-0001`); // v1 과 같은 번호
    expect(v2.body.data.status).toBe('issued');

    const v1After = await request(app).get(`/api/trade-documents/${v1.id}`).set(auth(token));
    expect(v1After.body.data.status).toBe('superseded');
    expect(v1After.body.data.supersededById).toBe(v2.body.data.id);

    // 목록은 체인당 최신(v2)만
    const list = await request(app).get('/api/trade-documents').set(auth(token));
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].version).toBe(2);

    // allVersions=1 이면 둘 다
    const full = await request(app).get('/api/trade-documents?allVersions=1').set(auth(token));
    expect(full.body.total).toBe(2);
  });
});

describe('DELETE', () => {
  test('draft 는 작성자가 지울 수 있다', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    const res = await request(app)
      .delete(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(
      (await request(app).get(`/api/trade-documents/${created.body.data.id}`).set(auth(token))).status
    ).toBe(404);
  });

  test('issued 서류는 삭제 불가(409)', async () => {
    const { token } = await createUser();
    const created = await newDraft(token);
    await request(app).post(`/api/trade-documents/${created.body.data.id}/issue`).set(auth(token));
    const res = await request(app)
      .delete(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(token));
    expect(res.status).toBe(409);
  });

  test('남의 draft 는 admin 이 아니면 403', async () => {
    const a = await createUser({ email: 'owner@jsl-test.local' });
    const b = await createUser({ email: 'other@jsl-test.local', role: 'operations' });
    const created = await newDraft(a.token);

    const forbidden = await request(app)
      .delete(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(b.token));
    expect(forbidden.status).toBe(403);

    const admin = await createUser({ email: 'admin@jsl-test.local', role: 'admin' });
    const ok = await request(app)
      .delete(`/api/trade-documents/${created.body.data.id}`)
      .set(auth(admin.token));
    expect(ok.status).toBe(200);
  });
});
