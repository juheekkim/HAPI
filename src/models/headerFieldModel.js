'use strict';

const pool = require('../config/database');

const headerFieldModel = {
  async getBySection(section) {
    try {
      const result = await pool.query(
        `SELECT * FROM header_fields
         WHERE section = $1
         ORDER BY display_order ASC`,
        [section]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching header fields by section:', error);
      return [];
    }
  },

  async getByCategory(section, category) {
    try {
      const result = await pool.query(
        `SELECT * FROM header_fields
         WHERE section = $1 AND category = $2
         ORDER BY display_order ASC`,
        [section, category]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching header fields by category:', error);
      return [];
    }
  },

  async getAllSections() {
    try {
      const result = await pool.query(
        `SELECT DISTINCT section FROM header_fields ORDER BY section`
      );
      return result.rows.map(r => r.section);
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  },

  async getAllWithGrouping() {
    try {
      const result = await pool.query(
        `SELECT section, category,
                array_agg(
                  json_build_object(
                    'id', id,
                    'fieldNameKo', field_name_ko,
                    'fieldNameEn', field_name_en,
                    'itemType', item_type,
                    'length', length,
                    'fieldOffset', field_offset,
                    'requiredRequest', required_request,
                    'requiredMci', required_mci,
                    'requiredResponse', required_response,
                    'description', description,
                    'settingType', setting_type,
                    'settingValue', setting_value
                  ) ORDER BY display_order
                ) as fields
         FROM header_fields
         GROUP BY section, category
         ORDER BY section, COALESCE(category, '')`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching all header fields with grouping:', error);
      return [];
    }
  },

  async create(data) {
    const {
      section, category, fieldNameKo, fieldNameEn, itemType,
      length, fieldOffset, requiredRequest, requiredMci, requiredResponse,
      description, settingType, settingValue, displayOrder
    } = data;

    try {
      const result = await pool.query(
        `INSERT INTO header_fields
         (section, category, field_name_ko, field_name_en, item_type,
          length, field_offset, required_request, required_mci, required_response,
          description, setting_type, setting_value, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [section, category, fieldNameKo, fieldNameEn, itemType,
         length, fieldOffset, requiredRequest, requiredMci, requiredResponse,
         description, settingType, settingValue, displayOrder || 0]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating header field:', error);
      return null;
    }
  },

  async update(id, data) {
    const {
      section, category, fieldNameKo, fieldNameEn, itemType,
      length, fieldOffset, requiredRequest, requiredMci, requiredResponse,
      description, settingType, settingValue, displayOrder
    } = data;

    try {
      const result = await pool.query(
        `UPDATE header_fields
         SET section = $1, category = $2, field_name_ko = $3, field_name_en = $4,
             item_type = $5, length = $6, field_offset = $7, required_request = $8,
             required_mci = $9, required_response = $10, description = $11,
             setting_type = $12, setting_value = $13, display_order = $14
         WHERE id = $15
         RETURNING *`,
        [section, category, fieldNameKo, fieldNameEn, itemType,
         length, fieldOffset, requiredRequest, requiredMci, requiredResponse,
         description, settingType, settingValue, displayOrder || 0, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating header field:', error);
      return null;
    }
  },

  async delete(id) {
    try {
      await pool.query('DELETE FROM header_fields WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting header field:', error);
      return false;
    }
  }
};

module.exports = headerFieldModel;
