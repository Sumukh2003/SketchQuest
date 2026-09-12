import type { Knex } from "knex";
import path from "path";
import dotenv from "dotenv";

// The knex CLI changes cwd to this file's directory, so resolve .env explicitly
// relative to the project root instead of relying on dotenv's cwd-based default.
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const migrationSeedConfig = {
  migrations: { directory: path.join(__dirname, "migrations") },
  seeds: { directory: path.join(__dirname, "seeds") },
};

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "sketchquest",
    },
    ...migrationSeedConfig,
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.MYSQL_HOST || process.env.DB_HOST,
      port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
      user: process.env.MYSQL_USER || process.env.DB_USER,
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
    },
    pool: { min: 0, max: 5 },
    ...migrationSeedConfig,
  },
};

export default config;
