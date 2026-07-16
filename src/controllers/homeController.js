'use strict';

const apiSpecModel = require('../models/apiSpecModel');
const noticeModel = require('../models/noticeModel');

const CATEGORY_LABELS = { common: '공통', resort: '리조트', estate: '에스테이트' };

const homeController = {
  async index(req, res) {
    try {
      const [specs, notices] = await Promise.all([
        apiSpecModel.getAll(),
        noticeModel.getVisible(),
      ]);

      const categoryCounts = {};
      specs.forEach((s) => {
        categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
      });
      const specStats = {
        total: specs.length,
        byCategory: Object.keys(categoryCounts).map((key) => ({
          label: CATEGORY_LABELS[key] || key,
          count: categoryCounts[key],
        })),
      };

      res.render('home/index', {
        title: 'Portal',
        currentMenu: 'home',
        specStats,
        recentNotices: notices.slice(0, 2),
      });
    } catch (err) {
      console.error(err);
      res.render('home/index', {
        title: 'Portal',
        currentMenu: 'home',
        specStats: { total: 0, byCategory: [] },
        recentNotices: [],
      });
    }
  },
};

module.exports = homeController;
