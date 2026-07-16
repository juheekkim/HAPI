'use strict';

const pool = require('../config/database');

const systemInfoModel = {
  // system_code 단위로 묶어 반환한다(같은 시스템의 회원/비회원 등 division별 행을
  // rows 배열로 aggregate) — _systemInfoTable.ejs가 rowspan 렌더링에 사용.
  async getAllGrouped() {
    try {
      const result = await pool.query(
        `SELECT system_name, system_code, protocol, target, message_format, charset, remark,
                array_agg(
                  json_build_object('id', id, 'division', division, 'source', source)
                  ORDER BY display_order
                ) as rows
         FROM system_info
         GROUP BY system_name, system_code, protocol, target, message_format, charset, remark
         ORDER BY MIN(display_order)`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching system info:', error);
      return [];
    }
  },
};

module.exports = systemInfoModel;
