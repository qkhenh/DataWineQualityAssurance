import { pool } from "../libs/db.js"

export async function getTeamMembers(warehouseId) {
  // We need to left join with all role tables to get specific info
  // We can use COALESCE or just select all fields and handle in application logic, 
  // but a cleaner SQL is better.
  
  const [rows] = await pool.query(`
    SELECT 
      u.user_id, u.username, u.firstname, u.lastname, u.email, u.role, u.exp_year, u.warehouse_id,
      m.department_leading,
      e.expertise,
      t.flavor_profile,
      w.owner_id
    FROM users u
    LEFT JOIN warehouse w ON u.warehouse_id = w.warehouse_id
    LEFT JOIN monitor m ON u.user_id = m.user_id
    LEFT JOIN engineer e ON u.user_id = e.user_id
    LEFT JOIN tester t ON u.user_id = t.user_id
    WHERE u.warehouse_id = ?
  `, [warehouseId])
  
  return rows
}

export async function removeMemberFromWarehouse(userId) {
  await pool.query(`
    UPDATE users 
    SET warehouse_id = NULL 
    WHERE user_id = ?
  `, [userId])
}

export async function getWarehouseOwner(warehouseId) {
    const [rows] = await pool.query(`SELECT owner_id FROM warehouse WHERE warehouse_id = ?`, [warehouseId]);
    return rows[0]?.owner_id;
}
