'use strict';

const menuModel = require('../models/menuModel');
const partnerModel = require('../models/partnerModel');

/**
 * 로그인 사용자의 role(code)에 매핑된 상단 대메뉴만 res.locals.navMenus로 주입.
 * 헤더(partials/header.ejs)가 이 값으로 대메뉴를 동적 렌더링한다.
 * 파트너 사용자는 /admin/partner-roles에서 지정한 partners.role_id가 세션 role보다 우선 적용된다
 * (매핑 없으면 세션 role로 폴백).
 * 미로그인/오류 시 빈 배열(다른 모델의 graceful degradation과 동일 정책).
 */
module.exports = async function loadNavMenus(req, res, next) {
  try {
    const sessionUser = req.session.user;
    let role = sessionUser && sessionUser.role;
    if (sessionUser && sessionUser.partnerId) {
      const mappedRole = await partnerModel.getRoleCodeById(sessionUser.partnerId);
      if (mappedRole) role = mappedRole;
    }
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
