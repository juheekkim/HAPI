'use strict';

/**
 * @typedef {Object} ApiSpecParam
 * @property {string} name 파라미터(필드 ID, 점 경로로 계층 표현 가능)
 * @property {string} [label] 파라미터명(한글 표기)
 * @property {'String'|'Integer'|'Number'|'Boolean'|'Object'|'Array'} type
 * @property {boolean} required
 * @property {string} desc 설명(부가 정보/자유 서술)
 */

/**
 * @typedef {Object} ApiSpecEndpoint
 * @property {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} method
 * @property {string} url
 * @property {string} description
 * @property {ApiSpecParam[]} params
 * @property {string|null} responseExample
 */

/**
 * api-form.ejs(수기 작성)이 만들어 서버로 보내는 것과 동일한 형태.
 * 엑셀 업로드 / MCI 주소 가져오기 결과도 반드시 이 구조로 변환한 뒤
 * adminController.createApi/updateApi(=apiSpecModel.create/update)에 그대로 넘긴다.
 * @typedef {Object} ApiSpecInput
 * @property {'resort'|'estate'|'common'} category
 * @property {string} domain
 * @property {string} name
 * @property {string} description
 * @property {ApiSpecEndpoint[]} endpoints
 * @property {number} displayOrder
 */

const ALLOWED_CATEGORIES = ['resort', 'estate', 'common'];
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function toBoolean(value) {
  const v = String(value ?? '')
    .trim()
    .toUpperCase();
  return value === true || v === 'Y' || v === 'TRUE' || v === '1' || v === 'REQUIRED';
}

function normalizeCategory(value) {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  return ALLOWED_CATEGORIES.includes(v) ? v : 'resort';
}

function normalizeMethod(value) {
  const v = String(value ?? '')
    .trim()
    .toUpperCase();
  return ALLOWED_METHODS.includes(v) ? v : 'GET';
}

/**
 * MCI 서비스 주소 조회 결과(JSON)를 ApiSpecInput 하나로 변환한다.
 * MCI 응답의 실제 필드명은 [Needs verification] — 아래는 잠정 매핑(자주 쓰이는 대체 키까지 함께 인식)이며,
 * 연동 확정 시 이 함수만 교체하면 컨트롤러/화면 코드는 손댈 필요가 없다.
 *
 * @param {Record<string, any>} mci
 * @returns {ApiSpecInput}
 */
function mapMciResponseToApiSpec(mci) {
  const src = mci || {};
  const rawEndpoints = src.endpoints || src.operations || [];
  return {
    category: normalizeCategory(src.category),
    domain: String(src.domain ?? src.serviceCode ?? '').trim(),
    name: String(src.name ?? src.serviceName ?? '').trim(),
    description: String(src.description ?? '').trim(),
    displayOrder: Number(src.displayOrder) || 0,
    endpoints: rawEndpoints.map((op) => ({
      method: normalizeMethod(op.method ?? op.httpMethod),
      url: String(op.url ?? op.path ?? '').trim(),
      description: String(op.description ?? '').trim(),
      params: (op.params ?? op.parameters ?? []).map((p) => ({
        name: String(p.name ?? '').trim(),
        label: String(p.label ?? '').trim(),
        type: String(p.type ?? 'String').trim() || 'String',
        required: toBoolean(p.required),
        desc: String(p.desc ?? p.description ?? '').trim(),
      })),
      responseExample: op.responseExample ?? op.example ?? null,
    })),
  };
}

