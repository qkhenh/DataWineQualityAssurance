import { pool } from "../src/libs/db.js";

async function ensureBatchIndex() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to database...");

    try {
      // Check if index exists on batches(producted_date)
      const [indexes] = await connection.query(`SHOW INDEX FROM batches WHERE Key_name = 'idx_batches_date'`);
      if (indexes.length === 0) {
        console.log("Adding index on batches(producted_date)...");
        await connection.query(`CREATE INDEX idx_batches_date ON batches(producted_date)`);
        console.log("Index added successfully.");
      } else {
        console.log("Index on batches(producted_date) already exists.");
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

ensureBatchIndex();
