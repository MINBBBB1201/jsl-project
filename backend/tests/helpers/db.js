/**
 * 테스트용 인메모리 MongoDB.
 *
 * mongodb-memory-server 가 프로세스 안에서 진짜 mongod 를 띄우고, mongoose 의
 * 기본 연결을 거기에 붙인다. 모델(Shipment, User …)은 기본 연결을 쓰므로
 * connect() 한 뒤에는 소스 코드를 그대로 호출해도 이 인스턴스에 읽고 쓴다.
 *
 * 첫 실행 때 mongod 바이너리를 내려받는다(캐시됨). CI/오프라인에서 막히면
 * MONGOMS_DOWNLOAD_URL 또는 시스템 mongod(MONGOMS_SYSTEM_BINARY) 로 우회.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // unique/partial 인덱스는 첫 insert 전에 만들어져 있어야 한다
  // (autoIndex 빌드가 늦으면 중복 검증이 그냥 통과해 버린다).
  await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
}

/** 컬렉션만 비운다 — 인덱스는 유지해서 unique 제약도 계속 검증되게 한다. */
async function clear() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function disconnect() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

module.exports = { connect, clear, disconnect };