// ── HABIS "모델 정의서" 엑셀 → ApiSpecInput ─────────────────────────────
// 실제 사내 표준 양식(2026-07 샘플, 골프 키오스크 HBSGOLOCH0119 시트) 기준.
// 워크북 1개 = API 1개(도메인), 시트명이 "#1", "#2", "#3-1"...인 시트 각각 = 엔드포인트 1개.
// 시트 상단 메타(시스템명/SVC명/업무설명)와 [INPUT]/[OUTPUT] 필드 표(필드ID/필드명/오브젝트명/
// 사용여부/길이/소수점/Default/배열형태, ▷ 들여쓰기로 Group 하위 표현)를 라벨 텍스트 기준으로 찾는다
// (셀 위치가 아니라 헤더 문구로 컬럼을 찾으므로 워크북마다 컬럼 순서가 조금 달라도 견딘다).
//
// 이 레거시 포맷엔 REST method/URL이 없다(고정 게이트웨이 + SVC ID 체계, docs/api.md 헤더 참조) —
// method는 'POST' 고정, url엔 SVC ID를 그대로 넣는다. 필수여부(Y/N) 컬럼도 없어 required는 항상 false로
// 채운다 — 등록 화면에서 관리자가 검토 후 필요시 체크하는 것을 전제로 한다.
// 사용여부 컬럼값(예: "NOT USE")은 필드 제외 기준으로 쓰지 않는다 — 실제 샘플에서 조회조건 그룹의
// 필드가 전부 NOT USE로 표시된 경우가 있어(= "선택값" 의미로 추정, "필드 없음"이 아님), 제외하면
// 파라미터가 통째로 비어버리는 사고가 난다. 대신 값을 설명에 그대로 남겨 관리자가 판단하게 한다.

const META_LABELS = { SVC명: 'svcId', 업무설명: 'businessDesc', 시스템명: 'systemName' };

const COLUMN_SYNONYMS = {
  필드ID: 'id',
  필드명: 'label',
  오브젝트명: 'type',
  사용여부: 'usage',
  길이: 'length',
  소수점: 'decimal',
  Default: 'default',
  배열형태: 'isArray',
  배열여부: 'isArray',
  비고: 'note',
};

const SCAN_MAX_COL = 20;

function getCellText(cell) {
  if (!cell) return '';
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('').trim();
    if ('text' in v) return String(v.text).trim();
    if ('result' in v) return String(v.result ?? '').trim();
    return '';
  }
  return String(v).trim();
}

function scanMeta(sheet) {
  const meta = {};
  const maxRow = Math.min(sheet.rowCount || 0, 10);
  for (let r = 1; r <= maxRow; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= SCAN_MAX_COL; c++) {
      const key = META_LABELS[getCellText(row.getCell(c))];
      if (!key || meta[key]) continue;
      for (let nc = c + 1; nc <= SCAN_MAX_COL; nc++) {
        const val = getCellText(row.getCell(nc));
        if (val) {
          meta[key] = val;
          break;
        }
      }
    }
  }
  return meta;
}

function findMarkerRow(sheet, marker) {
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= SCAN_MAX_COL; c++) {
      if (getCellText(row.getCell(c)).toUpperCase().includes(marker)) return r;
    }
  }
  return -1;
}

function findHeaderRow(sheet, fromRow) {
  const lastRow = Math.min(fromRow + 5, sheet.rowCount);
  for (let r = fromRow; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= SCAN_MAX_COL; c++) {
      if (getCellText(row.getCell(c)) === '필드ID') return r;
    }
  }
  return -1;
}

function buildColumnMap(sheet, headerRow) {
  const row = sheet.getRow(headerRow);
  const map = {};
  for (let c = 1; c <= SCAN_MAX_COL; c++) {
    const key = COLUMN_SYNONYMS[getCellText(row.getCell(c))];
    if (key) map[key] = c;
  }
  return map;
}

// 헤더 다음 행부터 필드ID/필드명이 둘 다 빈 행을 만날 때까지 읽는다(= 섹션 끝).
// ▷ 개수로 Group 하위 depth를 판단한다.
function parseFieldRows(sheet, headerRow, colMap) {
  const fields = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const idRaw = colMap.id ? getCellText(row.getCell(colMap.id)) : '';
    const label = colMap.label ? getCellText(row.getCell(colMap.label)) : '';
    if (!idRaw && !label) break;
    const depth = (idRaw.match(/▷/g) || []).length;
    const id = idRaw.replace(/[▷\s]+/g, '');
    if (!id) break;
    fields.push({
      depth,
      id,
      label,
      type: colMap.type ? getCellText(row.getCell(colMap.type)) : '',
      usage: colMap.usage ? getCellText(row.getCell(colMap.usage)) : '',
      length: colMap.length ? getCellText(row.getCell(colMap.length)) : '',
      decimal: colMap.decimal ? getCellText(row.getCell(colMap.decimal)) : '',
      default: colMap.default ? getCellText(row.getCell(colMap.default)) : '',
      isArray: colMap.isArray ? getCellText(row.getCell(colMap.isArray)) : '',
      note: colMap.note ? getCellText(row.getCell(colMap.note)) : '',
    });
  }
  return fields;
}

