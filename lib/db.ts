import mysql from "mysql2/promise";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required but not set`);
  return value;
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const rawPort = process.env.MYSQL_PORT ?? "3306";
  const port = parseInt(rawPort, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`MYSQL_PORT is invalid: "${rawPort}". Must be a number between 1 and 65535.`);
  }

  pool = mysql.createPool({
    host: requireEnv("MYSQL_HOST"),
    port,
    database: requireEnv("MYSQL_DATABASE_NAME"),
    user: requireEnv("MYSQL_USERNAME"),
    password: requireEnv("MYSQL_PASSWORD"),
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
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
  }).catch((err) => {
    dbInitializing = null;
    throw err;
  });
  await dbInitializing;
}
