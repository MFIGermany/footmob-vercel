import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const DEFAULT_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
}

const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG

export const createConnection = () => mysql.createConnection(connectionString)