function isGroupField(f) {
  return f.type.trim().toLowerCase() === 'group';
}

function isNotUsed(f) {
  return f.usage.trim().toUpperCase() === 'NOT USE';
}

// [INPUT] 필드 목록 → 파라미터 목록(Group은 컨테이너일 뿐이라 제외, 하위 필드 name은 점 경로로 펼침).
// name=필드ID(점 경로), label=필드명(한글), desc=길이/소수점/Default/배열/사용여부 등 부가 정보.
// 사용여부가 NOT USE인 필드도 목록엔 남기고 설명에만 표시한다(위 주석 참조 — 제외하면 데이터 유실 위험).
function buildParams(fields) {
  const params = [];
  const pathStack = [];
  for (const f of fields) {
    pathStack[f.depth] = f.id;
    if (isGroupField(f)) continue;
    const noteParts = [];
    if (isNotUsed(f)) noteParts.push('사용여부:NOT USE');
    if (f.length && f.length.toUpperCase() !== 'NOT USE') noteParts.push('길이:' + f.length);
    if (f.decimal && f.decimal !== '0') noteParts.push('소수점:' + f.decimal);
    if (f.default) noteParts.push('Default:' + f.default);
    if (f.isArray.toUpperCase() === 'Y') noteParts.push('배열');
    if (f.note) noteParts.push(f.note);
    params.push({
      name: pathStack.slice(0, f.depth + 1).join('.'),
      label: f.label,
      type: f.type.trim().toLowerCase() === 'numeric' ? 'Number' : f.type || 'String',
      required: false,
      desc: noteParts.join(', '),
    });
  }
  return params;
}

// [OUTPUT] 필드 목록 → 중첩 JSON 예시 객체(Group=하위 오브젝트, 배열형태=Y면 배열로 감쌈).
// buildParams와 동일한 이유로 NOT USE 필드도 포함한다.
function buildResponseExampleObject(fields) {
  const root = {};
  const stack = [{ depth: -1, node: root }];
  for (const f of fields) {
    while (stack.length > 1 && stack[stack.length - 1].depth >= f.depth) stack.pop();
    const parent = stack[stack.length - 1].node;
    if (isGroupField(f)) {
      const child = {};
      parent[f.id] = f.isArray.toUpperCase() === 'Y' ? [child] : child;
      stack.push({ depth: f.depth, node: child });
    } else {
      const placeholder = f.type.trim().toLowerCase() === 'numeric' ? 0 : '';
      parent[f.id] = f.isArray.toUpperCase() === 'Y' ? [placeholder] : placeholder;
    }
  }
  return root;
}

// 공통 코어: {svcId, businessDesc, inputFields, outputFields}(필드 파싱 결과, 출처는 엑셀 셀이든
// 비전 모델 추출 결과든 상관없음) → ApiSpecEndpoint 1개. 엑셀 경로(mapEndpointSheet)와 이미지 경로
// (mapImageExtractionsToApiSpec)가 이 함수 하나를 공유해 규칙(NOT USE 처리, 도메인 추천 등)이 갈라지지 않게 한다.
function buildEndpointFromFields({ svcId, businessDesc, inputFields, outputFields }, fallbackLabel) {
  const params = buildParams(inputFields || []);
  const responseExample =
    outputFields && outputFields.length
      ? JSON.stringify(buildResponseExampleObject(outputFields), null, 2)
      : null;
  return {
    method: 'POST',
    url: svcId || fallbackLabel,
    description: businessDesc || fallbackLabel,
    params,
    responseExample,
  };
}

