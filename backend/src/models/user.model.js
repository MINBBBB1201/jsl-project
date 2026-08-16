const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * 내부 직원 계정.
 *
 * 이 사이트는 마케팅/조회 페이지는 공개, 포털(대시보드·데이터 변경)만 로그인
 * 뒤에 두는 구조다. 따라서 여기 저장되는 계정은 "고객 회원"이 아니라
 * JSL 내부 직원 계정이며, 가입은 공개돼 있지 않고 관리자만 발급한다.
 */

/**
 * 역할(RBAC).
 * 지금은 화면을 역할별로 나누지 않지만, 나중에 나눌 수 있도록 처음부터
 * 3종으로 구분해 둔다.
 *   admin      — 전체 권한 (계정 발급 포함)
 *   operations — 운영팀. 화물 상태/위치/체크포인트 변경 가능
 *   sales      — 영업팀. 조회만 가능 (변경 API 접근 불가)
 */
const ROLES = ['admin', 'operations', 'sales'];

/** 화물 데이터를 변경할 수 있는 역할 */
const SHIPMENT_WRITE_ROLES = ['admin', 'operations'];

const MIN_PASSWORD_LENGTH = 10;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    /**
     * bcrypt 해시.
     * select:false — 실수로 다른 조회 응답에 섞여 나가지 않도록 기본 조회에서
     * 제외한다. 로그인처럼 필요한 곳에서만 .select('+password') 로 가져온다.
     */
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      select: false
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'sales',
      required: true
    },
    /** 퇴사·정지 계정은 지우지 않고 이 값을 false 로 둔다 (토큰이 살아있어도 거부된다) */
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: Date
  },
  { timestamps: true }
);

/**
 * 저장 전 해싱.
 * 평문이 DB 에 들어가는 경로를 하나로 막기 위해 컨트롤러가 아니라 모델에서 처리한다.
 */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

/** 로그인 검증. this.password 가 로드돼 있어야 한다(.select('+password')) */
userSchema.methods.verifyPassword = function verifyPassword(plainPassword) {
  if (!this.password) {
    throw new Error('password 필드가 로드되지 않았습니다. select("+password") 가 필요합니다.');
  }
  return bcrypt.compare(plainPassword, this.password);
};

/** API 응답에 내보내도 되는 필드만 추린다 (해시·내부 필드 제외) */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES = ROLES;
module.exports.SHIPMENT_WRITE_ROLES = SHIPMENT_WRITE_ROLES;
module.exports.MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH;
