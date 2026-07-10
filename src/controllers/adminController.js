'use strict';

const bcrypt = require('bcrypt');
const partnerModel = require('../models/partnerModel');
const firewallModel = require('../models/firewallModel');
const partnerFirewallApplyModel = require('../models/partnerFirewallApplyModel');
const userModel = require('../models/userModel');
const inquiryModel = require('../models/inquiryModel');
const noticeModel = require('../models/noticeModel');
const apiSpecModel = require('../models/apiSpecModel');
const menuModel = require('../models/menuModel');
const roleModel = require('../models/roleModel');

const adminController = {
  index(req, res) {
    res.redirect('/admin/partners');
  },

  async partners(req, res) {
    try {
      const partners = await partnerModel.getAll();
      res.render('admin/partners', {
        title: '파트너사 관리',
        currentMenu: 'admin',
        activeTab: 'partners',
        partners,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/partners', {
        title: '파트너사 관리',
        currentMenu: 'admin',
        activeTab: 'partners',
        partners: [],
      });
    }
  },

  async approvePartner(req, res) {
    try {
      const partner = await partnerModel.getById(req.params.id);
      const code = String(Math.floor(10000000 + Math.random() * 90000000));
      await partnerModel.updateStatus(req.params.id, 'approved', null, code);
      // 파트너사 로그인 계정 생성 (초기 PW = partner_code)
      const hash = await bcrypt.hash(code, 10);
      await userModel.create({
        username: code,
        passwordHash: hash,
        name: partner ? partner.manager_name : '파트너',
        role: 'partner',
        partnerId: Number(req.params.id),
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/partners');
  },

  async rejectPartner(req, res) {
    const { reason } = req.body;
    try {
      await partnerModel.updateStatus(req.params.id, 'rejected', reason);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/partners');
  },

  async firewall(req, res) {
    try {
      const requests = await partnerFirewallApplyModel.getAll();
      res.render('admin/firewall', {
        title: '방화벽·토큰 요청',
        currentMenu: 'admin',
        activeTab: 'firewall',
        requests,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/firewall', {
        title: '방화벽·토큰 요청',
        currentMenu: 'admin',
        activeTab: 'firewall',
        requests: [],
      });
    }
  },

  async approveFirewall(req, res) {
    try {
      await partnerFirewallApplyModel.approve(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/firewall');
  },

  async rejectFirewall(req, res) {
    const { reason } = req.body;
    try {
      await partnerFirewallApplyModel.reject(req.params.id, reason);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/firewall');
  },

  async issueToken(req, res) {
    try {
      await firewallModel.issueToken(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/firewall');
  },

  async inquiries(req, res) {
    try {
      const inquiries = await inquiryModel.getAll();
      res.render('admin/inquiries', {
        title: '문의 확인',
        currentMenu: 'admin',
        activeTab: 'inquiries',
        inquiries,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/inquiries', {
        title: '문의 확인',
        currentMenu: 'admin',
        activeTab: 'inquiries',
        inquiries: [],
      });
    }
  },

  async createInquiry(req, res) {
    const { question, answer } = req.body;
    try {
      await inquiryModel.createByAdmin({ userId: req.session.user.id, question, answer });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/inquiries');
  },

  async answerInquiry(req, res) {
    const { answer } = req.body;
    try {
      await inquiryModel.answer(req.params.id, answer);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/inquiries');
  },

  async toggleFaq(req, res) {
    try {
      await inquiryModel.toggleFaq(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/inquiries');
  },

  async notices(req, res) {
    try {
      const notices = await noticeModel.getAllForAdmin();
      res.render('admin/notices', {
        title: '공지사항 관리',
        currentMenu: 'admin',
        activeTab: 'notices',
        notices,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/notices', {
        title: '공지사항 관리',
        currentMenu: 'admin',
        activeTab: 'notices',
        notices: [],
      });
    }
  },

  async createNotice(req, res) {
    const { tag, tag_type, title, content, is_visible } = req.body;
    try {
      await noticeModel.create({
        tag,
        tagType: tag_type,
        title,
        content,
        isVisible: is_visible === 'true',
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/notices');
  },

  async updateNotice(req, res) {
    const { tag, tag_type, title, content, is_visible } = req.body;
    try {
      await noticeModel.update(req.params.id, {
        tag,
        tagType: tag_type,
        title,
        content,
        isVisible: is_visible === 'true',
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/notices');
  },

  async deleteNotice(req, res) {
    try {
      await noticeModel.delete(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/notices');
  },

  async toggleNoticeVisible(req, res) {
    try {
      await noticeModel.toggleVisible(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/notices');
  },

  async apis(req, res) {
    try {
      const apis = await apiSpecModel.getAllForAdmin();
      res.render('admin/apis', {
        title: 'API 등록/관리',
        currentMenu: 'admin',
        activeTab: 'apis',
        apis,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/apis', {
        title: 'API 등록/관리',
        currentMenu: 'admin',
        activeTab: 'apis',
        apis: [],
      });
    }
  },

  newApiForm(req, res) {
    res.render('admin/api-form', {
      title: 'API 등록',
      currentMenu: 'admin',
      activeTab: 'apis',
      mode: 'create',
      apiSpec: null,
      error: null,
    });
  },

  async editApiForm(req, res) {
    try {
      const apiSpec = await apiSpecModel.getById(req.params.id);
      if (!apiSpec) return res.redirect('/admin/apis');
      res.render('admin/api-form', {
        title: 'API 수정',
        currentMenu: 'admin',
        activeTab: 'apis',
        mode: 'edit',
        apiSpec,
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.redirect('/admin/apis');
    }
  },

  async createApi(req, res) {
    const { category, domain, name, description, endpoints_json, display_order } = req.body;
    let endpoints = [];
    try {
      endpoints = JSON.parse(endpoints_json || '[]');
    } catch (err) {
      console.error(err);
    }
    try {
      await apiSpecModel.create({
        category,
        domain,
        name,
        description,
        endpoints,
        displayOrder: Number(display_order) || 0,
      });
      return res.redirect('/admin/apis');
    } catch (err) {
      console.error(err);
      const error =
        err.code === '23505'
          ? `이미 등록된 도메인 코드입니다: ${domain}`
          : 'API 등록 중 오류가 발생했습니다.';
      return res.render('admin/api-form', {
        title: 'API 등록',
        currentMenu: 'admin',
        activeTab: 'apis',
        mode: 'create',
        apiSpec: { category, domain, name, description, display_order, endpoints },
        error,
      });
    }
  },

  async updateApi(req, res) {
    const { category, domain, name, description, endpoints_json, display_order } = req.body;
    let endpoints = [];
    try {
      endpoints = JSON.parse(endpoints_json || '[]');
    } catch (err) {
      console.error(err);
    }
    try {
      await apiSpecModel.update(req.params.id, {
        category,
        domain,
        name,
        description,
        endpoints,
        displayOrder: Number(display_order) || 0,
      });
      return res.redirect('/admin/apis');
    } catch (err) {
      console.error(err);
      const error =
        err.code === '23505'
          ? `이미 등록된 도메인 코드입니다: ${domain}`
          : 'API 수정 중 오류가 발생했습니다.';
      return res.render('admin/api-form', {
        title: 'API 수정',
        currentMenu: 'admin',
        activeTab: 'apis',
        mode: 'edit',
        apiSpec: { id: req.params.id, category, domain, name, description, display_order, endpoints },
        error,
      });
    }
  },

  async deleteApi(req, res) {
    try {
      await apiSpecModel.delete(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/apis');
  },

  // ── 메뉴 관리 ──────────────────────────────────────
  async menus(req, res) {
    try {
      const [tree, flatMenus] = await Promise.all([
        menuModel.getAllWithChildren(),
        menuModel.getAll(),
      ]);
      res.render('admin/menus', {
        title: '메뉴 관리',
        currentMenu: 'admin',
        activeTab: 'menus',
        tree,
        flatMenus,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/menus', {
        title: '메뉴 관리',
        currentMenu: 'admin',
        activeTab: 'menus',
        tree: [],
        flatMenus: [],
      });
    }
  },

  async createMenu(req, res) {
    const { parent_id, name, path, menu_type, icon, admin_only, display_order, is_active } = req.body;
    try {
      await menuModel.create({
        parentId: parent_id ? Number(parent_id) : null,
        name,
        path,
        menuType: menu_type,
        icon,
        adminOnly: admin_only === 'true',
        displayOrder: display_order,
        isActive: is_active !== 'false',
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/menus');
  },

  async updateMenu(req, res) {
    const { parent_id, name, path, menu_type, icon, admin_only, display_order, is_active } = req.body;
    try {
      await menuModel.update(req.params.id, {
        parentId: parent_id ? Number(parent_id) : null,
        name,
        path,
        menuType: menu_type,
        icon,
        adminOnly: admin_only === 'true',
        displayOrder: display_order,
        isActive: is_active !== 'false',
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/menus');
  },

  async deleteMenu(req, res) {
    try {
      await menuModel.delete(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/menus');
  },

  async toggleMenuActive(req, res) {
    try {
      await menuModel.toggleActive(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/menus');
  },

  // ── 권한 관리 ──────────────────────────────────────
  async roles(req, res) {
    try {
      const [roles, tree, roleMenuMap] = await Promise.all([
        roleModel.getAllForAdmin(),
        menuModel.getAllWithChildren(),
        roleModel.getAllMenuIdsByRole(),
      ]);
      res.render('admin/roles', {
        title: '권한 관리',
        currentMenu: 'admin',
        activeTab: 'roles',
        roles,
        tree,
        roleMenuMap,
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/roles', {
        title: '권한 관리',
        currentMenu: 'admin',
        activeTab: 'roles',
        roles: [],
        tree: [],
        roleMenuMap: {},
        error: null,
      });
    }
  },

  async createRole(req, res) {
    const { code, name, description, is_active } = req.body;
    try {
      await roleModel.create({
        code,
        name,
        description,
        isActive: is_active !== 'false',
      });
      return res.redirect('/admin/roles');
    } catch (err) {
      console.error(err);
      const error =
        err.code === '23505'
          ? `이미 등록된 역할 코드입니다: ${code}`
          : '역할 등록 중 오류가 발생했습니다.';
      const [roles, tree, roleMenuMap] = await Promise.all([
        roleModel.getAllForAdmin(),
        menuModel.getAllWithChildren(),
        roleModel.getAllMenuIdsByRole(),
      ]);
      return res.render('admin/roles', {
        title: '권한 관리',
        currentMenu: 'admin',
        activeTab: 'roles',
        roles,
        tree,
        roleMenuMap,
        error,
      });
    }
  },

  async updateRole(req, res) {
    const { code, name, description, is_active } = req.body;
    try {
      await roleModel.update(req.params.id, {
        code,
        name,
        description,
        isActive: is_active !== 'false',
      });
      return res.redirect('/admin/roles');
    } catch (err) {
      console.error(err);
      const error =
        err.code === '23505'
          ? `이미 등록된 역할 코드입니다: ${code}`
          : '역할 수정 중 오류가 발생했습니다.';
      const [roles, tree, roleMenuMap] = await Promise.all([
        roleModel.getAllForAdmin(),
        menuModel.getAllWithChildren(),
        roleModel.getAllMenuIdsByRole(),
      ]);
      return res.render('admin/roles', {
        title: '권한 관리',
        currentMenu: 'admin',
        activeTab: 'roles',
        roles,
        tree,
        roleMenuMap,
        error,
      });
    }
  },

  async deleteRole(req, res) {
    try {
      await roleModel.delete(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/roles');
  },

  async assignMenus(req, res) {
    const menuIds = [].concat(req.body.menuIds || []);
    try {
      await roleModel.setMenus(req.params.id, menuIds);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/roles');
  },
};

module.exports = adminController;
