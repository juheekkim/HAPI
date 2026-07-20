'use strict';
/* global apiClient */

// 챗봇 아이콘 이미지 경로 — 이 한 줄만 바꾸면 우측 하단 아이콘이 교체됩니다.
const CHATBOT_ICON_SRC = '/images/chatbot-icon.svg';

// 패널은 아이콘 클릭으로만 열리고 X 버튼으로만 닫힌다(페이지 이동 시 자동으로 열리지 않음).
// 대화 "내용"은 chatbot_messages 테이블에 영구 저장되므로, 어느 페이지에서 다시 열어도
// loadHistory()가 서버에서 전체 이력을 불러와 이어서 대화할 수 있다.

(function () {
  const widget = document.getElementById('chatbot-widget');
  if (!widget) return;

  const toggleBtn = document.getElementById('chatbot-toggle');
  const toggleIcon = document.getElementById('chatbot-toggle-icon');
  const panel = document.getElementById('chatbot-panel');
  const closeBtn = document.getElementById('chatbot-close');
  const clearBtn = document.getElementById('chatbot-clear');
  const messagesEl = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');

  toggleIcon.src = CHATBOT_ICON_SRC;

  function appendMessage(role, content) {
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble chatbot-bubble-' + role;
    bubble.textContent = content;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function appendNotice(text) {
    const notice = document.createElement('div');
    notice.className = 'chatbot-notice';
    notice.textContent = text;
    messagesEl.appendChild(notice);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function loadHistory() {
    try {
      const data = await apiClient.get('/chatbot/history');
      messagesEl.innerHTML = '';
      if (!data.messages || data.messages.length === 0) {
        appendNotice('안녕하세요! HAPI 포털 이용에 대해 무엇이든 물어보세요.');
        return;
      }
      data.messages.forEach((m) => appendMessage(m.role, m.content));
    } catch (err) {
      if (err.status === 401) {
        location.href = '/auth/login';
      }
    }
  }

  let opened = false;
  function openPanel() {
    panel.hidden = false;
    opened = true;
    if (!messagesEl.dataset.loaded) {
      messagesEl.dataset.loaded = '1';
      loadHistory();
    }
    input.focus();
  }
  function closePanel() {
    panel.hidden = true;
    opened = false;
  }

  toggleBtn.addEventListener('click', () => (opened ? closePanel() : openPanel()));
  closeBtn.addEventListener('click', closePanel);

  clearBtn.addEventListener('click', async () => {
    try {
      await apiClient.post('/chatbot/clear');
      messagesEl.innerHTML = '';
      appendNotice('새 대화를 시작합니다.');
    } catch (err) {
      if (err.status === 401) location.href = '/auth/login';
    }
  });

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    autoResize();
    appendMessage('user', message);
    const sendBtn = document.getElementById('chatbot-send');
    sendBtn.disabled = true;
    const loading = document.createElement('div');
    loading.className = 'chatbot-bubble chatbot-bubble-assistant chatbot-bubble-loading';
    loading.textContent = '답변 생성 중...';
    messagesEl.appendChild(loading);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const data = await apiClient.post('/chatbot/message', { message });
      loading.remove();
      appendMessage('assistant', data.reply);
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
  });
})();
