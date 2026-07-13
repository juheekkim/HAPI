'use strict';

const bcrypt = require('bcrypt');
const partnerModel = require('../models/partnerModel');
const firewallModel = require('../models/firewallModel');
const partnerFirewallApplyModel = require('../models/partnerFirewallApplyModel');
const userModel = require('../models/userModel');
const inquiryModel = require('../models/inquiryModel');
const noticeModel = require('../models/noticeModel');
const apiSpecModel = require('../models/apiSpecModel');
const apiSpecImportMapper = require('../models/apiSpecImportMapper');
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
        role: 'BigCorp',
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

  // ── API 등록/관리: 엑셀 업로드 (뼈대) ──────────────
  // 응답 계약: { success: true, specs: ApiSpecInput[] } | 오류 시 4xx/5xx + { success:false, message }.
  // 프론트(api-form.ejs)는 이 계약만 보고 동작하므로, 실제 파싱이 붙어도 화면 코드는 그대로 재사용된다.
  //
  // 아직 연동 전인 이유: 멀티파트 업로드 파서(예: multer)와 엑셀 파서(예: xlsx) 둘 다 새 의존성이며,
  // package.json은 공통 영역(coding-convention.md 0장)이라 팀 협의 후 추가해야 한다.
  // 협의 후 붙이는 순서: ① multer로 req.file(버퍼) 수신 ② xlsx 등으로 버퍼를 rows(Record<string,any>[])로 변환
  // ③ apiSpecImportMapper.mapExcelRowsToApiSpecs(rows) 호출 ④ 아래 응답 계약대로 res.json.
  async importApisFromExcel(req, res) {
    return res.status(501).json({
      success: false,
      message:
        '엑셀 업로드는 아직 연동되지 않았습니다. 파서 라이브러리 추가(팀 협의) 후 사용할 수 있습니다.',
    });
  },

  // ── API 등록/관리: 이미지 업로드 (뼈대) ────────────
  // 응답 계약은 엑셀 업로드와 동일: { success: true, specs: ApiSpecInput[] } | 오류 시 4xx/5xx + { success:false, message }.
  //
  // 아직 연동 전인 이유: 멀티파트 업로드 파서(예: multer)와 이미지 인식/OCR 라이브러리 둘 다 새 의존성이며,
  // package.json은 공통 영역(coding-convention.md 0장)이라 팀 협의 후 추가해야 한다.
  // 협의 후 붙이는 순서: ① multer로 req.file(버퍼) 수신 ② OCR/비전 라이브러리로 버퍼에서 스펙 정보 추출
  // ③ apiSpecImportMapper에 이미지 결과 → ApiSpecInput 매핑 함수 추가 ④ 아래 응답 계약대로 res.json.
  async importApisFromImage(req, res) {
    return res.status(501).json({
      success: false,
      message:
        '이미지 업로드는 아직 연동되지 않았습니다. 파서 라이브러리 추가(팀 협의) 후 사용할 수 있습니다.',
    });
  },

  // ── API 등록/관리: MCI 서비스 주소 가져오기 (뼈대) ──
  // MCI_SERVICE_BASE_URL(.env, 공통 영역)이 설정된 경우에만 동작한다. 실제 MCI 응답 필드명은
  // apiSpecImportMapper.mapMciResponseToApiSpec에서 [Needs verification]로 표시된 잠정 매핑을 사용 중이며,
  // 연동 확정 시 그 함수만 교체하면 된다.
  async fetchApiFromMci(req, res) {
    const address = (req.body && req.body.address ? String(req.body.address) : '').trim();
    if (!address) {
      return res.status(400).json({ success: false, message: 'MCI 서비스 주소를 입력하세요.' });
    }
    const baseUrl = process.env.MCI_SERVICE_BASE_URL;
    if (!baseUrl) {
      return res.status(501).json({
        success: false,
        message: 'MCI_SERVICE_BASE_URL 환경변수가 설정되지 않았습니다. .env 구성(팀 협의) 후 사용할 수 있습니다.',
      });
    }
    try {
      const response = await fetch(new URL(address, baseUrl).toString());
      if (!response.ok) {
        return res
          .status(502)
          .json({ success: false, message: `MCI 서비스 응답 오류 (${response.status})` });
      }
      const mciData = await response.json();
      const spec = apiSpecImportMapper.mapMciResponseToApiSpec(mciData);
      return res.json({ success: true, specs: [spec] });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ success: false, message: 'MCI 서비스 조회 중 오류가 발생했습니다.' });
    }
  },

  // ── 메뉴 관리 ──────────────────────────────────────
  async menus(req, res) {
    try {
      const [tree, flatMenus, apiDocs] = await Promise.all([
        menuModel.getAllWithChildren(),
        menuModel.getAll(),
        // api-doc 메뉴 경로 도우미용. 조회 실패해도 메뉴 화면은 정상 렌더되도록 []로 폴백.
        apiSpecModel.getAllForAdmin().catch(() => []),
      ]);
      res.render('admin/menus', {
        title: '메뉴 관리',
        currentMenu: 'admin',
        activeTab: 'menus',
        tree,
        flatMenus,
        apiDocs,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/menus', {
        title: '메뉴 관리',
        currentMenu: 'admin',
        activeTab: 'menus',
        tree: [],
        flatMenus: [],
        apiDocs: [],
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

  // ── 권한 그룹 관리 ──────────────────────────────────────
  async roles(req, res) {
    try {
      const [roles, tree, roleMenuMap] = await Promise.all([
        roleModel.getAllForAdmin(),
        menuModel.getAllWithChildren(),
        roleModel.getAllMenuIdsByRole(),
      ]);
      res.render('admin/roles', {
        title: '권한 그룹 관리',
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
        title: '권한 그룹 관리',
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
        title: '권한 그룹 관리',
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
      // admin 그룹은 항상 활성 상태 유지 (비활성화 시 관리자 로그인 전체 차단 위험)
      const existing = await roleModel.getById(req.params.id);
      const isActive = existing && existing.code === 'admin' ? true : is_active !== 'false';
      await roleModel.update(req.params.id, {
        code,
        name,
        description,
        isActive,
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
        title: '권한 그룹 관리',
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

  // ── 사용자별 권한관리 (파트너사 코드 ↔ 권한그룹 매핑) ──────
  async partnerRoles(req, res) {
    try {
      const [partners, roles] = await Promise.all([
        partnerModel.getApprovedWithRole(),
        roleModel.getAllForAdmin(),
      ]);
      res.render('admin/partnerRoles', {
        title: '사용자별 권한관리',
        currentMenu: 'admin',
        activeTab: 'partnerRoles',
        partners,
        roles: roles.filter((r) => r.code !== 'admin'),
      });
    } catch (err) {
      console.error(err);
      res.render('admin/partnerRoles', {
        title: '사용자별 권한관리',
        currentMenu: 'admin',
        activeTab: 'partnerRoles',
        partners: [],
        roles: [],
      });
    }
  },

  async updatePartnerRole(req, res) {
    const { role_id } = req.body;
    try {
      await partnerModel.updateRoleId(req.params.id, role_id || null);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/partner-roles');
  },
};

module.exports = adminController;
