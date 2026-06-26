'use strict';

const apiSpecModel = require('../models/apiSpecModel');

const apiReferenceController = {
  async index(req, res) {
    const selectedDoc = req.query.doc || 'condo';
    try {
      const specs = await apiSpecModel.getAll();
      const selectedSpec = specs.find((s) => s.domain === selectedDoc) || specs[0] || null;
      res.render('apiReference/index', {
        title: 'API Reference',
        currentMenu: 'api-reference',
        specs,
        selectedSpec,
        selectedDoc,
      });
    } catch (err) {
      console.error(err);
      res.render('apiReference/index', {
        title: 'API Reference',
        currentMenu: 'api-reference',
        specs: [],
        selectedSpec: null,
        selectedDoc,
      });
    }
  },
};

module.exports = apiReferenceController;
