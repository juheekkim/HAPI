'use strict';

/**
 * 공통 API 클라이언트 래퍼
 * 모든 프론트엔드 API 호출은 이 객체를 통해 수행합니다.
 * 직접 fetch()를 호출하지 않습니다.
 */
const apiClient = {
  async request(method, url, data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { status: res.status, message: err.message || '요청에 실패했습니다.' };
    }
    return res.json();
  },

  get(url)        { return this.request('GET', url); },
  post(url, data) { return this.request('POST', url, data); },
  put(url, data)  { return this.request('PUT', url, data); },
  delete(url)     { return this.request('DELETE', url); },
};
