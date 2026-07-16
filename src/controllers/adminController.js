'use strict';

const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');
const Anthropic = require('@anthropic-ai/sdk');
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
const commonCodeModel = require('../models/commonCodeModel');

// ── 이미지 업로드 자동입력: Claude Vision 구조화 추출 ──────
// apiSpecImportMapper의 필드 shape({depth,id,label,type,usage,length,decimal,default,isArray,note})과
// 정확히 동일한 JSON을 강제해서(structured outputs) mapImageExtractionsToApiSpec에 변환 없이 넘긴다.
const IMAGE_FIELD_SCHEMA = {
  type: 'object',
  properties: {
    depth: { type: 'integer', description: '0=최상위, ▷ 들여쓰기 1개당 1씩 증가' },
    id: { type: 'string', description: '필드ID (예: CORP_CD)' },
    label: { type: 'string', description: '필드명(한글)' },
    type: { type: 'string', description: '오브젝트명 컬럼 값 (String/Numeric/Group 등)' },
    usage: { type: 'string', description: '사용여부 컬럼 값(예: NOT USE). 없으면 빈 문자열' },
    length: { type: 'string', description: '길이 컬럼 값. 없으면 빈 문자열' },
    decimal: { type: 'string', description: '소수점 컬럼 값. 없으면 빈 문자열' },
    default: { type: 'string', description: 'Default 컬럼 값. 없으면 빈 문자열' },
    isArray: { type: 'string', description: '배열형태 컬럼 값(Y/N). 없으면 빈 문자열' },
    note: { type: 'string', description: '비고. 없으면 빈 문자열' },
  },
  required: ['depth', 'id', 'label', 'type', 'usage', 'length', 'decimal', 'default', 'isArray', 'note'],
  additionalProperties: false,
};
const IMAGE_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    svcId: { type: 'string', description: 'SVC명 값. 못 찾으면 빈 문자열' },
    businessDesc: { type: 'string', description: '업무설명 값. 못 찾으면 빈 문자열' },
    inputFields: { type: 'array', items: IMAGE_FIELD_SCHEMA, description: '[INPUT] 표의 필드 행' },
    outputFields: { type: 'array', items: IMAGE_FIELD_SCHEMA, description: '[OUTPUT] 표의 필드 행' },
  },
  required: ['svcId', 'businessDesc', 'inputFields', 'outputFields'],
  additionalProperties: false,
};

const IMAGE_EXTRACTION_PROMPT = `이 이미지는 사내 표준 "HABIS 모델 정의서" 엑셀 시트를 캡처한 것이다. 다음 규칙으로 데이터를 추출하라.

- 시트 상단에 "SVC명"과 "업무설명" 라벨 옆에 각각의 값이 있다.
- "[INPUT]"이라고 적힌 섹션 아래 표가 입력 필드 목록이고, "[OUTPUT]"이라고 적힌 섹션 아래 표가 출력 필드 목록이다.
- 각 표의 헤더는 보통 "필드ID / 필드명 / 오브젝트명 / 사용여부 / 길이 / 소수점 / Default / 배열형태" 순서이지만
  컬럼 순서나 문구가 조금 다를 수 있으니 헤더 문구를 보고 의미로 매칭하라.
- 필드ID 앞에 "▷" 기호가 붙어있으면 상위 Group 필드의 하위 필드라는 뜻이다. "▷"가 없으면 depth=0,
  "▷" 1개면 depth=1, "▷▷"처럼 2개면 depth=2로 취급한다.
- 오브젝트명이 "Group"인 행은 실제 데이터 필드가 아니라 하위 필드들을 묶는 컨테이너다.
- 표에 없는 컬럼 값은 빈 문자열("")로 채워라. 실제로 없는 값을 지어내지 마라.
- 표 옆이나 아래에 있는 별도의 코드값 설명표(예: 코드번호/코드명 매핑)는 필드 목록에 포함하지 마라.
- [INPUT]이나 [OUTPUT] 섹션이 이미지에 없으면 해당 배열은 빈 배열([])로 반환하라.

주어진 스키마 그대로 JSON으로만 응답하라.`;

