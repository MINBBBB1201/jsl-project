const User = require('../models/user.model');
const logger = require('../utils/logger');
const { signToken, jwtExpiresIn } = require('../utils/jwt');

/**
 * 로그인.
 *
 * 이메일이 없는 경우와 비밀번호가 틀린 경우의 응답을 똑같이 맞춘다.
 * 응답이 다르면 "이 이메일은 존재한다"는 정보가 새어 나가 계정 목록을
 * 수집하는 데 쓰일 수 있다.
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
      .select('+password');

    const passwordMatches = user ? await user.verifyPassword(password) : false;

    if (!user || !passwordMatches || !user.isActive) {
      logger.warn(`로그인 실패: ${email}`);
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 마지막 로그인 시각만 갱신한다. save() 를 쓰면 pre-save 훅이 이미 해시된
    // 비밀번호를 다시 해싱하므로 updateOne 을 쓴다.
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    const token = signToken(user);
    logger.info(`로그인 성공: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      data: {
        token,
        expiresIn: jwtExpiresIn,
        user: user.toSafeJSON()
      }
    });
  } catch (error) {
    logger.error('로그인 처리 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};

/** 현재 로그인한 사용자 정보. 프론트가 토큰 유효성을 확인하는 용도로도 쓴다. */
exports.me = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

/**
 * 계정 발급 (admin 전용).
 *
 * 내부 직원용 포털이라 공개 회원가입을 두지 않는다. 누구나 계정을 만들 수 있으면
 * 로그인 게이트를 세운 의미가 없다.
 */
exports.register = async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await User.exists({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: '이미 등록된 이메일입니다.'
      });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      name,
      role: role || 'sales'
    });

    logger.info(`계정 발급: ${user.email} (${user.role}) by ${req.user.email}`);

    res.status(201).json({ success: true, data: { user: user.toSafeJSON() } });
  } catch (error) {
    logger.error('계정 발급 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '계정 발급 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};

/**
 * 로그아웃.
 *
 * JWT 는 서버에 상태가 없어 실제 무효화는 클라이언트가 토큰을 버리는 것으로 끝난다.
 * 프론트가 호출 지점을 하나로 유지할 수 있도록 엔드포인트만 열어 둔다.
 * (즉시 무효화가 필요해지면 여기서 토큰 블랙리스트를 붙이면 된다.)
 */
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, data: { message: '로그아웃되었습니다.' } });
};
