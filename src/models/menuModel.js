'use strict';

const pool = require('../config/database');

const menuModel = {
  // 평면 조회 (테이블 표시 / 상위 메뉴 select 드롭다운용)
  async getAll() {
    try {
      const result = await pool.query(
        'SELECT * FROM menus ORDER BY COALESCE(parent_id, 0) ASC, display_order ASC, id ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching menus:', error);
      return [];
    }
  },

  // API Reference 좌측 사이드바를 role(code) 매핑 기준으로 구성 (임의 depth 재귀).
  // API 대메뉴 하위 서브트리를 그대로 따라가며 role에 매핑된 링크만 노출.
  // 노드 유지 조건: (path 있고 매핑됨) 또는 (살아남은 자식 있음).
  // 반환 형태(중첩): [{ name, icon, path, doc, isLink, children:[...] }]
  async getApiSidebarByRole(roleCode) {
    try {
      const mapRes = await pool.query(
        `SELECT menu_id FROM role_menus WHERE role_id = (SELECT id FROM roles WHERE code = $1)`,
        [roleCode]
      );
      const allowed = new Set(mapRes.rows.map((r) => r.menu_id));

      const roots = await this.getAllWithChildren();
      const api = roots.find(
        (n) => n.menu_type === 'nav' && (n.path || '').startsWith('/api-reference')
      );
      if (!api) return [];

      const build = (node) => {
        const children = (node.children || []).map(build).filter(Boolean);
        const isLink = !!node.path && allowed.has(node.id);
        if (!isLink && children.length === 0) return null; // 매핑도 없고 보여줄 자식도 없음
        const doc = ((node.path || '').split('doc=')[1] || '').split('&')[0] || null;
        return { name: node.name, icon: node.icon, path: node.path, doc, isLink, children };
      };

      return (api.children || []).map(build).filter(Boolean);
    } catch (error) {
      console.error('Error building API sidebar by role:', error);
      return [];
    }
  },

  // 계층 트리 조립 (평면 1회 조회 후 parent_id로 children 구성)
  async getAllWithChildren() {
    try {
      const result = await pool.query(
        'SELECT * FROM menus ORDER BY display_order ASC, id ASC'
      );
      const byId = new Map(result.rows.map((r) => [r.id, { ...r, children: [] }]));
      const roots = [];
      for (const node of byId.values()) {
        if (node.parent_id && byId.has(node.parent_id)) {
          byId.get(node.parent_id).children.push(node);
        } else {
          roots.push(node);
        }
      }
      return roots;
    } catch (error) {
      console.error('Error building menu tree:', error);
      return [];
    }
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM menus WHERE id=$1', [id]);
    return result.rows[0];
  },

  // 상단 대메뉴 중 해당 role(code)에 매핑되고 활성인 것만 (헤더 동적 노출용)
  // admin_only 메뉴는 admin role에만 노출(방어적 가드).
  async getNavMenusByRole(roleCode) {
    try {
      const result = await pool.query(
        `SELECT m.*
         FROM menus m
         JOIN role_menus rm ON rm.menu_id = m.id
         JOIN roles r ON r.id = rm.role_id
         WHERE r.code = $1
           AND m.parent_id IS NULL
           AND m.menu_type = 'nav'
           AND m.is_active = true
           AND (m.admin_only = false OR r.code = 'admin')
         ORDER BY m.display_order ASC, m.id ASC`,
        [roleCode]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching nav menus by role:', error);
      return [];
    }
  },

  async create({ parentId, name, path, menuType, icon, adminOnly, displayOrder, isActive }) {
    const result = await pool.query(
      `INSERT INTO menus (parent_id, name, path, menu_type, icon, admin_only, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        parentId || null,
        name,
        path || null,
        menuType || 'nav',
        icon || null,
        adminOnly === true,
        Number(displayOrder) || 0,
        isActive !== false,
      ]
    );
    return result.rows[0];
  },

  async update(id, { parentId, name, path, menuType, icon, adminOnly, displayOrder, isActive }) {
    const result = await pool.query(
      `UPDATE menus
       SET parent_id=$1, name=$2, path=$3, menu_type=$4, icon=$5,
           admin_only=$6, display_order=$7, is_active=$8, updated_at=now()
       WHERE id=$9 RETURNING *`,
      [
        parentId || null,
        name,
        path || null,
        menuType || 'nav',
        icon || null,
        adminOnly === true,
        Number(displayOrder) || 0,
        isActive !== false,
        id,
      ]
    );
    return result.rows[0];
  },

  async toggleActive(id) {
    const result = await pool.query(
      'UPDATE menus SET is_active = NOT is_active, updated_at = now() WHERE id=$1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // 하위 메뉴는 FK ON DELETE CASCADE로 함께 삭제됨
  async delete(id) {
    await pool.query('DELETE FROM menus WHERE id=$1', [id]);
  },
};

module.exports = menuModel;
