'use strict';

const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const partnerModel = require('../models/partnerModel');
const {
  validatePasswordPolicy,
  isPasswordExpired,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} = require('../utils/passwordPolicy');

const authController = {
  loginPage(req, res) {
    if (req.session.user) return res.redirect('/home');
    res.render('auth/login', { layout: false, error: null, success: null });
  },

  async login(req, res) {
    const username = req.body.username || req.body.partner_code;
    const { password } = req.body;
    if (!username || !password) {
      return res.render('auth/login', {
        layout: false,
        error: '아이디와 비밀번호를 입력해주세요.',
        success: null,
      });
    }
    try {
      const user = await userModel.findByUsername(username);
      if (!user) {
        return res.render('auth/login', {
          layout: false,
          error: '계정 정보가 올바르지 않습니다.',
          success: null,
        });
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.render('auth/login', {
          layout: false,
          error: '계정 정보가 올바르지 않습니다.',
          success: null,
        });
      }
      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
        partnerId: user.partner_id,
        username: user.username,
        passwordChangedAt: user.password_changed_at,
        mustChangePassword: user.must_change_password,
      };
      res.redirect('/home');
    } catch (err) {
      console.error(err);
      res.render('auth/login', { layout: false, error: '서버 오류가 발생했습니다.', success: null });
    }
  },

  logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  },

  changePasswordPage(req, res) {
    if (!req.session.user) return res.redirect('/auth/login');
    res.render('auth/changePassword', {
      layout: false,
      error: null,
      success: null,
      forced: req.session.user.mustChangePassword || req.query.forced === '1',
      expired: isPasswordExpired(req.session.user.passwordChangedAt),
      username: req.session.user.username || '',
      passwordMinLength: PASSWORD_MIN_LENGTH,
      passwordMaxLength: PASSWORD_MAX_LENGTH,
    });
  },

  async changePassword(req, res) {
    if (!req.session.user) return res.redirect('/auth/login');
    const { current_password, new_password, new_password_confirm } = req.body;
    const sessionUser = req.session.user;

    const renderError = (message) =>
      res.render('auth/changePassword', {
        layout: false,
        error: message,
        success: null,
        forced: sessionUser.mustChangePassword,
        expired: isPasswordExpired(sessionUser.passwordChangedAt),
        username: sessionUser.username || '',
        passwordMinLength: PASSWORD_MIN_LENGTH,
        passwordMaxLength: PASSWORD_MAX_LENGTH,
      });

    if (!current_password || !new_password || !new_password_confirm) {
      return renderError('모든 항목을 입력해주세요.');
    }
    if (new_password !== new_password_confirm) {
      return renderError('새 비밀번호가 일치하지 않습니다.');
    }

    try {
      const user = await userModel.findById(sessionUser.id);
      if (!user) return renderError('계정 정보를 확인할 수 없습니다.');

      const currentMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!currentMatch) return renderError('현재 비밀번호가 올바르지 않습니다.');

      const policy = validatePasswordPolicy(new_password, { username: user.username });
      // 어떤 조건을 못 채웠는지 항목별로 보여주기 위해 문자열로 합치지 않고 배열째 넘긴다.
      if (!policy.valid) return renderError(policy.errors);

      const sameAsCurrent = await bcrypt.compare(new_password, user.password_hash);
      if (sameAsCurrent) return renderError('현재 비밀번호와 다른 비밀번호를 사용해주세요.');

      const newHash = await bcrypt.hash(new_password, 10);
      const updated = await userModel.updatePassword(user.id, newHash);

      req.session.user.passwordChangedAt = updated.password_changed_at;
      req.session.user.mustChangePassword = false;

      res.redirect('/home');
    } catch (err) {
      console.error(err);
      renderError('서버 오류가 발생했습니다.');
    }
  },

  applyPage(req, res) {
    res.render('auth/login', { layout: false, error: null, success: null });
  },

  async apply(req, res) {
    const { company_name, manager_name, email, phone, purpose } = req.body;
    try {
      await partnerModel.create({ companyName: company_name, managerName: manager_name, email, phone, purpose });
      res.render('auth/login', {
        layout: false,
        error: null,
        success: '파트너사 코드 신청이 접수되었습니다. 담당자 검토 후 이메일로 안내드립니다.',
      });
    } catch (err) {
      console.error(err);
      res.render('auth/login', { layout: false, error: '신청 처리 중 오류가 발생했습니다.', success: null });
    }
  },
};

module.exports = authController;
