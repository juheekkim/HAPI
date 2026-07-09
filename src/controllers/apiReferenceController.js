'use strict';

const apiSpecModel = require('../models/apiSpecModel');
const headerFieldModel = require('../models/headerFieldModel');

const apiReferenceController = {
  async index(req, res) {
    const selectedDoc = req.query.doc || 'condo';
    try {
      const specs = await apiSpecModel.getAll();
      const selectedSpec = specs.find((s) => s.domain === selectedDoc) || specs[0] || null;

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
      });
    } catch (err) {
      console.error(err);
      res.render('apiReference/index', {
        title: 'API Reference',
        currentMenu: 'api-reference',
        specs: [],
        selectedSpec: null,
        selectedDoc,
        headerFields: { system: [], transaction: [], message: [] },
      });
    }
  },
};

module.exports = apiReferenceController;
