import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("socket_id").notNullable();
    table.string("username").notNullable();
    table.integer("room_id").unsigned();
    table.foreign("room_id").references("rooms.id").onDelete("CASCADE");
    table.boolean("is_host").defaultTo(false);
    table.integer("score").defaultTo(0);
    table.timestamps(true, true);

    table.index(["room_id"]);
    table.index(["socket_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("users");
}
