'use strict';

const pool = require('../config/database');

const commonCodeModel = {
  // group_code 단위로 묶어 반환한다(사업장코드/BRCH_CD처럼 그룹당 세부 코드가 여러 건) —
  // _commonCodeTable.ejs가 rowspan 렌더링에 사용(systemInfoModel.getAllGrouped와 동일 패턴).
  async getAllGrouped() {
    try {
      const result = await pool.query(
        `SELECT group_code, group_name,
                array_agg(
                  json_build_object('detailCode', detail_code, 'description', description)
                  ORDER BY display_order
                ) as rows
         FROM common_codes
         GROUP BY group_code, group_name
         ORDER BY MIN(display_order)`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching common codes:', error);
      return [];
    }
  },

  // 관리자 화면 전용 — fallback 없이 실제 행을 그대로(플랫) 반환. group_code로 뭉쳐 보여주되
  // 각 행이 개별 CRUD 대상(id 기준)이라 getAllGrouped()의 array_agg 결과와는 별도로 둔다.
  async getAllForAdmin() {
    const result = await pool.query(
      'SELECT * FROM common_codes ORDER BY display_order, group_code, id'
    );
    return result.rows;
  },

  async create({ groupCode, groupName, detailCode, description, displayOrder }) {
    await pool.query(
      `INSERT INTO common_codes (group_code, group_name, detail_code, description, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupCode, groupName, detailCode, description, displayOrder || 0]
    );
  },

  async update(id, { groupCode, groupName, detailCode, description, displayOrder }) {
    await pool.query(
      `UPDATE common_codes
       SET group_code=$1, group_name=$2, detail_code=$3, description=$4, display_order=$5
       WHERE id=$6`,
      [groupCode, groupName, detailCode, description, displayOrder || 0, id]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM common_codes WHERE id=$1', [id]);
  },
};

module.exports = commonCodeModel;
