'use strict';

const pool = require('../config/database');
const noticeModel = require('./noticeModel');
const inquiryModel = require('./inquiryModel');
const apiSpecModel = require('./apiSpecModel');
const commonCodeModel = require('./commonCodeModel');
const systemInfoModel = require('./systemInfoModel');
const headerFieldModel = require('./headerFieldModel');
const partnerFirewallApplyModel = require('./partnerFirewallApplyModel');
const menuModel = require('./menuModel');
const partnerModel = require('./partnerModel');

// views/guide/index.ejs 콘텐츠 요약(정적, STATIC_* 폴백 데이터와 동일한 패턴). 가이드 화면
// 문구가 바뀌면 이 상수도 함께 갱신해야 한다(docs/chatbot.md 참고).
const GUIDE_INFO = `[연동 절차]
1. 코드 발급·로그인 및 방화벽 신청 — 파트너 승인 후 발급된 코드(8자리)로 로그인하고, 개발/운영 서버 방화벽 해제를 함께 신청한다.
2. 필요한 API 확인 — API Reference에서 요청/응답 구조와 공통 헤더 규칙을 확인한다.
3. 개발 서버 테스트 — API Reference의 "테스트" 버튼으로 개발 서버에 실제 호출을 보내 동작을 확인한다.
4. 운영 테스트 — 검증된 요청 그대로 운영 접속정보로 호출해 최종 확인한다.
개발/운영 서버 접속 정보(도메인, IP, URL)는 API Reference > 공통 > 헤더 > 접속정보에서 최신 값으로 관리된다.

[운영 전환 체크리스트]
- 운영서버 방화벽 해제 완료
- 고객번호/회원번호 등 기준정보 사전 등록 완료
- 운영 접속정보로 실제 호출 테스트 정상 응답 확인

[자주 쓰는 용어]
- 파트너사 코드: 파트너 신청 승인 시 발급되는 8자리 숫자 코드. 로그인 아이디 및 최초 비밀번호로 사용.
- systemCode(시스템코드): 요청 헤더/URL 경로에 쓰이는 코드로 API마다 다름(예: OCH, LCB). API Reference 헤더 문서 "시스템 정보" 표 참고.
- INTF_ID(인터페이스ID): MCI/EAI 호출을 위한 ID. 요청시스템코드(3)+일련번호(2)+서비스코드(13) 형식.
- RECV_SVC_CD(수신서비스코드): 수신 시스템에서 호출되는 최종 서비스(거래) 코드.
- MCI: 한화리조트 대외채널 연동을 처리하는 백엔드 인터페이스.`;

// apiReferenceController.js(resolveAllowedDocs, 박승욱 소유 파일)와 동일한 알고리즘을 의도적으로
// 재구현한 것 — 소유 파일을 직접 import/수정하지 않기 위함(team-ownership.md 준수). 두 로직은
// menuModel.getApiSidebarByRole + partnerModel.getRoleCodeById 조합이 바뀌면 함께 갱신해야 한다.
async function resolveAllowedDocs(sessionUser) {
  let role = sessionUser && sessionUser.role;
  if (sessionUser && sessionUser.partnerId) {
    const mappedRole = await partnerModel.getRoleCodeById(sessionUser.partnerId);
    if (mappedRole) role = mappedRole;
  }
  const sidebar = role ? await menuModel.getApiSidebarByRole(role) : [];
  const collectDocs = (nodes) =>
    nodes.flatMap((n) => [...(n.isLink && n.doc ? [n.doc] : []), ...collectDocs(n.children || [])]);
  return collectDocs(sidebar);
}

function normalizeResponseFieldPath(path) {
  return String(path || '').replace(/\[\d+\]/g, '[]');
}

function collectResponseFields(value, basePath, bucket) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    if (value.length === 0) return;
    collectResponseFields(value[0], basePath ? basePath + '[]' : '[]', bucket);
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, nested]) => {
      const nextPath = basePath ? basePath + '.' + key : key;
      collectResponseFields(nested, nextPath, bucket);
    });
    return;
  }

  const parts = String(basePath || '').split('.').filter(Boolean);
  const leaf = (parts[parts.length - 1] || '').replace(/\[]/g, '');
  if (!leaf) return;
  bucket.push({
    name: leaf,
    path: normalizeResponseFieldPath(basePath),
    type: typeof value,
  });
}

function extractResponseFields(responseExample) {
  if (!responseExample) return [];

  let parsed = responseExample;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  const fields = [];
  collectResponseFields(parsed, '', fields);
  const dedupe = new Map();
  fields.forEach((field) => {
    const key = String(field.path || '').toLowerCase();
    if (!key || dedupe.has(key)) return;
    dedupe.set(key, field);
  });
  return Array.from(dedupe.values()).slice(0, 160);
}

