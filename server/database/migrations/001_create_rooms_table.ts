import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("rooms", (table) => {
    table.increments("id").primary();
    table.string("code", 6).unique().notNullable();
    table.string("name").notNullable();
    table.integer("max_players").defaultTo(8);
    table.integer("rounds").defaultTo(3);
    table.integer("draw_time").defaultTo(80);
    table.boolean("is_public").defaultTo(true);
    table.string("password").nullable();
    table
      .enum("status", ["waiting", "playing", "finished"])
      .defaultTo("waiting");
    table.integer("current_round").defaultTo(0);
    table.timestamps(true, true);

    table.index(["code"]);
    table.index(["status"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("rooms");
}
