import { pool } from "../libs/db.js";

// --- Alerts ---

export async function createAlert({ warehouse_id, product_id, title, description }) {
  const [result] = await pool.query(
    `INSERT INTO alerts (warehouse_id, product_id, title, description) VALUES (?, ?, ?, ?)`,
    [warehouse_id, product_id, title, description]
  );
  return result.insertId;
}

export async function getAlertsByWarehouse(warehouseId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT * FROM alerts WHERE warehouse_id = ? ORDER BY created_at DESC LIMIT ?`,
    [warehouseId, limit]
  );
  return rows;
}

export async function getUnreadAlertCount(warehouseId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM alerts WHERE warehouse_id = ? AND is_read = FALSE`,
    [warehouseId]
  );
  return rows[0].count;
}

export async function markAlertAsRead(alertId) {
  await pool.query(
    `UPDATE alerts SET is_read = TRUE WHERE alert_id = ?`,
    [alertId]
  );
}

export async function updateAlertReadStatus(alertId, isRead) {
  await pool.query(
    `UPDATE alerts SET is_read = ? WHERE alert_id = ?`,
    [isRead, alertId]
  );
}

export async function markAllAlertsAsRead(warehouseId) {
  await pool.query(
    `UPDATE alerts SET is_read = TRUE WHERE warehouse_id = ?`,
    [warehouseId]
  );
}

export async function deleteReadAlerts(warehouseId) {
  await pool.query(
    `DELETE FROM alerts WHERE warehouse_id = ? AND is_read = TRUE`,
    [warehouseId]
  );
}

export async function getAlertById(alertId) {
  const [rows] = await pool.query(
    `SELECT * FROM alerts WHERE alert_id = ?`,
    [alertId]
  );
  return rows[0];
}

export async function deleteAlert(alertId) {
  await pool.query(
    `DELETE FROM alerts WHERE alert_id = ?`,
    [alertId]
  );
}

// --- Settings ---

export async function getAlertSettings(warehouseId) {
  const [rows] = await pool.query(
    `SELECT * FROM alert_settings WHERE warehouse_id = ?`,
    [warehouseId]
  );
  return rows;
}

export async function deleteAlertSetting(warehouseId, metric) {
  await pool.query(
    `DELETE FROM alert_settings WHERE warehouse_id = ? AND metric = ?`,
    [warehouseId, metric]
  );
}

export async function upsertAlertSetting(warehouseId, metric, minValue, maxValue, enabled) {
  console.log(`[DB Upsert] Warehouse: ${warehouseId}, Metric: ${metric}, Min: ${minValue}, Max: ${maxValue}, Enabled: ${enabled}`);
  // Check if exists
  const [existing] = await pool.query(
    `SELECT setting_id FROM alert_settings WHERE warehouse_id = ? AND metric = ?`,
    [warehouseId, metric]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE alert_settings SET min_value = ?, max_value = ?, enabled = ? WHERE setting_id = ?`,
      [minValue, maxValue, enabled, existing[0].setting_id]
    );
  } else {
    await pool.query(
      `INSERT INTO alert_settings (warehouse_id, metric, min_value, max_value, enabled) VALUES (?, ?, ?, ?, ?)`,
      [warehouseId, metric, minValue, maxValue, enabled]
    );
  }
}
