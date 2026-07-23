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

  // 관리자 화면 전용 — fallback 없이 실제 행을 그대로(플랫) 반환. system_name/system_code 등이
  // 같은 값이면 읽기 화면(getAllGrouped)에서 자동으로 한 그룹(rowspan)으로 묶인다 — commonCodeModel의
  // getAllForAdmin과 동일 패턴.
  async getAllForAdmin() {
    const result = await pool.query(
      'SELECT * FROM system_info ORDER BY display_order, system_code, id'
    );
    return result.rows;
  },

  async create({
    systemName, systemCode, protocol, division, source, target,
    messageFormat, charset, remark, displayOrder,
  }) {
    await pool.query(
      `INSERT INTO system_info
         (system_name, system_code, protocol, division, source, target, message_format, charset, remark, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [systemName, systemCode, protocol, division, source, target, messageFormat, charset, remark, displayOrder || 0]
    );
  },

  async update(id, {
    systemName, systemCode, protocol, division, source, target,
    messageFormat, charset, remark, displayOrder,
  }) {
    await pool.query(
      `UPDATE system_info
       SET system_name=$1, system_code=$2, protocol=$3, division=$4, source=$5, target=$6,
           message_format=$7, charset=$8, remark=$9, display_order=$10
       WHERE id=$11`,
      [systemName, systemCode, protocol, division, source, target, messageFormat, charset, remark, displayOrder || 0, id]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM system_info WHERE id=$1', [id]);
  },
};

module.exports = systemInfoModel;
