'use strict';

const chatbotModel = require('../models/chatbotModel');

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 50;
const MAX_TOOL_ITERATIONS = 5;
const REQUEST_TIMEOUT_MS = 30000;
const TRACE_TEXT_LIMIT = 4000;

const SYSTEM_PROMPT = `너는 HAPI(리조트 API 플랫폼 포털)의 안내 챗봇이다.
제공된 도구로 조회한 사실만 근거로 한국어로 답하고, 도구 조회 결과에 없는 내용은 "확인되지 않습니다"라고 답하며 지어내지 않는다.
API 파라미터, 공지사항, FAQ, 공통/에러 코드, 시스템 정보, 헤더 필드, 연동 가이드, 그리고 현재 로그인한 사용자 본인의 문의·방화벽 신청 현황에 대해서만 답할 수 있다.
답변은 간결하게, 필요하면 목록으로 정리한다.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_api_docs',
      description: '사용자가 접근 가능한 API 문서에서 키워드로 API/엔드포인트/파라미터를 검색한다.',
      parameters: {
        type: 'object',
        properties: { keyword: { type: 'string', description: '검색 키워드(비워두면 전체 목록)' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_notices',
      description: '노출 중인 최신 공지사항 목록을 가져온다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_faqs',
      description: '공개 FAQ(자주 묻는 질문과 답변) 목록을 가져온다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_common_codes',
      description: '사업장코드/영업장코드/법인코드 등 공통 코드 그룹 목록을 가져온다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_error_codes',
      description: 'API 응답 메시지 에러 코드(REME 계열) 목록을 가져온다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_system_info',
      description: '시스템코드별 접속정보(프로토콜/전문형식/대상 등) 목록을 가져온다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_header_fields',
      description: 'SystemHeader/TransactionHeader/MessageHeader 공통 헤더 필드 정의를 가져온다.',
      parameters: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: ['system', 'transaction', 'message'],
            description: '특정 섹션만 조회하려면 지정(생략 시 전체)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_guide_info',
      description:
        'API 연동 절차(온보딩 단계), 운영 전환 체크리스트, 용어집 등 시작하기 가이드 내용을 가져온다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_support_status',
      description:
        '현재 로그인한 사용자 본인의 문의 내역과 방화벽 신청 현황을 가져온다. 다른 사용자의 데이터는 조회할 수 없다.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// userId/allowedDocs는 세션에서 고정 주입 — 모델이 인자로 다른 사용자를 지정할 수 없다.
function buildToolExecutor(sessionUser, allowedDocs) {
  const handlers = {
    search_api_docs: (args) => chatbotModel.searchApiDocs(args.keyword, allowedDocs),
    get_notices: () => chatbotModel.getNotices(),
    get_faqs: () => chatbotModel.getFaqs(),
    get_common_codes: () => chatbotModel.getCommonCodes(),
    get_error_codes: () => chatbotModel.getErrorCodes(),
    get_system_info: () => chatbotModel.getSystemInfo(),
    get_header_fields: (args) => chatbotModel.getHeaderFields(args.section),
    get_guide_info: () => chatbotModel.getGuideInfo(),
    get_my_support_status: () => chatbotModel.getMySupportStatus(sessionUser.id),
  };
  return async function executeTool(name, args) {
    const handler = handlers[name];
    if (!handler) return { error: `알 수 없는 도구: ${name}` };
    try {
      return await handler(args || {});
    } catch (error) {
      console.error(`chatbot tool "${name}" 실행 오류:`, error);
      return { error: '조회 중 오류가 발생했습니다.' };
    }
  };
}

function getConfig() {
  const apiKey = process.env.CHATBOT_LLM_API_KEY;
  const baseUrl = process.env.CHATBOT_LLM_BASE_URL;
  if (!apiKey || !baseUrl) return null;
  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model: process.env.CHATBOT_LLM_MODEL || 'gpt-5.4-mini',
  };
}

// 사내 AI 허브 호출: POST {baseUrl}/{model}/invoke (SANDBOX_GATEWAY_BASE_URL과 동일하게
// base+동적 세그먼트 조합 패턴, apiReferenceController.tryEndpoint 참고). 이 허브는 모델명이
// URL 경로에 포함되는 구조라 표준 OpenAI SDK(baseURL 뒤에 /chat/completions를 고정 부착)를
// 그대로 쓸 수 없어 fetch로 직접 호출한다. 인증은 Authorization: Bearer가 아니라 X-Api-Key
// 헤더(허브가 400 응답으로 알려준 실제 요구사항, 2026-07-20 확인). 요청/응답 바디는 OpenAI
// chat completions 형식과 동일하다고 가정한 잠정 매핑 — 필드 단위 정합성은 [Needs verification],
// docs/chatbot.md 참고. 형식이 다르면 이 함수(요청 바디 구성 + response.choices[0].message 파싱)만
// 고치면 된다.
async function callLlm({ baseUrl, apiKey, model }, messages) {
  const url = `${baseUrl}/${model}/invoke`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ model, messages, tools: TOOLS, tool_choice: 'auto' }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM 허브 응답 오류(${response.status}): ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  return data.choices[0].message;
}

function safeParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function truncateTrace(value) {
  if (value === null || value === undefined) return value;
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  if (!raw || raw.length <= TRACE_TEXT_LIMIT) return value;
  return {
    truncated: true,
    preview: raw.slice(0, TRACE_TEXT_LIMIT),
  };
}

function isApiFocusedMessage(message) {
  if (!message) return false;
  return /(\bapi\b|endpoint|json|요청|응답|파라미터|헤더|전문|시스템코드|systemheader|transactionheader|messageheader|intf_id|recv_svc_cd)/i.test(
    message
  );
}

function hasApiToolCall(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return false;
  const apiTools = new Set([
    'search_api_docs',
    'get_header_fields',
    'get_system_info',
    'get_error_codes',
    'get_common_codes',
  ]);
  return toolCalls.some((call) => apiTools.has(call.name));
}

const chatbotController = {
  async getHistory(req, res) {
    const history = await chatbotModel.getHistory(req.session.user.id, MAX_HISTORY);
    res.json({ success: true, messages: history });
  },

  async sendMessage(req, res) {
    const sessionUser = req.session.user;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ success: false, message: '메시지를 입력해 주세요.' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `메시지는 ${MAX_MESSAGE_LENGTH}자 이내로 입력해 주세요.`,
      });
    }

    const config = getConfig();
    if (!config) {
      return res.status(501).json({
        success: false,
        message:
          'CHATBOT_LLM_API_KEY / CHATBOT_LLM_BASE_URL 환경변수가 설정되지 않았습니다. .env 구성 후 사용할 수 있습니다.',
      });
    }

    try {
      await chatbotModel.addMessage(sessionUser.id, 'user', message);

      const history = await chatbotModel.getHistory(sessionUser.id, MAX_HISTORY);
      const allowedDocs = await chatbotModel.resolveAllowedDocs(sessionUser);
      const executeTool = buildToolExecutor(sessionUser, allowedDocs);

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ];

      let reply = null;
      const trace = {
        model: config.model,
        iterations: 0,
        toolCalls: [],
        request: { query: message },
      };
      let apiDocs = [];

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
        trace.iterations = i + 1;
        const responseMessage = await callLlm(config, messages);
        trace.response = truncateTrace({
          content: responseMessage.content || '',
          toolCalls: responseMessage.tool_calls || [],
        });

        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
          reply = responseMessage.content || '답변을 생성하지 못했습니다.';
          break;
        }

        messages.push(responseMessage);
        for (const toolCall of responseMessage.tool_calls) {
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            args = {};
          }
          const result = await executeTool(toolCall.function.name, args);
          if (toolCall.function.name === 'search_api_docs' && Array.isArray(result)) {
            apiDocs = result;
          }
          trace.toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            args: truncateTrace(args),
            result: truncateTrace(result),
          });
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
      }

      const showApiTrace = isApiFocusedMessage(message) || hasApiToolCall(trace.toolCalls);

      if (!reply) {
        reply = '죄송합니다, 지금은 답변을 완성하지 못했습니다. 다시 시도해 주세요.';
      }

      await chatbotModel.addMessage(sessionUser.id, 'assistant', reply);
      res.json({
        success: true,
        reply,
        apiDocs,
        trace: {
          model: trace.model,
          iterations: trace.iterations,
          showApiTrace,
          request: trace.request,
          toolCalls: trace.toolCalls,
          response: safeParseJson(reply),
        },
      });
    } catch (error) {
      console.error('chatbot sendMessage 오류:', error);
      res.status(502).json({
        success: false,
        message: '챗봇 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  },

  async clearHistory(req, res) {
    await chatbotModel.clearHistory(req.session.user.id);
    res.json({ success: true });
  },
};

module.exports = chatbotController;
