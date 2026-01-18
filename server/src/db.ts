import knex from "knex";
import config from "./knexfile";

const env = process.env.NODE_ENV || "development";

const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`Knex config not found for env: ${env}`);
}

export const db = knex(dbConfig);
