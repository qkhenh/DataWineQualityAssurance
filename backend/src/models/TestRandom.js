import { pool } from "../libs/db.js";

export async function insertTestResult(testerId, productId, score, description) {
  const [result] = await pool.query(
    `INSERT INTO test_random (tester_id, product_id, score, description) VALUES (?, ?, ?, ?)`,
    [testerId, productId, score, description]
  );
  return result.insertId;
}

export async function getTestHistoryByTesterId(testerId) {
  const [rows] = await pool.query(`
    SELECT 
      tr.test_id,
      tr.product_id,
      tr.score as tester_score,
      tr.description,
      tr.created_at,
      ip.quality_score as model_score
    FROM test_random tr
    LEFT JOIN is_predicted ip ON tr.product_id = ip.product_id
    WHERE tr.tester_id = ?
    ORDER BY tr.created_at DESC
  `, [testerId]);
  return rows;
}
