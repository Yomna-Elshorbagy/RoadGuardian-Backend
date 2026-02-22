import pkg from "pg";
const { Pool } = pkg;

// Supports either:
// 1) DATABASE_URL=postgresql://user:pass@host:5432/db
// 2) Discrete vars: DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT

const sslEnabled = String(process.env.DB_SSL || "true").toLowerCase() === "true";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    }
    : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    },
);

export default pool;