function mapEndpointSheet(sheet) {
  const meta = scanMeta(sheet);
  let inputFields = [];
  let outputFields = [];

  const inputMarkerRow = findMarkerRow(sheet, '[INPUT]');
  if (inputMarkerRow > 0) {
    const headerRow = findHeaderRow(sheet, inputMarkerRow);
    if (headerRow > 0) {
      inputFields = parseFieldRows(sheet, headerRow, buildColumnMap(sheet, headerRow));
    }
  }

  const outputMarkerRow = findMarkerRow(sheet, '[OUTPUT]');
  if (outputMarkerRow > 0) {
    const headerRow = findHeaderRow(sheet, outputMarkerRow);
    if (headerRow > 0) {
      outputFields = parseFieldRows(sheet, headerRow, buildColumnMap(sheet, headerRow));
    }
  }

  return buildEndpointFromFields(
    { svcId: meta.svcId, businessDesc: meta.businessDesc, inputFields, outputFields },
    sheet.name
  );
}

// 도메인 코드 추천값: 업무설명에서 알아볼 수 있는 단어만 뽑아 짧은 약어로 PascalCase 이어붙인다
// (예: "OCH / KIOSK / 예약정보 조회" → "OchKioskRsvLkup"). 사전에 없는 한글 단어는 억지로
// 로마자화하지 않고 건너뛴다(엉뚱한 스펠링보다 짧더라도 정확한 편이 낫다).
// apiSpecModel의 domain은 UNIQUE라 겹칠 수 있지만, 겹치면 adminController.createApi가 23505를
// 잡아 "이미 등록된 도메인 코드입니다" 에러로 보여주므로 관리자가 그 자리에서 고치면 된다
// (자동입력은 초안일 뿐 최종 등록 전에 항상 검토·수정 가능 — 화면에서도 값이 아니라 "추천값" 힌트로만 보여줌).
const KOREAN_KEYWORD_MAP = [
  ['예약정보', 'Rsv'],
  ['예약', 'Rsv'],
  ['조회', 'Lkup'],
  ['등록', 'Reg'],
  ['수정', 'Upd'],
  ['변경', 'Upd'],
  ['취소', 'Cncl'],
  ['확인', 'Chk'],
  ['인증', 'Auth'],
  ['결제', 'Pay'],
  ['환불', 'Rfnd'],
  ['재고', 'Stock'],
  ['알림', 'Ntfy'],
  ['회원', 'Mbr'],
  ['포인트', 'Pt'],
  ['쿠폰', 'Cpn'],
  ['상품', 'Prod'],
  ['콘도', 'Condo'],
  ['골프', 'Golf'],
  ['리조트', 'Rsrt'],
  ['에스테이트', 'Est'],
  ['부대시설', 'Fclty'],
  ['키오스크', 'Kiosk'],
].sort((a, b) => b[0].length - a[0].length); // 긴 단어부터 매칭(예: "예약정보"가 "예약"에 먹히지 않게)

const ASCII_WORD_MAX_LEN = 5; // 영문 토큰(예: KIOSK)도 너무 길면 5자로 잘라 짧게 유지

