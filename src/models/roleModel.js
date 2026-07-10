'use strict';

const pool = require('../config/database');

const roleModel = {
  async getAll() {
    try {
      const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
      return result.rows;
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  // 관리 화면용 (fallback 없이 원본 rows)
  async getAllForAdmin() {
    const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM roles WHERE id=$1', [id]);
    return result.rows[0];
  },

  // 역할 1건 + 매핑된 menu_ids 배열
  async getWithMenuIds(id) {
    const result = await pool.query(
      `SELECT r.*,
              COALESCE(array_agg(rm.menu_id) FILTER (WHERE rm.menu_id IS NOT NULL), '{}') AS menu_ids
       FROM roles r
       LEFT JOIN role_menus rm ON rm.role_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );
    return result.rows[0];
  },

  // 매트릭스 화면용: { roleId: [menuId, ...] } (N+1 방지, 1쿼리)
  async getAllMenuIdsByRole() {
    try {
      const result = await pool.query(
        `SELECT role_id, array_agg(menu_id) AS menu_ids
         FROM role_menus
         GROUP BY role_id`
      );
      const map = {};
      for (const row of result.rows) {
        map[row.role_id] = row.menu_ids;
      }
      return map;
    } catch (error) {
      console.error('Error fetching role-menu map:', error);
      return {};
    }
  },

  async create({ code, name, description, isActive }) {
    const result = await pool.query(
      `INSERT INTO roles (code, name, description, is_active)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [code, name, description || null, isActive !== false]
    );
    return result.rows[0];
  },

  async update(id, { code, name, description, isActive }) {
    const result = await pool.query(
      `UPDATE roles
       SET code=$1, name=$2, description=$3, is_active=$4, updated_at=now()
       WHERE id=$5 RETURNING *`,
      [code, name, description || null, isActive !== false, id]
    );
    return result.rows[0];
  },

  // 매핑은 FK ON DELETE CASCADE로 함께 삭제됨
  async delete(id) {
    await pool.query('DELETE FROM roles WHERE id=$1', [id]);
  },

  // 역할의 메뉴 매핑을 통째로 교체 (트랜잭션)
  async setMenus(roleId, menuIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM role_menus WHERE role_id = $1', [roleId]);
      if (menuIds && menuIds.length) {
        await client.query(
          `INSERT INTO role_menus (role_id, menu_id)
           SELECT $1, m FROM unnest($2::int[]) AS m
           ON CONFLICT DO NOTHING`,
          [roleId, menuIds.map(Number)]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = roleModel;
