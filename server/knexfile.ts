import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "sketchquest_db",
    },
    migrations: {
      directory: "./database/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./database/seeds",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "sketchquest_db",
    },
    migrations: {
      directory: "./database/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./database/seeds",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default config;