function toPascalWord(token) {
  const lower = String(token).toLowerCase().slice(0, ASCII_WORD_MAX_LEN);
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// 업무설명 문자열에서 (a) 사전에 있는 한글 키워드 (b) 영문 토큰을 원문 등장 순서대로 뽑아
// PascalCase 단어 배열로 반환한다. 뽑아낸 자리는 공백으로 지워 같은 키워드 재검색을 막는다.
function extractKeywords(text) {
  let remaining = String(text || '');
  const matches = [];
  for (const [kr, en] of KOREAN_KEYWORD_MAP) {
    let idx = remaining.indexOf(kr);
    while (idx !== -1) {
      matches.push({ idx, word: en });
      remaining = remaining.slice(0, idx) + ' '.repeat(kr.length) + remaining.slice(idx + kr.length);
      idx = remaining.indexOf(kr);
    }
  }
  const asciiRe = /[A-Za-z]{2,}/g;
  let m;
  while ((m = asciiRe.exec(remaining))) {
    matches.push({ idx: m.index, word: toPascalWord(m[0]) });
  }
  matches.sort((a, b) => a.idx - b.idx);

  const seen = new Set();
  const words = [];
  for (const { word } of matches) {
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

function suggestDomainName(meta, fallbackName) {
  const words = extractKeywords(meta.businessDesc).slice(0, 3);
  if (words.length) return words.join('');
  // 업무설명에서 알아볼 수 있는 단어가 하나도 없으면 SVC ID/파일명이라도 PascalCase 근사치로.
  const raw = String(meta.svcId || fallbackName || '').replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  return raw ? raw.split(/\s+/).map(toPascalWord).join('') : '';
}

// endpoints[] + 첫 엔드포인트의 meta(svcId/businessDesc) → ApiSpecInput 1건.
// 엑셀/이미지 두 경로가 공유(워크북 1개 또는 이미지 묶음 1개 = API 1개, 도메인은 항상 추천값일 뿐 —
// 화면에서도 실제로 채워 넣지 않고 "추천" 힌트로만 보여준다).
function assembleApiSpecInput(endpoints, firstMeta, fallbackName) {
  return {
    category: 'resort',
    domain: suggestDomainName(firstMeta, fallbackName),
    name: firstMeta.businessDesc || fallbackName || '',
    description: firstMeta.businessDesc || '',
    displayOrder: 0,
    endpoints,
  };
}

/**
 * HABIS "모델 정의서" 워크북(ExcelJS Workbook, 이미 .xlsx.load()된 상태) → ApiSpecInput 1건.
 * "#1", "#2", "#3-1"... 이름의 시트를 각각 엔드포인트로 매핑한다(워크북 순서 유지).
 * domain은 업무설명에서 알아볼 수 있는 단어를 PascalCase로 이어붙인 추천값이다(suggestDomainName
 * 참조, 없으면 SVC ID/파일명으로 대체). category는 이 문서만으로는 신뢰성 있게 알 수 없어
 * 'resort' 기본값을 두고 관리자가 등록 화면에서 검토 후 바꿔야 한다.
 *
 * @param {import('exceljs').Workbook} workbook
 * @param {string} [fallbackName] 시트에서 SVC ID/업무설명을 못 찾았을 때 쓸 이름(보통 업로드 파일명)
 * @returns {ApiSpecInput}
 */
function mapHabisWorkbookToApiSpec(workbook, fallbackName) {
  const endpointSheets = workbook.worksheets.filter((ws) => /^#\d/.test((ws.name || '').trim()));
  const endpoints = endpointSheets.map(mapEndpointSheet);
  const firstMeta = endpointSheets.length ? scanMeta(endpointSheets[0]) : {};
  return assembleApiSpecInput(endpoints, firstMeta, fallbackName);
}

/**
 * 이미지(사진/스크린샷) 업로드 경로. 이미지 1장당 Claude Vision으로 뽑아낸 추출 결과 1건을 받는다
 * (호출부인 adminController.importApisFromImage가 Vision API를 호출해 이 형태로 변환해서 넘긴다).
 * 각 추출 결과의 shape은 엑셀 파싱 결과와 동일 — {svcId, businessDesc, inputFields, outputFields},
 * 필드는 {depth, id, label, type, usage, length, decimal, default, isArray, note} — 이므로
 * buildEndpointFromFields를 그대로 재사용해 엑셀 경로와 규칙이 갈라지지 않는다.
 * 이미지 여러 장 = 엔드포인트 여러 개(시트 "#1","#2"...에 대응하는 스크린샷 여러 장이라는 전제).
 *
 * @param {Array<{svcId:string, businessDesc:string, inputFields:object[], outputFields:object[]}>} extractions
 * @param {string} [fallbackName]
 * @returns {ApiSpecInput}
 */
function mapImageExtractionsToApiSpec(extractions, fallbackName) {
  const list = extractions || [];
  const endpoints = list.map((ex, i) =>
    buildEndpointFromFields(
      {
        svcId: ex.svcId,
        businessDesc: ex.businessDesc,
        inputFields: ex.inputFields || [],
        outputFields: ex.outputFields || [],
      },
      `이미지 ${i + 1}`
    )
  );
  const firstMeta = list.length ? { svcId: list[0].svcId, businessDesc: list[0].businessDesc } : {};
  return assembleApiSpecInput(endpoints, firstMeta, fallbackName);
}

module.exports = { mapMciResponseToApiSpec, mapHabisWorkbookToApiSpec, mapImageExtractionsToApiSpec };
