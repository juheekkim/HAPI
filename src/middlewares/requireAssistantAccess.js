'use strict';

// AI 기능(/assistant 페이지, /chatbot/* API) 접근 권한 검사.
// 권한 = 역할에 "AI 어시스턴트"(/assistant) 대메뉴가 매핑돼 있는지(loadNavMenus가 계산한 res.locals.canUseAssistant).
// 관리자 > 역할 관리에서 메뉴 매핑을 끄면 메뉴·우측 하단 위젯·API가 함께 막힌다.
function requireAssistantAccess(req, res, next) {
  if (res.locals.canUseAssistant) return next();
  // /chatbot/*은 apiClient(fetch) 호출이라 JSON으로 응답
  if (req.baseUrl === '/chatbot') {
    return res.status(403).json({ success: false, message: 'AI 기능 사용 권한이 없습니다.' });
  }
  res.status(403).render('error/403', { title: '접근 권한 없음', currentMenu: '' });
}

module.exports = requireAssistantAccess;
