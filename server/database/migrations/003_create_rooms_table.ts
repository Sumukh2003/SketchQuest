import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("words", (table) => {
    table.increments("id").primary();
    table.string("word").notNullable();
    table.string("category").notNullable();
    table.integer("difficulty").defaultTo(1);

    table.index(["category"]);
    table.index(["difficulty"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("words");
}
