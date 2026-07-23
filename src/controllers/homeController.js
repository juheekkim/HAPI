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

      // category='common'(에러 코드 등)은 실제 연동 API 정의가 아니라 헤더/공통 코드 같은 참고
      // 정보라 "API 명세" 집계에서 제외한다(요청).
      const apiSpecs = specs.filter((s) => s.category !== 'common');

      const categoryCounts = {};
      apiSpecs.forEach((s) => {
        categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
      });
      const specStats = {
        total: apiSpecs.length,
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
