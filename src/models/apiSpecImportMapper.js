'use strict';

/**
 * @typedef {Object} ApiSpecParam
 * @property {string} name
 * @property {'String'|'Integer'|'Number'|'Boolean'|'Object'|'Array'} type
 * @property {boolean} required
 * @property {string} desc
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
 * 엑셀 시트를 파싱해 얻은 평면 행(rows)을 도메인 단위로 묶어 ApiSpecInput[]로 변환한다.
 * "시트 1행 = 엔드포인트의 파라미터 1개" 레이아웃을 전제로 한다(같은 domain+method+url이
 * 반복되면 같은 엔드포인트로 묶고 파라미터만 누적).
 *
 * 기대 컬럼(헤더행, 좌→우 예시):
 *   category, domain, name, description, display_order,
 *   method, url, endpoint_description, response_example,
 *   param_name, param_type, param_required, param_desc
 *
 * [Needs verification] 실제 엑셀 양식은 기획/팀 협의로 확정 필요 — 위 컬럼셋은 제안안이며,
 * 이 함수 자체는 "행(rows)이 이미 파싱되어 있다"고 가정한다. .xlsx 바이너리를 rows로
 * 바꾸는 단계(예: xlsx 라이브러리)는 아직 연동 전이다 — adminController.importApisFromExcel 참조.
 *
 * @param {Record<string, any>[]} rows
 * @returns {ApiSpecInput[]}
 */
function mapExcelRowsToApiSpecs(rows) {
  const byDomain = new Map();

  for (const row of rows || []) {
    const domain = String(row.domain ?? '').trim();
    if (!domain) continue; // 도메인 코드 없는 행은 스킵

    if (!byDomain.has(domain)) {
      byDomain.set(domain, {
        category: normalizeCategory(row.category),
        domain,
        name: String(row.name ?? '').trim(),
        description: String(row.description ?? '').trim(),
        displayOrder: Number(row.display_order) || 0,
        endpoints: [],
      });
    }
    const spec = byDomain.get(domain);

    const url = String(row.url ?? '').trim();
    if (!url) continue;

    const method = normalizeMethod(row.method);
    let endpoint = spec.endpoints.find((ep) => ep.url === url && ep.method === method);
    if (!endpoint) {
      endpoint = {
        method,
        url,
        description: String(row.endpoint_description ?? '').trim(),
        params: [],
        responseExample: row.response_example ? String(row.response_example) : null,
      };
      spec.endpoints.push(endpoint);
    }

    const paramName = String(row.param_name ?? '').trim();
    if (paramName) {
      endpoint.params.push({
        name: paramName,
        type: String(row.param_type ?? 'String').trim() || 'String',
        required: toBoolean(row.param_required),
        desc: String(row.param_desc ?? '').trim(),
      });
    }
  }

  return Array.from(byDomain.values());
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
        type: String(p.type ?? 'String').trim() || 'String',
        required: toBoolean(p.required),
        desc: String(p.desc ?? p.description ?? '').trim(),
      })),
      responseExample: op.responseExample ?? op.example ?? null,
    })),
  };
}

module.exports = { mapExcelRowsToApiSpecs, mapMciResponseToApiSpec };
