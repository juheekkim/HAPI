'use strict';

const apiSpecModel = require('../models/apiSpecModel');
const headerFieldModel = require('../models/headerFieldModel');
const menuModel = require('../models/menuModel');

const apiReferenceController = {
  async index(req, res) {
    const role = req.session.user && req.session.user.role;
    try {
      const sidebar = role ? await menuModel.getApiSidebarByRole(role) : [];
      // 중첩 사이드바 트리에서 클릭 가능한(허용된) 문서 doc을 재귀 수집
      const collectDocs = (nodes) =>
        nodes.flatMap((n) => [
          ...(n.isLink && n.doc ? [n.doc] : []),
          ...collectDocs(n.children || []),
        ]);
      const allowedDocs = collectDocs(sidebar);

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
};

module.exports = apiReferenceController;
