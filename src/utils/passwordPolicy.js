'use strict';

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 64;
const PASSWORD_MAX_AGE_DAYS = 365; // 비밀번호 변경 주기(1년)

const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const DIGIT_RE = /[0-9]/;
const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;
const WHITESPACE_RE = /\s/;

function hasRepeatingChars(password, maxRun = 3) {
  let run = 1;
  for (let i = 1; i < password.length; i += 1) {
    run = password[i] === password[i - 1] ? run + 1 : 1;
    if (run >= maxRun) return true;
  }
  return false;
}

// 보안 정책: 10~64자, 대/소문자·숫자·특수문자 각 1자 이상, 공백/아이디 포함/3연속 동일문자 금지.
function validatePasswordPolicy(password, { username } = {}) {
  const errors = [];

  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, errors: ['비밀번호를 입력해주세요.'] };
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`비밀번호는 ${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자여야 합니다.`);
  }
  if (WHITESPACE_RE.test(password)) {
    errors.push('비밀번호에 공백을 포함할 수 없습니다.');
  }
  if (!UPPERCASE_RE.test(password)) errors.push('영문 대문자를 1자 이상 포함해야 합니다.');
  if (!LOWERCASE_RE.test(password)) errors.push('영문 소문자를 1자 이상 포함해야 합니다.');
  if (!DIGIT_RE.test(password)) errors.push('숫자를 1자 이상 포함해야 합니다.');
  if (!SPECIAL_RE.test(password)) errors.push('특수문자를 1자 이상 포함해야 합니다.');
  if (hasRepeatingChars(password)) {
    errors.push('동일한 문자를 3회 이상 연속으로 사용할 수 없습니다.');
  }
  if (username && password.toLowerCase().includes(String(username).toLowerCase())) {
    errors.push('비밀번호에 아이디(파트너사 코드)를 포함할 수 없습니다.');
  }

  return { valid: errors.length === 0, errors };
}

// passwordChangedAt이 없으면(세션 갱신 전 등) 판단 불가로 보고 만료 처리하지 않는다.
function isPasswordExpired(passwordChangedAt, maxAgeDays = PASSWORD_MAX_AGE_DAYS) {
  if (!passwordChangedAt) return false;
  const changedAt = new Date(passwordChangedAt);
  if (Number.isNaN(changedAt.getTime())) return false;
  return Date.now() - changedAt.getTime() > maxAgeDays * 24 * 60 * 60 * 1000;
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MAX_AGE_DAYS,
  validatePasswordPolicy,
  isPasswordExpired,
};
