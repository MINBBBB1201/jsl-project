/**
 * 관리자 계정 시드 스크립트
 *
 * 실행: npm run seed:admin
 *      npm run seed:admin -- --reset-password   (이미 있으면 비밀번호 재발급)
 *      SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed:admin
 *
 * ############################################################################
 * # 비밀번호는 파일에 저장하지 않습니다.                                       #
 * #                                                                          #
 * # SEED_ADMIN_PASSWORD 를 주지 않으면 무작위로 생성해 실행 시 콘솔에 한 번만  #
 * # 출력합니다. 그 값을 비밀번호 관리자에 옮겨 두고, 첫 로그인 뒤에는          #
 * # 관리자 계정으로 새 계정을 발급해 쓰세요.                                   #
 * ############################################################################
 */

// ⚠️ mongoose 보다 먼저 — server.js 와 같은 이유 (config/dns.js 주석 참고)
require('../config/dns');

const crypto = require('crypto');
const { connectDB, closeDB } = require('../config/database');
const User = require('../models/user.model');

const DEFAULT_EMAIL = 'admin@jsl-logis.com';
const DEFAULT_NAME = 'JSL 관리자';

const args = process.argv.slice(2);
const resetPassword = args.includes('--reset-password');

/**
 * 사람이 옮겨 적을 수 있으면서 추측하기 어려운 비밀번호를 만든다.
 * base64url 은 O/0, l/I 처럼 헷갈리는 글자가 섞이지만, 콘솔에서 복사해
 * 붙여넣는 용도라 문제되지 않는다.
 */
const generatePassword = () => crypto.randomBytes(18).toString('base64url');

const run = async () => {
  const email = (process.env.SEED_ADMIN_EMAIL || DEFAULT_EMAIL).toLowerCase().trim();
  const providedPassword = process.env.SEED_ADMIN_PASSWORD;
  const password = providedPassword || generatePassword();

  await connectDB();

  const existing = await User.findOne({ email });

  if (existing && !resetPassword) {
    console.log(`\n이미 존재하는 계정입니다: ${email} (role: ${existing.role})`);
    console.log('비밀번호를 새로 발급하려면: npm run seed:admin -- --reset-password\n');
    await closeDB();
    return;
  }

  if (existing) {
    existing.password = password; // pre-save 훅에서 해싱된다
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
  } else {
    await User.create({
      email,
      password,
      name: process.env.SEED_ADMIN_NAME || DEFAULT_NAME,
      role: 'admin'
    });
  }

  console.log('\n────────────────────────────────────────────────');
  console.log(existing ? ' 관리자 비밀번호 재발급 완료' : ' 관리자 계정 생성 완료');
  console.log('────────────────────────────────────────────────');
  console.log(` 이메일   : ${email}`);
  if (providedPassword) {
    console.log(' 비밀번호 : (SEED_ADMIN_PASSWORD 로 지정한 값)');
  } else {
    console.log(` 비밀번호 : ${password}`);
    console.log('\n ⚠️ 이 비밀번호는 여기서만 출력됩니다. 지금 옮겨 적어 두세요.');
  }
  console.log(' 로그인   : /sign-in');
  console.log('────────────────────────────────────────────────\n');

  await closeDB();
};

run().catch(async (error) => {
  console.error('시드 실패:', error.message);
  await closeDB().catch(() => {});
  process.exit(1);
});
