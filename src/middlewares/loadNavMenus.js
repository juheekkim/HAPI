'use strict';

const menuModel = require('../models/menuModel');

/**
 * 로그인 사용자의 role(code)에 매핑된 상단 대메뉴만 res.locals.navMenus로 주입.
 * 헤더(partials/header.ejs)가 이 값으로 대메뉴를 동적 렌더링한다.
 * 미로그인/오류 시 빈 배열(다른 모델의 graceful degradation과 동일 정책).
 */
module.exports = async function loadNavMenus(req, res, next) {
  try {
    const role = req.session.user && req.session.user.role;
    const menus = role ? await menuModel.getNavMenusByRole(role) : [];
    res.locals.navMenus = menus.map((m) => ({
      name: m.name,
      path: m.path,
      // 활성 탭 판별 키: 경로 첫 세그먼트 (예: /api-reference?doc=header → 'api-reference')
      key: (m.path || '').split('?')[0].split('/')[1] || '',
    }));
  } catch (err) {
    console.error('loadNavMenus error:', err);
    res.locals.navMenus = [];
  }
  next();
};
