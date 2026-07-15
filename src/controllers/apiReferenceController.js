'use strict';

const apiSpecModel = require('../models/apiSpecModel');
const headerFieldModel = require('../models/headerFieldModel');
const menuModel = require('../models/menuModel');
const partnerModel = require('../models/partnerModel');

// 세션 사용자가 실제로 접근 가능한 API 문서(domain) 목록을 산출.
// 파트너는 /admin/partner-roles에서 지정한 partners.role_id가 세션 role보다 우선 적용.
// index(사이드바 렌더)와 tryEndpoint(서버측 인가 재검증)가 공유.
async function resolveAllowedDocs(sessionUser) {
  let role = sessionUser && sessionUser.role;
  if (sessionUser && sessionUser.partnerId) {
    const mappedRole = await partnerModel.getRoleCodeById(sessionUser.partnerId);
    if (mappedRole) role = mappedRole;
  }
  const sidebar = role ? await menuModel.getApiSidebarByRole(role) : [];
  // 중첩 사이드바 트리에서 클릭 가능한(허용된) 문서 doc을 재귀 수집
  const collectDocs = (nodes) =>
    nodes.flatMap((n) => [
      ...(n.isLink && n.doc ? [n.doc] : []),
      ...collectDocs(n.children || []),
    ]);
  return { sidebar, allowedDocs: collectDocs(sidebar) };
}

const apiReferenceController = {
  async index(req, res) {
    const sessionUser = req.session.user;
    try {
      const { sidebar, allowedDocs } = await resolveAllowedDocs(sessionUser);

      // role이 허용하지 않은 doc으로 직접 접근하면 첫 허용 문서로 리다이렉트
      if (req.query.doc && !allowedDocs.includes(req.query.doc) && allowedDocs.length > 0) {
        return res.redirect('/api-reference?doc=' + encodeURIComponent(allowedDocs[0]));
      }
      // 랜딩: 쿼리 doc(허용된 경우) → role의 첫 허용 문서 → null(허용 문서 없음)
      const selectedDoc = req.query.doc || allowedDocs[0] || null;

      const specs = await apiSpecModel.getAll();
      const selectedSpec = specs.find((s) => s.domain === selectedDoc) || null;

      // 헤더 필드 데이터 조회 (system/transaction/message 모두 {category, fields}[] 형태로 통일)
      const headerFieldsGrouped = await headerFieldModel.getAllWithGrouping();
      const headerFields = {
        system: [],
        transaction: [],
        message: []
      };

      headerFieldsGrouped.forEach(group => {
        if (headerFields[group.section]) {
          headerFields[group.section].push({
            category: group.category,
            fields: group.fields
          });
        }
      });

      res.render('apiReference/index', {
        title: 'API Reference',
        currentMenu: 'api-reference',
        specs,
        selectedSpec,
        selectedDoc,
        headerFields,
        sidebar,
      });
    } catch (err) {
      console.error(err);
      res.render('apiReference/index', {
        title: 'API Reference',
        currentMenu: 'api-reference',
        specs: [],
        selectedSpec: null,
        selectedDoc: req.query.doc || null,
        headerFields: { system: [], transaction: [], message: [] },
        sidebar: [],
      });
    }
  },

  // "테스트" 샌드박스: 사용자가 팝업에서 확정한 JSON body를 실제 게이트웨이로 프록시.
  // 클라이언트가 호출 대상 host를 지정할 수 없도록 SANDBOX_GATEWAY_URL(env)만 사용(SSRF 방지).
  // domain 인가는 버튼 노출 여부와 별개로 서버에서 다시 검증한다(직접 API 호출로 우회 방지).
  async tryEndpoint(req, res) {
    const { domain, endpointIndex, systemCode, body } = req.body || {};

    const { allowedDocs } = await resolveAllowedDocs(req.session.user);
    if (!domain || !allowedDocs.includes(domain)) {
      return res.status(403).json({ success: false, message: '해당 API 문서에 접근 권한이 없습니다.' });
    }

    const baseUrl = process.env.SANDBOX_GATEWAY_BASE_URL;
    if (!baseUrl) {
      return res.status(501).json({
        success: false,
        message: 'SANDBOX_GATEWAY_BASE_URL 환경변수가 설정되지 않았습니다. .env 구성(팀 협의) 후 사용할 수 있습니다.',
      });
    }

    const specs = await apiSpecModel.getAll();
    const spec = specs.find((s) => s.domain === domain);
    const endpoint = spec && spec.endpoints && spec.endpoints[endpointIndex];
    if (!endpoint || typeof endpoint.url !== 'string' || endpoint.url.startsWith('/')) {
      return res.status(400).json({ success: false, message: '테스트를 지원하지 않는 API입니다.' });
    }

    // URL 경로의 시스템코드(예: OCH, LCB)는 API마다 다르다(ep.description "{시스템코드} / ..." 첫 토큰).
    // 클라이언트가 자유 문자열을 넘기므로 경로 조작 방지를 위해 형식을 엄격히 제한한다.
    if (typeof systemCode !== 'string' || !/^[A-Za-z0-9_-]{1,20}$/.test(systemCode)) {
      return res.status(400).json({ success: false, message: '시스템코드 형식이 올바르지 않습니다.' });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ success: false, message: '요청 본문(JSON)이 올바르지 않습니다.' });
    }

    const gatewayUrl = `${baseUrl.replace(/\/+$/, '')}/${systemCode}/json.jdo`;

    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      const text = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
      return res.json({ success: true, status: response.status, body: parsed });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ success: false, message: '게이트웨이 호출 중 오류가 발생했습니다.' });
    }
  },
};

module.exports = apiReferenceController;
