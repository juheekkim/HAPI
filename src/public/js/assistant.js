'use strict';
/* global apiClient */

// AI 어시스턴트 풀페이지(/assistant) 글루 스크립트.
// - 대화: 기존 챗봇 백엔드(/chatbot/{history,message,clear})를 그대로 재사용
// - 답변 렌더링(마크다운/API 트리/nav 링크): chatbot.js가 노출한 window.HapiChatbotShared 재사용
// - 링크 클릭: 배경 페이지 이동 대신 우측 패널에 API Reference 부분화면(_partial=1)을 주입
//   (chatbot.js의 문서 클릭 핸들러는 window.__hapiAssistantActive 가드로 이 페이지에서 양보)
(function () {
  const messagesEl = document.getElementById('assistant-messages');
  if (!messagesEl) return;

  window.__hapiAssistantActive = true;
  document.body.classList.add('assistant-page');

  const form = document.getElementById('assistant-form');
  const input = document.getElementById('assistant-input');
  const sendBtn = document.getElementById('assistant-send');
  const clearBtn = document.getElementById('assistant-clear');
  const panel = document.getElementById('assistant-panel');
  const panelBody = document.getElementById('assistant-panel-body');
  const panelClose = document.getElementById('assistant-panel-close');

  // chatbot.js(레이아웃 하단 로드)가 노출한 공용 렌더러. defer 로드라 존재가 보장되지만
  // 방어적으로 호출 시점에 조회한다(없으면 텍스트만 렌더).
  function shared() {
    return window.HapiChatbotShared || null;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendBubble(role, content, messageMeta) {
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble chatbot-bubble-' + role;
    const s = shared();
    if (role === 'assistant' && s && typeof s.renderAssistantMessageContent === 'function') {
      s.renderAssistantMessageContent(bubble, content, messageMeta);
    } else {
      bubble.textContent = content;
    }
    messagesEl.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function appendNotice(text) {
    const notice = document.createElement('div');
    notice.className = 'chatbot-notice';
    notice.textContent = text;
    messagesEl.appendChild(notice);
    scrollToBottom();
  }

  // ── 대화 이력 ──────────────────────────────────────────────
  async function loadHistory() {
    try {
      const data = await apiClient.get('/chatbot/history');
      (data.messages || []).forEach((m) => appendBubble(m.role, m.content, m.meta));
    } catch (err) {
      if (err.status === 401) location.href = '/auth/login';
    }
  }

  // ── 전송(챗봇 위젯 submit 흐름과 동일한 meta 구성) ─────────
  async function sendMessage(message) {
    if (!message) return;
    input.value = '';
    autoResize();
    appendBubble('user', message);
    sendBtn.disabled = true;
    const loading = document.createElement('div');
    loading.className = 'chatbot-bubble chatbot-bubble-assistant chatbot-bubble-loading';
    loading.textContent = '답변 생성 중...';
    messagesEl.appendChild(loading);
    scrollToBottom();

    try {
      const data = await apiClient.post('/chatbot/message', { message });
      loading.remove();
      const trace = data.trace
        ? {
            enabled: data.trace.showApiTrace === true,
            request: data.trace.request || { query: message },
            response: data.trace.response || { reply: data.reply },
            meta: { model: data.trace.model, iterations: data.trace.iterations },
            toolCalls: Array.isArray(data.trace.toolCalls) ? data.trace.toolCalls : [],
          }
        : null;
      appendBubble('assistant', data.reply, {
        trace,
        apiDocs: Array.isArray(data.apiDocs) ? data.apiDocs : [],
      });
    } catch (err) {
      loading.remove();
      if (err.status === 401) {
        location.href = '/auth/login';
      } else if (err.status === 501) {
        appendNotice('챗봇이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.');
      } else {
        appendNotice(err.message || '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      sendBtn.disabled = false;
    }
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value.trim());
  });
  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendMessage(input.value.trim());
    }
  });

  // 추천 질문 칩 → 바로 전송
  document.querySelectorAll('.assistant-chip').forEach((chip) => {
    chip.addEventListener('click', () => sendMessage(chip.textContent.trim()));
  });

  // 새 대화(소프트 리셋) — 위젯 clear와 동일 엔드포인트
  clearBtn.addEventListener('click', async () => {
    try {
      await apiClient.post('/chatbot/clear');
      messagesEl.querySelectorAll('.chatbot-bubble, .chatbot-notice').forEach((el) => el.remove());
      appendNotice('새 대화를 시작합니다.');
    } catch (err) {
      appendNotice(err.message || '초기화에 실패했습니다.');
    }
  });

  // ── 우측 문서 패널 ─────────────────────────────────────────
  let panelDoc = null; // 현재 패널에 로드된 doc 슬러그(같은 문서 재클릭 시 재로드 생략)

  async function openPanelWithUrl(href) {
    const parsed = new URL(href, window.location.origin);
    const nextDoc = parsed.searchParams.get('doc') || '';

    // 같은 문서가 이미 로드돼 있으면 부분화면 재요청 없이 포커스만 갱신(스크롤 위치 보존)
    if (!panel.hidden && panelDoc === nextDoc && panelBody.querySelector('.api-content')) {
      if (typeof window.hapiApiReferenceApplyFocus === 'function') {
        window.hapiApiReferenceApplyFocus(parsed.search);
      }
      return;
    }

    const partialUrl = parsed.pathname + parsed.search + (parsed.search ? '&' : '?') + '_partial=1';
    const html = await apiClient.getText(partialUrl);
    panelBody.innerHTML = html;

    // innerHTML로 주입된 <script>는 실행되지 않으므로 재생성해 실행
    // (chatbot.js navigateApiReferenceInPlace와 동일 기법; 부분화면 스크립트의 최상위 선언은
    //  모두 var/function이라 반복 실행에 안전)
    panelBody.querySelectorAll('script').forEach((oldScript) => {
      const nextScript = document.createElement('script');
      if (oldScript.src) nextScript.src = oldScript.src;
      else nextScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(nextScript, oldScript);
    });

    panel.hidden = false;
    panelDoc = nextDoc;
    // 패널이 보이는 상태에서 포커스/스크롤 적용(숨김 상태에선 좌표 계산이 0이 됨)
    if (typeof window.hapiApiReferenceApplyFocus === 'function') {
      window.hapiApiReferenceApplyFocus(parsed.search);
    }
  }

  panelClose.addEventListener('click', () => {
    panel.hidden = true;
  });

  // 챗봇 nav 링크(답변 트리/본문/추천 카드 공통: a[data-chatbot-nav="api-reference"]) 클릭을
  // 이 페이지에서는 패널로 처리. chatbot.js의 핸들러는 __hapiAssistantActive 가드로 먼저 양보한다.
  document.addEventListener('click', async (e) => {
    const anchor = e.target.closest('a[data-chatbot-nav="api-reference"]');
    if (!anchor) return;
    e.preventDefault();
    const href = anchor.getAttribute('href');
    if (!href) return;
    try {
      await openPanelWithUrl(href);
    } catch {
      window.open(href, '_blank'); // 패널 로드 실패 시 대화를 잃지 않도록 새 탭 폴백
    }
  });

  loadHistory();
})();