async function extractSpecFromImage(client, file) {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: file.mimetype, data: file.buffer.toString('base64') },
          },
          { type: 'text', text: IMAGE_EXTRACTION_PROMPT },
        ],
      },
    ],
    output_config: { format: { type: 'json_schema', schema: IMAGE_EXTRACTION_SCHEMA } },
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return JSON.parse(textBlock ? textBlock.text : '{}');
}

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

  // ── API 등록/관리: 엑셀 업로드(HABIS 모델 정의서) ──
  // 응답 계약: { success: true, specs: ApiSpecInput[] } | 오류 시 4xx/5xx + { success:false, message }.
  // 파싱 로직은 apiSpecImportMapper.mapHabisWorkbookToApiSpec 참조(양식 가정/제약 주석 포함).
  async importApisFromExcel(req, res) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '엑셀 파일을 선택하세요.' });
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const fallbackName = req.file.originalname.replace(/\.[^./\\]+$/, '');
      const spec = apiSpecImportMapper.mapHabisWorkbookToApiSpec(workbook, fallbackName);
      if (!spec.endpoints.length) {
        return res.status(422).json({
          success: false,
          message: '엔드포인트를 찾지 못했습니다. 시트명이 "#1", "#2"... 형식인지 확인하세요.',
        });
      }
      return res.json({ success: true, specs: [spec] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: '엑셀 파싱 중 오류가 발생했습니다.' });
    }
  },

  // ── API 등록/관리: 이미지 업로드(여러 장, Claude Vision) ──
  // 응답 계약은 엑셀 업로드와 동일: { success: true, specs: ApiSpecInput[] } | 오류 시 4xx/5xx + { success:false, message }.
  // ANTHROPIC_API_KEY(.env, 공통 영역)가 설정된 경우에만 동작한다(MCI 연동과 동일한 501 폴백 패턴).
  // 이미지 1장 = 시트 "#N" 1장(엔드포인트 1개)이라는 엑셀 경로와 같은 전제. 추출 결과 shape을
  // apiSpecImportMapper의 필드 shape과 동일하게 맞춰 mapImageExtractionsToApiSpec 하나로 합친다
  // (NOT USE 처리·도메인 추천 로직이 엑셀/이미지 두 경로에서 갈라지지 않게).
  async importApisFromImage(req, res) {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: '이미지 파일을 선택하세요.' });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(501).json({
        success: false,
        message: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. .env 구성(팀 협의) 후 사용할 수 있습니다.',
      });
    }
    try {
      const client = new Anthropic({ apiKey });
      const extractions = [];
      for (const file of files) {
        extractions.push(await extractSpecFromImage(client, file));
      }
      const fallbackName = files[0].originalname.replace(/\.[^./\\]+$/, '');
      const spec = apiSpecImportMapper.mapImageExtractionsToApiSpec(extractions, fallbackName);
      if (!spec.endpoints.length) {
        return res.status(422).json({
          success: false,
          message: '이미지에서 엔드포인트를 찾지 못했습니다.',
        });
      }
      return res.json({ success: true, specs: [spec] });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ success: false, message: '이미지 인식 중 오류가 발생했습니다.' });
    }
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

  // ── 코드 관리 (공통 코드 + 에러 코드, 한 화면에서 탭으로 전환) ──────
  // API Reference "공통 > 공통 코드"/"공통 > 에러 코드" 화면이 참조하는 데이터를 관리자가
  // db/scripts 없이도 등록/수정/삭제할 수 있도록 한다(system_info류는 여전히 스크립트 관리).
  async codes(req, res) {
    try {
      const [commonCodes, errorCodesResult] = await Promise.all([
        commonCodeModel.getAllForAdmin(),
        apiSpecModel.getErrorCodesForAdmin(),
      ]);
      res.render('admin/codes', {
        title: '코드 관리',
        currentMenu: 'admin',
        activeTab: 'codes',
        commonCodes,
        errorCodes: errorCodesResult.errorCodes,
        error: null,
      });
    } catch (err) {
      console.error(err);
      res.render('admin/codes', {
        title: '코드 관리',
        currentMenu: 'admin',
        activeTab: 'codes',
        commonCodes: [],
        errorCodes: [],
        error: null,
      });
    }
  },

  async createCommonCode(req, res) {
    const { group_code, group_name, detail_code, description, display_order } = req.body;
    try {
      await commonCodeModel.create({
        groupCode: group_code,
        groupName: group_name,
        detailCode: detail_code,
        description,
        displayOrder: parseInt(display_order, 10) || 0,
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/codes');
  },

  async updateCommonCode(req, res) {
    const { group_code, group_name, detail_code, description, display_order } = req.body;
    try {
      await commonCodeModel.update(req.params.id, {
        groupCode: group_code,
        groupName: group_name,
        detailCode: detail_code,
        description,
        displayOrder: parseInt(display_order, 10) || 0,
      });
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/codes');
  },

  async deleteCommonCode(req, res) {
    try {
      await commonCodeModel.delete(req.params.id);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/codes');
  },

  async createErrorCode(req, res) {
    const { code, name, desc } = req.body;
    try {
      const { errorCodes } = await apiSpecModel.getErrorCodesForAdmin();
      if (errorCodes.some((ec) => ec.code === code)) {
        throw Object.assign(new Error('duplicate code'), { duplicateCode: code });
      }
      await apiSpecModel.addErrorCode({ code, name, desc });
      return res.redirect('/admin/codes');
    } catch (err) {
      console.error(err);
      const error = err.duplicateCode
        ? `이미 등록된 메시지코드입니다: ${err.duplicateCode}`
        : '에러 코드 등록 중 오류가 발생했습니다.';
      const [commonCodes, errorCodesResult] = await Promise.all([
        commonCodeModel.getAllForAdmin(),
        apiSpecModel.getErrorCodesForAdmin(),
      ]);
      return res.render('admin/codes', {
        title: '코드 관리',
        currentMenu: 'admin',
        activeTab: 'codes',
        commonCodes,
        errorCodes: errorCodesResult.errorCodes,
        error,
      });
    }
  },

  async updateErrorCode(req, res) {
    const { original_code, code, name, desc } = req.body;
    try {
      const { errorCodes } = await apiSpecModel.getErrorCodesForAdmin();
      if (code !== original_code && errorCodes.some((ec) => ec.code === code)) {
        throw Object.assign(new Error('duplicate code'), { duplicateCode: code });
      }
      await apiSpecModel.updateErrorCode(original_code, { code, name, desc });
      return res.redirect('/admin/codes');
    } catch (err) {
      console.error(err);
      const error = err.duplicateCode
        ? `이미 등록된 메시지코드입니다: ${err.duplicateCode}`
        : '에러 코드 수정 중 오류가 발생했습니다.';
      const [commonCodes, errorCodesResult] = await Promise.all([
        commonCodeModel.getAllForAdmin(),
        apiSpecModel.getErrorCodesForAdmin(),
      ]);
      return res.render('admin/codes', {
        title: '코드 관리',
        currentMenu: 'admin',
        activeTab: 'codes',
        commonCodes,
        errorCodes: errorCodesResult.errorCodes,
        error,
      });
    }
  },

  async deleteErrorCode(req, res) {
    try {
      await apiSpecModel.deleteErrorCode(req.params.code);
    } catch (err) {
      console.error(err);
    }
    res.redirect('/admin/codes');
  },
};

module.exports = adminController;
