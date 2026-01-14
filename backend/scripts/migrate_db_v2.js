import { pool } from "../src/libs/db.js";

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to database...");

    try {
      // Check if warehouse_id column exists in product table
      const [columns] = await connection.query(`SHOW COLUMNS FROM product LIKE 'warehouse_id'`);
      
      if (columns.length === 0) {
        console.log("Adding warehouse_id and line_id columns to product table...");
        await connection.query(`ALTER TABLE product ADD COLUMN warehouse_id int DEFAULT NULL`);
        await connection.query(`ALTER TABLE product ADD COLUMN line_id int DEFAULT NULL`);
        await connection.query(`ALTER TABLE product ADD CONSTRAINT product_ibfk_2 FOREIGN KEY (warehouse_id) REFERENCES warehouse (warehouse_id)`);
        await connection.query(`ALTER TABLE product ADD CONSTRAINT product_ibfk_3 FOREIGN KEY (line_id) REFERENCES line (line_id)`);
        await connection.query(`CREATE INDEX idx_product_warehouse ON product(warehouse_id)`);
        console.log("Columns added successfully.");
      } else {
        console.log("warehouse_id column already exists.");
      }

      // Check if index exists on is_predicted(time_predict)
      const [indexes] = await connection.query(`SHOW INDEX FROM is_predicted WHERE Key_name = 'idx_time_predict'`);
      if (indexes.length === 0) {
        console.log("Adding index on is_predicted(time_predict)...");
        await connection.query(`CREATE INDEX idx_time_predict ON is_predicted(time_predict)`);
        console.log("Index added successfully.");
      } else {
        console.log("Index on time_predict already exists.");
      }

    } catch (err) {
      console.error("Migration failed:", err);
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

migrate();
