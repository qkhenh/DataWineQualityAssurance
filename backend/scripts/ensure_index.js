import { pool } from "../src/libs/db.js";

async function ensureIndex() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to database...");

    try {
      // Check if index exists on product(warehouse_id)
      const [indexes] = await connection.query(`SHOW INDEX FROM product WHERE Key_name = 'idx_product_warehouse'`);
      if (indexes.length === 0) {
        console.log("Adding index on product(warehouse_id)...");
        await connection.query(`CREATE INDEX idx_product_warehouse ON product(warehouse_id)`);
        console.log("Index added successfully.");
      } else {
        console.log("Index on product(warehouse_id) already exists.");
      }

    } catch (err) {
      console.error("Index creation failed:", err);
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

ensureIndex();
