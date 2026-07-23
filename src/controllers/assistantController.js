'use strict';

const chatbotModel = require('../models/chatbotModel');
const menuModel = require('../models/menuModel');
const partnerModel = require('../models/partnerModel');

// 진입 시 보여줄 추천 질문 칩(정적). 대화 흐름은 기존 챗봇 백엔드(/chatbot/*)를 그대로 사용한다.
const QUESTION_CHIPS = [
  '어떤 API를 사용할 수 있어?',
  '연동 절차를 알려줘',
  '공통 헤더 구조가 궁금해',
  '내 방화벽 신청 상태 알려줘',
  '최근 공지사항 알려줘',
];

// getApiSidebarByRole의 중첩 트리에서 링크 노드만 평탄화해 추천 카드 목록으로 변환.
function flattenDocCards(nodes, out = []) {
  (nodes || []).forEach((n) => {
    if (n.isLink && n.doc) out.push({ name: n.name, icon: n.icon, doc: n.doc, path: n.path });
    flattenDocCards(n.children || [], out);
  });
  return out;
}

const assistantController = {
  // "AI 어시스턴트" 풀페이지 — 로그인 사용자 맞춤 추천(역할별 API 문서 카드/추천 질문 칩/
  // 내 지원 현황/공지)을 서버에서 모아 렌더하고, 대화는 프론트(assistant.js)가
  // 기존 /chatbot/{history,message,clear} 엔드포인트를 재사용한다.
  async index(req, res) {
    const sessionUser = req.session.user;

    // 역할 해석은 loadNavMenus/chatbotModel.resolveAllowedDocs와 동일 규칙
    // (파트너 사용자는 partners.role_id 매핑이 세션 role을 대체).
    let role = sessionUser.role;
    if (sessionUser.partnerId) {
      const mappedRole = await partnerModel.getRoleCodeById(sessionUser.partnerId);
      if (mappedRole) role = mappedRole;
    }

    const [sidebar, supportStatus, notices] = await Promise.all([
      role ? menuModel.getApiSidebarByRole(role) : [],
      chatbotModel.getMySupportStatus(sessionUser.id),
      chatbotModel.getNotices(),
    ]);

    res.render('assistant/index', {
      title: 'AI 어시스턴트',
      currentMenu: 'assistant',
      questionChips: QUESTION_CHIPS,
      apiDocCards: flattenDocCards(sidebar),
      supportStatus,
      notices: notices.slice(0, 3),
    });
  },
};

module.exports = assistantController;
