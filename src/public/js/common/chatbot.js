'use strict';
/* global apiClient */

// 챗봇 아이콘 이미지 경로 — 이 한 줄만 바꾸면 우측 하단 아이콘이 교체됩니다.
const CHATBOT_ICON_SRC = '/images/chatbot-icon.svg';
const CHATBOT_STATE_KEY = 'hapi.chatbot.state';
const NAV_MATCH_MIN_SCORE = 0.52;

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

  function createCopyButton(onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chatbot-copy-btn';
    button.textContent = '복사';
    button.addEventListener('click', onClick);
    return button;
  }

  function copyText(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function normalizeToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_\.가-힣]/g, '');
  }

  function tokenizeWords(value) {
    return String(value || '')
      .toLowerCase()
      .split(/[^a-z0-9가-힣]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2);
  }

  function buildApiReferenceUrl(target) {
    const params = new URLSearchParams();
    if (target.doc) params.set('doc', target.doc);
    if (target.focusType) params.set('focusType', target.focusType);
    if (Number.isInteger(target.ep)) params.set('ep', String(target.ep));
    if (target.field) params.set('field', target.field);
    if (target.section) params.set('section', target.section);
    if (target.q) params.set('q', target.q);
    const query = params.toString();
    return '/api-reference' + (query ? '?' + query : '');
  }

  function makeNavTarget({ token, doc, focusType, ep, field, section, q }) {
    if (!token || !doc) return null;
    const words = tokenizeWords(token);
    return {
      token,
      norm: normalizeToken(token),
      words,
      url: buildApiReferenceUrl({ doc, focusType, ep, field, section, q }),
    };
  }

  function extractSearchApiDocTargets(result) {
    if (!Array.isArray(result)) return [];
    const targets = [];
    const seen = new Set();

    function pushTarget(target) {
      if (!target || !target.norm || !target.url) return;
      const key = target.norm + '|' + target.url;
      if (seen.has(key)) return;
      seen.add(key);
      targets.push(target);
    }

    function pushToken(token, params) {
      const target = makeNavTarget({ token, ...params });
      if (target) pushTarget(target);
    }

    function pushSlashAliases(token, params) {
      if (typeof token !== 'string') return;
      token
        .split('/')
        .map((part) => part.trim())
        .filter((part) => part.length >= 2)
        .forEach((part) => pushToken(part, params));
    }

    result.forEach((spec) => {
      if (!spec || !spec.domain) return;
      const doc = spec.domain;
      if (spec.name) {
        pushToken(spec.name, { doc, focusType: 'endpoint' });
        pushSlashAliases(spec.name, { doc, focusType: 'endpoint' });
      }
      if (spec.domain) {
        pushToken(spec.domain, { doc, focusType: 'endpoint' });
      }
      if (spec.description) {
        pushToken(spec.description, { doc, focusType: 'endpoint' });
        pushSlashAliases(spec.description, { doc, focusType: 'endpoint' });
      }

      const combined = [spec.name, spec.description, spec.domain].filter(Boolean).join(' ');
      if (/키오스크|kiosk/i.test(combined)) {
        pushToken('키오스크', { doc, focusType: 'endpoint' });
        pushToken('골프장 키오스크', { doc, focusType: 'endpoint' });
        pushToken('och kiosk', { doc, focusType: 'endpoint' });
      }
      if (spec.category === 'common' || spec.domain === 'error-codes' || spec.domain === 'common-codes') {
        pushToken('공통', { doc, focusType: 'endpoint' });
      }

      (spec.endpoints || []).forEach((ep, idx) => {
        if (!ep) return;
        if (ep.description) {
          pushToken(ep.description, {
            doc,
            focusType: 'endpoint',
            ep: idx,
            q: ep.description,
          });
        }
        if (ep.url) {
          pushToken(ep.url, {
            doc,
            focusType: 'endpoint',
            ep: idx,
            q: ep.url,
          });
        }
        (ep.paramNames || []).forEach((paramName) => {
          if (!paramName) return;
          pushToken(paramName, {
            doc,
            focusType: 'request-param',
            ep: idx,
            field: paramName,
            q: paramName,
          });
        });
        (ep.params || []).forEach((param) => {
          if (!param || !param.name) return;
          pushToken(param.name, {
            doc,
            focusType: 'request-param',
            ep: idx,
            field: param.name,
            q: param.name,
          });
        });
        (ep.responseFields || []).forEach((fieldInfo) => {
          if (!fieldInfo || !fieldInfo.name) return;
          pushToken(fieldInfo.name, {
            doc,
            focusType: 'response-field',
            ep: idx,
            field: fieldInfo.name,
            q: fieldInfo.path || fieldInfo.name,
          });
        });
      });
    });
    return targets;
  }

  function extractHeaderTargets(result) {
    if (!Array.isArray(result)) return [];
    const targets = [];
    result.forEach((group) => {
      if (!group || !group.section) return;
      targets.push(
        makeNavTarget({
          token: group.section,
          doc: 'header',
          focusType: 'header-section',
          section: group.section,
        })
      );
      (group.fields || []).forEach((field) => {
        if (field.fieldNameEn) {
          targets.push(
            makeNavTarget({
              token: field.fieldNameEn,
              doc: 'header',
              focusType: 'header-field',
              section: group.section,
              field: field.fieldNameEn,
              q: field.fieldNameEn,
            })
          );
        }
        if (field.fieldNameKo) {
          targets.push(
            makeNavTarget({
              token: field.fieldNameKo,
              doc: 'header',
              focusType: 'header-field',
              section: group.section,
              field: field.fieldNameKo,
              q: field.fieldNameKo,
            })
          );
        }
      });
    });
    ['SystemHeader', 'TransactionHeader', 'MessageHeader', 'INTF_ID', 'RECV_SVC_CD'].forEach((token) => {
      targets.push(makeNavTarget({ token, doc: 'header', focusType: 'header-field', q: token }));
    });
    return targets.filter(Boolean);
  }

  function extractCodeTargets(result, doc, focusType) {
    if (!Array.isArray(result)) return [];
    return result
      .flatMap((item) => {
        if (!item) return [];
        const out = [];
        if (item.groupCode) {
          out.push(
            makeNavTarget({
              token: item.groupCode,
              doc,
              focusType,
              field: item.groupCode,
              q: item.groupCode,
            })
          );
        }
        if (item.groupName) {
          out.push(
            makeNavTarget({
              token: item.groupName,
              doc,
              focusType,
              field: item.groupName,
              q: item.groupName,
            })
          );
        }
        if (item.code) {
          out.push(
            makeNavTarget({
              token: item.code,
              doc,
              focusType,
              field: item.code,
              q: item.code,
            })
          );
        }
        if (item.name) {
          out.push(
            makeNavTarget({
              token: item.name,
              doc,
              focusType,
              field: item.name,
              q: item.name,
            })
          );
        }
        return out;
      })
      .filter(Boolean);
  }

  function buildNavTargetsFromTrace(trace) {
    if (!trace || !Array.isArray(trace.toolCalls)) return [];
    const targets = [];
    trace.toolCalls.forEach((toolCall) => {
      if (!toolCall || !toolCall.name || !toolCall.result || toolCall.result.truncated) return;
      if (toolCall.name === 'search_api_docs') {
        targets.push(...extractSearchApiDocTargets(toolCall.result));
      } else if (toolCall.name === 'get_header_fields') {
        targets.push(...extractHeaderTargets(toolCall.result));
      } else if (toolCall.name === 'get_common_codes') {
        targets.push(...extractCodeTargets(toolCall.result, 'common-codes', 'common-code'));
      } else if (toolCall.name === 'get_error_codes') {
        targets.push(...extractCodeTargets(toolCall.result, 'error-codes', 'error-code'));
      }
    });

    const dedupe = new Map();
    targets.forEach((target) => {
      if (!target || !target.norm || !target.url) return;
      const key = target.norm + '|' + target.url;
      if (!dedupe.has(key)) dedupe.set(key, target);
    });
    return Array.from(dedupe.values());
  }

  function buildNavTargets(messageMeta) {
    const apiDocs = messageMeta && Array.isArray(messageMeta.apiDocs) ? messageMeta.apiDocs : [];
    if (apiDocs.length > 0) {
      return extractSearchApiDocTargets(apiDocs);
    }
    return buildNavTargetsFromTrace(messageMeta && messageMeta.trace);
  }

  function computeNavMatchScore(normalizedText, textWords, target) {
    if (!target || !target.norm) return 0;
    if (normalizedText === target.norm) return 1;

    if (normalizedText.includes(target.norm)) {
      const ratio = target.norm.length / Math.max(normalizedText.length, 1);
      return Math.min(0.99, 0.9 + ratio * 0.09);
    }

    if (normalizedText.length >= 3 && target.norm.includes(normalizedText)) {
      return 0.72;
    }

    const targetWords = Array.isArray(target.words) ? target.words : tokenizeWords(target.token);
    if (targetWords.length === 0 || textWords.length === 0) return 0;

    let hitScore = 0;
    targetWords.forEach((word) => {
      if (textWords.includes(word)) {
        hitScore += 1;
        return;
      }
      if (word.length >= 4 && textWords.some((candidate) => candidate.includes(word) || word.includes(candidate))) {
        hitScore += 0.6;
      }
    });

    const denominator = Math.min(4, targetWords.length);
    const overlap = hitScore / denominator;
    const prefixBonus = targetWords[0] && textWords.includes(targetWords[0]) ? 0.08 : 0;
    return Math.min(0.88, overlap + prefixBonus);
  }

  function findBestNavTarget(text, navTargets) {
    if (!text || !Array.isArray(navTargets) || navTargets.length === 0) return null;
    const normalized = normalizeToken(text);
    const textWords = tokenizeWords(text);
    let best = null;
    let bestScore = 0;

    navTargets.forEach((target) => {
      if (!target || !target.norm) return;
      const score = computeNavMatchScore(normalized, textWords, target);
      if (score < NAV_MATCH_MIN_SCORE) return;
      if (!best || score > bestScore || (score === bestScore && target.norm.length > best.norm.length)) {
        best = target;
        bestScore = score;
      }
    });

    return best;
  }

  function appendInlineMarkdownWithNav(target, text, navTargets) {
    const match = findBestNavTarget(text, navTargets);
    if (!match) {
      appendInlineMarkdown(target, text);
      return;
    }
    const anchor = document.createElement('a');
    anchor.className = 'chatbot-nav-link';
    anchor.href = match.url;
    anchor.setAttribute('data-chatbot-nav', 'api-reference');
    anchor.textContent = text;
    target.appendChild(anchor);
  }

  function appendInlineMarkdown(target, text) {
    const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        target.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = token.slice(2, -2);
        target.appendChild(strong);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        const code = document.createElement('code');
        code.textContent = token.slice(1, -1);
        target.appendChild(code);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      target.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function renderMarkdownText(container, text, navTargets) {
    const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

    blocks.forEach((block) => {
      const lines = block.split('\n').map((line) => line.trimEnd());
      const first = lines[0] || '';

      if (/^#{1,4}\s+/.test(first)) {
        const level = Math.min(4, first.match(/^#+/)[0].length);
        const heading = document.createElement('h' + level);
        appendInlineMarkdownWithNav(heading, first.replace(/^#{1,4}\s+/, ''), navTargets);
        container.appendChild(heading);
        return;
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        const ul = document.createElement('ul');
        lines.forEach((line) => {
          const li = document.createElement('li');
          appendInlineMarkdownWithNav(li, line.replace(/^[-*]\s+/, ''), navTargets);
          ul.appendChild(li);
        });
        container.appendChild(ul);
        return;
      }

      if (lines.every((line) => /^\d+(?:\.|\))\s+/.test(line))) {
        const ol = document.createElement('ol');
        lines.forEach((line) => {
          const li = document.createElement('li');
          appendInlineMarkdownWithNav(li, line.replace(/^\d+(?:\.|\))\s+/, ''), navTargets);
          ol.appendChild(li);
        });
        container.appendChild(ol);
        return;
      }

      const paragraph = document.createElement('p');
      lines.forEach((line, idx) => {
        appendInlineMarkdownWithNav(paragraph, line, navTargets);
        if (idx < lines.length - 1) paragraph.appendChild(document.createElement('br'));
      });
      container.appendChild(paragraph);
    });
  }

  function parseMarkdownBlocks(content) {
    const segments = [];
    const regex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      segments.push({
        type: 'code',
        language: (match[1] || '').toLowerCase(),
        content: match[2],
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      segments.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return segments;
  }

  function toTreeFromPaths(paths) {
    const root = {};
    (paths || []).forEach((rawPath) => {
      const cleanPath = String(rawPath || '').replace(/\[\]/g, '').trim();
      if (!cleanPath) return;
      const parts = cleanPath.split('.').filter(Boolean);
      let node = root;
      parts.forEach((part) => {
        if (!node[part]) node[part] = {};
        node = node[part];
      });
    });
    return root;
  }

  function renderFieldTree(container, tree, buildHref, parentPath) {
    const keys = Object.keys(tree || {});
    if (keys.length === 0) return;

    const ul = document.createElement('ul');
    ul.className = 'chatbot-api-tree-list';

    keys.forEach((key) => {
      const nextPath = parentPath ? parentPath + '.' + key : key;
      const li = document.createElement('li');
      const hasChildren = Object.keys(tree[key] || {}).length > 0;

      const anchor = document.createElement('a');
      anchor.className = 'chatbot-nav-link chatbot-api-tree-link';
      anchor.href = buildHref(key, nextPath);
      anchor.setAttribute('data-chatbot-nav', 'api-reference');
      anchor.textContent = key;
      li.appendChild(anchor);

      if (hasChildren) {
        renderFieldTree(li, tree[key], buildHref, nextPath);
      }
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  function renderApiDocTree(container, apiDocs) {
    if (!Array.isArray(apiDocs) || apiDocs.length === 0) return;

    const wrap = document.createElement('details');
    wrap.className = 'chatbot-api-tree';
    wrap.open = true;

    const summary = document.createElement('summary');
    summary.textContent = 'API 문서 트리';
    wrap.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'chatbot-api-tree-body';

    apiDocs.forEach((spec) => {
      if (!spec || !spec.domain) return;

      const specDetails = document.createElement('details');
      specDetails.className = 'chatbot-api-tree-spec';

      const specSummary = document.createElement('summary');
      const specLink = document.createElement('a');
      specLink.className = 'chatbot-nav-link chatbot-api-tree-link';
      specLink.href = buildApiReferenceUrl({ doc: spec.domain, focusType: 'endpoint' });
      specLink.setAttribute('data-chatbot-nav', 'api-reference');
      specLink.textContent = spec.name || spec.domain;
      specSummary.appendChild(specLink);
      specDetails.appendChild(specSummary);

      const endpoints = document.createElement('div');
      endpoints.className = 'chatbot-api-tree-endpoints';

      (spec.endpoints || []).forEach((ep, idx) => {
        if (!ep) return;
        const endpointDetails = document.createElement('details');
        endpointDetails.className = 'chatbot-api-tree-endpoint';

        const endpointSummary = document.createElement('summary');
        const endpointLink = document.createElement('a');
        endpointLink.className = 'chatbot-nav-link chatbot-api-tree-link';
        endpointLink.href = buildApiReferenceUrl({
          doc: spec.domain,
          focusType: 'endpoint',
          ep: idx,
          q: ep.description || ep.url,
        });
        endpointLink.setAttribute('data-chatbot-nav', 'api-reference');
        endpointLink.textContent = (ep.method || 'POST') + ' ' + (ep.description || ep.url || '상세 API');
        endpointSummary.appendChild(endpointLink);
        endpointDetails.appendChild(endpointSummary);

        const detailBody = document.createElement('div');
        detailBody.className = 'chatbot-api-tree-endpoint-body';

        const requestTitle = document.createElement('div');
        requestTitle.className = 'chatbot-api-tree-title';
        requestTitle.textContent = '요청 필드';
        detailBody.appendChild(requestTitle);

        const requestPaths = (ep.params || []).map((p) => p && p.name).filter(Boolean);
        if (requestPaths.length > 0) {
          const requestTree = toTreeFromPaths(requestPaths);
          renderFieldTree(
            detailBody,
            requestTree,
            function (leaf, fullPath) {
              return buildApiReferenceUrl({
                doc: spec.domain,
                focusType: 'request-param',
                ep: idx,
                field: leaf,
                q: fullPath,
              });
            },
            ''
          );
        } else {
          const emptyReq = document.createElement('div');
          emptyReq.className = 'chatbot-api-tree-empty';
          emptyReq.textContent = '요청 파라미터 없음';
          detailBody.appendChild(emptyReq);
        }

        const responseTitle = document.createElement('div');
        responseTitle.className = 'chatbot-api-tree-title';
        responseTitle.textContent = '응답 필드';
        detailBody.appendChild(responseTitle);

        const responsePaths = (ep.responseFields || []).map((f) => f && (f.path || f.name)).filter(Boolean);
        if (responsePaths.length > 0) {
          const responseTree = toTreeFromPaths(responsePaths);
          renderFieldTree(
            detailBody,
            responseTree,
            function (leaf, fullPath) {
              return buildApiReferenceUrl({
                doc: spec.domain,
                focusType: 'response-field',
                ep: idx,
                field: leaf,
                q: fullPath,
              });
            },
            ''
          );
        } else {
          const emptyRes = document.createElement('div');
          emptyRes.className = 'chatbot-api-tree-empty';
          emptyRes.textContent = '응답 예시 미정의';
          detailBody.appendChild(emptyRes);
        }

        endpointDetails.appendChild(detailBody);
        endpoints.appendChild(endpointDetails);
      });

      specDetails.appendChild(endpoints);
      body.appendChild(specDetails);
    });

    wrap.appendChild(body);
    container.appendChild(wrap);
  }

  function createJsonTreeNode(key, value) {
    const row = document.createElement('div');
    row.className = 'chatbot-json-row';

    if (key !== null) {
      const keyEl = document.createElement('span');
      keyEl.className = 'chatbot-json-key';
      keyEl.textContent = key;
      row.appendChild(keyEl);
      const sep = document.createElement('span');
      sep.className = 'chatbot-json-sep';
      sep.textContent = ': ';
      row.appendChild(sep);
    }

    if (value === null) {
      const v = document.createElement('span');
      v.className = 'chatbot-json-null';
      v.textContent = 'null';
      row.appendChild(v);
      return row;
    }

    if (Array.isArray(value)) {
      const details = document.createElement('details');
      details.className = 'chatbot-json-details';
      details.open = value.length <= 4;

      const summary = document.createElement('summary');
      summary.className = 'chatbot-json-summary';
      summary.textContent = `Array(${value.length})`;
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'chatbot-json-children';
      value.forEach((item, index) => {
        body.appendChild(createJsonTreeNode(String(index), item));
      });
      details.appendChild(body);

      row.appendChild(details);
      return row;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const details = document.createElement('details');
      details.className = 'chatbot-json-details';
      details.open = keys.length <= 5;

      const summary = document.createElement('summary');
      summary.className = 'chatbot-json-summary';
      summary.textContent = `Object(${keys.length})`;
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'chatbot-json-children';
      keys.forEach((childKey) => {
        body.appendChild(createJsonTreeNode(childKey, value[childKey]));
      });
      details.appendChild(body);

      row.appendChild(details);
      return row;
    }

    const valueEl = document.createElement('span');
    if (typeof value === 'string') {
      valueEl.className = 'chatbot-json-string';
      valueEl.textContent = `"${value}"`;
    } else if (typeof value === 'number') {
      valueEl.className = 'chatbot-json-number';
      valueEl.textContent = String(value);
    } else if (typeof value === 'boolean') {
      valueEl.className = 'chatbot-json-boolean';
      valueEl.textContent = String(value);
    } else {
      valueEl.textContent = String(value);
    }
    row.appendChild(valueEl);

    return row;
  }

  function createPanelCard(title, className) {
    const card = document.createElement('section');
    card.className = 'chatbot-card ' + (className || '');

    const header = document.createElement('div');
    header.className = 'chatbot-card-header';
    const heading = document.createElement('div');
    heading.className = 'chatbot-card-title';
    heading.textContent = title;
    const actions = document.createElement('div');
    actions.className = 'chatbot-card-actions';

    header.appendChild(heading);
    header.appendChild(actions);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'chatbot-card-body';
    card.appendChild(body);

    return { card, body, actions };
  }

  function renderJsonViewer(container, title, data) {
    const cardParts = createPanelCard(title, 'chatbot-card-json');
    const raw = JSON.stringify(data, null, 2);
    const copyBtn = createCopyButton(() => copyText(raw));
    cardParts.actions.appendChild(copyBtn);

    cardParts.body.appendChild(createJsonTreeNode(null, data));
    container.appendChild(cardParts.card);
  }

  function renderCodeBlock(container, language, codeText) {
    const normalized = codeText.replace(/\s+$/, '');
    const langLabel = language || 'text';

    if (language === 'json' || language === 'jsonc') {
      try {
        renderJsonViewer(container, `JSON (${langLabel})`, JSON.parse(normalized));
        return;
      } catch {
        // JSON 파싱 실패 시 일반 코드 블록으로 렌더링
      }
    }

    const cardParts = createPanelCard('Code · ' + langLabel, 'chatbot-card-code');
    cardParts.actions.appendChild(createCopyButton(() => copyText(normalized)));

    const pre = document.createElement('pre');
    pre.className = 'chatbot-code-block';
    const code = document.createElement('code');
    code.textContent = normalized;
    pre.appendChild(code);
    cardParts.body.appendChild(pre);

    container.appendChild(cardParts.card);
  }

  function persistChatState() {
    const state = {
      opened,
      scrollTop: messagesEl ? messagesEl.scrollTop : 0,
      input: input ? input.value : '',
    };
    try {
      sessionStorage.setItem(CHATBOT_STATE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage failure
    }
  }

  function restoreChatState() {
    try {
      const raw = sessionStorage.getItem(CHATBOT_STATE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (input && typeof state.input === 'string') {
        input.value = state.input;
        autoResize();
      }
      panel.hidden = !state.opened;
      opened = !!state.opened;
      if (messagesEl && Number.isFinite(state.scrollTop)) {
        messagesEl.scrollTop = state.scrollTop;
      }
    } catch {
      // ignore parse failure
    }
  }

  function updateNavActiveFromPath(pathname) {
    const targetKey = pathname.startsWith('/api-reference')
      ? 'api-reference'
      : pathname.split('/').filter(Boolean)[0] || 'home';
    const tabs = document.querySelectorAll('.top-nav .nav-tab');
    tabs.forEach((tab) => {
      const href = tab.getAttribute('href') || '';
      const tabKey = href.startsWith('/api-reference')
        ? 'api-reference'
        : href.split('/').filter(Boolean)[0] || 'home';
      tab.classList.toggle('active', tabKey === targetKey);
    });
  }

  async function navigateApiReferenceInPlace(url, options) {
    const opts = options || {};
    const parsed = new URL(url, window.location.origin);

    // Same API doc already rendered: skip re-fetching the partial so the
    // current scroll position is preserved. Just update the URL + re-apply focus.
    const onApiReference = window.location.pathname.startsWith('/api-reference');
    const currentDoc = new URLSearchParams(window.location.search).get('doc') || '';
    const nextDoc = parsed.searchParams.get('doc') || '';
    if (onApiReference && currentDoc === nextDoc && document.querySelector('.api-content')) {
      if (!opts.fromPopstate) {
        window.history.pushState({ hapiPartial: true }, '', parsed.pathname + parsed.search + parsed.hash);
      }
      if (typeof window.hapiApiReferenceApplyFocus === 'function') {
        window.hapiApiReferenceApplyFocus();
      }
      return;
    }

    persistChatState();
    const partialUrl = parsed.pathname + parsed.search + (parsed.search ? '&' : '?') + '_partial=1';
    const html = await apiClient.getText(partialUrl);
    const wrapper = document.querySelector('.page-wrapper');
    if (!wrapper) throw new Error('page-wrapper not found');
    wrapper.innerHTML = html;

    const scripts = Array.from(wrapper.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const nextScript = document.createElement('script');
      if (oldScript.src) {
        nextScript.src = oldScript.src;
      } else {
        nextScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(nextScript, oldScript);
    });

    if (!opts.fromPopstate) {
      window.history.pushState({ hapiPartial: true }, '', parsed.pathname + parsed.search + parsed.hash);
    }
    updateNavActiveFromPath(parsed.pathname);
    if (typeof window.hapiApiReferenceApplyFocus === 'function') {
      window.hapiApiReferenceApplyFocus();
    }
    restoreChatState();
  }

  function renderAssistantMessageContent(bubble, content, messageMeta) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chatbot-markdown';

    const segments = parseMarkdownBlocks(content || '');
    const navTargets = buildNavTargets(messageMeta);
    if (segments.length === 0) {
      renderMarkdownText(wrapper, '', navTargets);
    }

    segments.forEach((segment) => {
      if (segment.type === 'text') {
        if (segment.content.trim()) renderMarkdownText(wrapper, segment.content, navTargets);
        return;
      }
      renderCodeBlock(wrapper, segment.language, segment.content);
    });

    if (messageMeta && Array.isArray(messageMeta.apiDocs) && messageMeta.apiDocs.length > 0) {
      renderApiDocTree(wrapper, messageMeta.apiDocs);
    }

    bubble.appendChild(wrapper);
  }

  function appendMessage(role, content, messageMeta) {
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble chatbot-bubble-' + role;
    if (role === 'assistant') {
      renderAssistantMessageContent(bubble, content, messageMeta);
    } else {
      bubble.textContent = content;
    }
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
    persistChatState();
  }
  function closePanel() {
    panel.hidden = true;
    opened = false;
    persistChatState();
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
  input.addEventListener('input', persistChatState);
  messagesEl.addEventListener('scroll', persistChatState);
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
      const trace = data.trace
        ? {
            enabled: data.trace.showApiTrace === true,
            request: data.trace.request || { query: message },
            response: data.trace.response || { reply: data.reply },
            meta: {
              model: data.trace.model,
              iterations: data.trace.iterations,
            },
            toolCalls: Array.isArray(data.trace.toolCalls) ? data.trace.toolCalls : [],
          }
        : null;

      appendMessage('assistant', data.reply, {
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
  });

  document.addEventListener('click', async (e) => {
    const anchor = e.target.closest('a[data-chatbot-nav="api-reference"]');
    if (!anchor) return;
    e.preventDefault();
    const targetUrl = anchor.getAttribute('href');
    if (!targetUrl) return;
    try {
      await navigateApiReferenceInPlace(targetUrl);
    } catch {
      window.location.href = targetUrl;
    }
  });

  window.addEventListener('popstate', async () => {
    if (!window.location.pathname.startsWith('/api-reference')) {
      window.location.href = window.location.pathname + window.location.search + window.location.hash;
      return;
    }
    try {
      await navigateApiReferenceInPlace(window.location.pathname + window.location.search + window.location.hash, {
        fromPopstate: true,
      });
    } catch {
      // fallback to native page behavior on failure
    }
  });

})();
