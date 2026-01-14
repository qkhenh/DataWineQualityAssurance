import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}).promise()

export const connectDB = async () => {
  try {
    await pool.query('SELECT 1')
    console.log('MySQL connected')
  } catch (error) {
    console.error('MySQL connection failed', error)
    throw error
  }
}