const chatbotModel = {
  // "새 대화"(clearHistory) 이후 시점만 조회 — chatbot_clears.cleared_at 경계 이전 메시지는
  // 원본 그대로 DB에 남아있지만 화면/LLM 컨텍스트에는 노출하지 않는다(아래 clearHistory 참고).
  async getHistory(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT role, content, created_at FROM (
           SELECT role, content, created_at FROM chatbot_messages
           WHERE user_id = $1
             AND created_at > COALESCE(
               (SELECT cleared_at FROM chatbot_clears WHERE user_id = $1),
               '-infinity'::timestamptz
             )
           ORDER BY created_at DESC LIMIT $2
         ) recent ORDER BY created_at ASC`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching chatbot history:', error);
      return [];
    }
  },

  async addMessage(userId, role, content) {
    await pool.query('INSERT INTO chatbot_messages (user_id, role, content) VALUES ($1, $2, $3)', [
      userId,
      role,
      content,
    ]);
  },

  // 원본 대화 기록(chatbot_messages)은 삭제하지 않는다 — 사용자별 "초기화 시점"만 upsert해서
  // 이후 getHistory가 그 시점 이전 메시지를 걸러내는 방식(소프트 리셋).
  async clearHistory(userId) {
    await pool.query(
      `INSERT INTO chatbot_clears (user_id, cleared_at) VALUES ($1, now())
       ON CONFLICT (user_id) DO UPDATE SET cleared_at = now()`,
      [userId]
    );
  },

  resolveAllowedDocs,

  async searchApiDocs(keyword, allowedDocs) {
    const specs = await apiSpecModel.getAll();
    const kw = (keyword || '').toLowerCase();
    const visible = specs.filter((s) => allowedDocs.includes(s.domain));
    const matched = visible.filter((s) => {
      const haystack = [
        s.name,
        s.description,
        s.domain,
        ...(s.endpoints || []).flatMap((ep) => [
          ep.description,
          ...(ep.params || []).map((p) => p.name),
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !kw || haystack.includes(kw);
    });
    return matched.slice(0, 5).map((s) => ({
      domain: s.domain,
      name: s.name,
      description: s.description,
      category: s.category,
      endpoints: (s.endpoints || []).slice(0, 8).map((ep) => ({
        method: ep.method,
        url: ep.url,
        description: ep.description,
        params: (ep.params || []).map((p) => ({
          name: p.name,
          type: p.type,
          required: p.required,
          label: p.label,
          desc: p.desc,
        })),
        paramNames: (ep.params || []).map((p) => p.name),
        responseFields: extractResponseFields(ep.responseExample),
      })),
    }));
  },

  async getNotices() {
    const notices = await noticeModel.getVisible();
    return notices.slice(0, 10).map((n) => ({
      tag: n.tag,
      title: n.title,
      content: n.content,
      createdAt: n.created_at,
    }));
  },

  async getFaqs() {
    const faqs = await inquiryModel.getFaqs();
    return faqs.map((f) => ({ question: f.question, answer: f.answer }));
  },

  async getCommonCodes() {
    return commonCodeModel.getAllGrouped();
  },

  async getErrorCodes() {
    const specs = await apiSpecModel.getAll();
    const spec = specs.find((s) => s.domain === 'error-codes');
    return spec ? spec.errorCodes || [] : [];
  },

  async getSystemInfo() {
    return systemInfoModel.getAllGrouped();
  },

  async getHeaderFields(section) {
    const grouped = await headerFieldModel.getAllWithGrouping();
    return section ? grouped.filter((g) => g.section === section) : grouped;
  },

  getGuideInfo() {
    return GUIDE_INFO;
  },

  async getMySupportStatus(userId) {
    const [inquiries, firewallRequests] = await Promise.all([
      inquiryModel.getByUserId(userId),
      partnerFirewallApplyModel.getByUserId(userId),
    ]);
    return {
      inquiries: inquiries.map((i) => ({
        question: i.question,
        answer: i.answer,
        status: i.status,
        createdAt: i.created_at,
      })),
      firewallRequests: firewallRequests.map((f) => ({
        sourceIp: f.source_ip,
        destIp: f.dest_ip,
        destPort: f.dest_port,
        approvalStatus: f.approval_status,
        rejectReason: f.reject_reason,
        token: f.token,
        requestedAt: f.requested_at,
      })),
    };
  },
};

module.exports = chatbotModel;
