
import { pool } from './src/libs/db.js';

async function checkUsers() {
  try {
    const [rows] = await pool.query('SELECT user_id, username, warehouse_id FROM Users');
    console.log('User ID | Username | Warehouse ID');
    console.log('--------------------------------');
    rows.forEach(row => {
      console.log(`${row.user_id} | ${row.username} | ${row.warehouse_id}`);
      console.log('Keys:', Object.keys(row));
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
