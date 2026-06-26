'use strict';

const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const partnerModel = require('../models/partnerModel');

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
