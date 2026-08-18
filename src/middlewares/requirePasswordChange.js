'use strict';

const { isPasswordExpired } = require('../utils/passwordPolicy');

// 로그인 상태에서 비밀번호 변경 주기(1년) 초과 또는 강제 변경 플래그(must_change_password)가
// 켜진 계정을 /auth/change-password로 유도한다. /auth/* 요청(로그인·로그아웃·변경 페이지 자체)은
// 무한 리다이렉트를 막기 위해 제외한다.
function requirePasswordChange(req, res, next) {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) return next();
  if (req.path.startsWith('/auth')) return next();

  const expired = isPasswordExpired(sessionUser.passwordChangedAt);
  if (sessionUser.mustChangePassword || expired) {
    return res.redirect(`/auth/change-password?${sessionUser.mustChangePassword ? 'forced' : 'expired'}=1`);
  }
  next();
}

module.exports = requirePasswordChange;
