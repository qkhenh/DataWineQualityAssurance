
import { pool } from './backend/src/libs/db.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env') });

async function checkUsers() {
  try {
    const [rows] = await pool.query('SELECT user_id, username, warehouse_id FROM Users');
    console.log('User ID | Username | Warehouse ID');
    console.log('--------------------------------');
    rows.forEach(row => {
      console.log(`${row.user_id} | ${row.username} | ${row.warehouse_id}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
