import { pool } from '../src/libs/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runUpdate = async () => {
  try {
    const sqlPath = path.join(__dirname, '../../DB/notification_schema_update.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to get individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`Found ${statements.length} statements to execute.`);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        console.log('Executed statement successfully.');
      } catch (err) {
        // Ignore errors about columns already existing or keys dropping if they don't exist
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('Skipping duplicate/missing field error:', err.message);
        } else {
            console.error('Error executing statement:', err.message);
        }
      }
    }
    
    console.log('Database update complete.');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

runUpdate();
