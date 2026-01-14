import { pool } from "../libs/db.js";

export async function createWarehouse(ownerId, categories) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create Warehouse
    const [result] = await connection.query(
      `INSERT INTO warehouse (categories, owner_id) VALUES (?, ?)`,
      [categories, ownerId]
    );
    const warehouseId = result.insertId;

    // 2. Update User
    await connection.query(
      `UPDATE users SET warehouse_id = ? WHERE user_id = ?`,
      [warehouseId, ownerId]
    );

    await connection.commit();
    return warehouseId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getWarehouseByToken(token) {
  const [rows] = await pool.query(
    `SELECT * FROM warehouse WHERE invitation_token = ? AND token_expires_at > NOW()`,
    [token]
  );
  return rows[0];
}

export async function getWarehouseById(warehouseId) {
  const [rows] = await pool.query(
    `SELECT * FROM warehouse WHERE warehouse_id = ?`,
    [warehouseId]
  );
  return rows[0];
}

export async function getWarehouseByOwnerId(ownerId) {
  const [rows] = await pool.query(
    `SELECT * FROM warehouse WHERE owner_id = ?`,
    [ownerId]
  );
  return rows[0];
}

export async function updateWarehouseToken(warehouseId, token, expiresAt) {
  await pool.query(
    `UPDATE warehouse SET invitation_token = ?, token_expires_at = ? WHERE warehouse_id = ?`,
    [token, expiresAt, warehouseId]
  );
}
