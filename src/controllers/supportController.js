'use strict';

const noticeModel = require('../models/noticeModel');
const inquiryModel = require('../models/inquiryModel');
const partnerFirewallApplyModel = require('../models/partnerFirewallApplyModel');

const supportController = {
  async index(req, res) {
    try {
      const [notices, faqs] = await Promise.all([
        noticeModel.getVisible(),
        inquiryModel.getFaqs(),
      ]);
      res.render('support/index', {
        title: '운영 지원',
        currentMenu: 'support',
        notices,
        faqs,
      });
    } catch (err) {
      console.error(err);
      res.render('support/index', {
        title: '운영 지원',
        currentMenu: 'support',
        notices: [],
        faqs: [],
      });
    }
  },

  async inquiryPage(req, res) {
    try {
      const myInquiries = await inquiryModel.getByUserId(req.session.user.id);
      res.render('support/inquiry', {
        title: '문의하기',
        currentMenu: 'support',
        myInquiries,
        success: false,
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.render('support/inquiry', {
        title: '문의하기',
        currentMenu: 'support',
        myInquiries: [],
        success: false,
        error: null,
      });
    }
  },

  async submitInquiry(req, res) {
    const { question } = req.body;
    let myInquiries = [];
    try {
      await inquiryModel.create({ userId: req.session.user.id, question });
      myInquiries = await inquiryModel.getByUserId(req.session.user.id);
      res.render('support/inquiry', {
        title: '문의하기',
        currentMenu: 'support',
        myInquiries,
        success: true,
        error: null,
      });
    } catch (err) {
      console.error(err);
      myInquiries = await inquiryModel.getByUserId(req.session.user.id).catch(() => []);
      res.render('support/inquiry', {
        title: '문의하기',
        currentMenu: 'support',
        myInquiries,
        success: false,
        error: '문의 등록 중 오류가 발생했습니다.',
      });
    }
  },

  async firewallApplyPage(req, res) {
    try {
      const applies = await partnerFirewallApplyModel.getByUserId(req.session.user.id);
      res.render('support/firewall-apply', {
        title: '방화벽/토큰 신청',
        currentMenu: 'support',
        applies,
        success: false,
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.render('support/firewall-apply', {
        title: '방화벽/토큰 신청',
        currentMenu: 'support',
        applies: [],
        success: false,
        error: '데이터 로딩 중 오류가 발생했습니다.',
      });
    }
  },

  async submitFirewallApply(req, res) {
    const { source_ip, source_hostname, note, dest_ip, dest_hostname, dest_port } = req.body;
    let applies = [];
    try {
      await partnerFirewallApplyModel.create({
        userId: req.session.user.id,
        sourceIp: source_ip,
        sourceHostname: source_hostname,
        note,
        destIp: dest_ip,
        destHostname: dest_hostname,
        destPort: dest_port,
      });
      applies = await partnerFirewallApplyModel.getByUserId(req.session.user.id);
      res.render('support/firewall-apply', {
        title: '방화벽/토큰 신청',
        currentMenu: 'support',
        applies,
        success: true,
        error: null,
      });
    } catch (err) {
      console.error(err);
      applies = await partnerFirewallApplyModel.getByUserId(req.session.user.id).catch(() => []);
      res.render('support/firewall-apply', {
        title: '방화벽/토큰 신청',
        currentMenu: 'support',
        applies,
        success: false,
        error: '신청 처리 중 오류가 발생했습니다.',
      });
    }
  },
};

module.exports = supportController;
