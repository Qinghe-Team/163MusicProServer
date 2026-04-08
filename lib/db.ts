import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port,
    database: process.env.MYSQL_DATABASE_NAME,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

export async function initDb(): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        method VARCHAR(16) NOT NULL,
        path VARCHAR(2048) NOT NULL,
        timestamp BIGINT NOT NULL,
        ip VARCHAR(128) NOT NULL
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS suggestions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);
  } finally {
    conn.release();
  }
}

let dbInitialized = false;
let dbInitializing: Promise<void> | null = null;

export async function ensureDb(): Promise<void> {
  if (dbInitialized) return;
  if (dbInitializing) {
    await dbInitializing;
    return;
  }
  dbInitializing = initDb().then(() => {
    dbInitialized = true;
    dbInitializing = null;
  });
  await dbInitializing;
}
