import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("words", (t) => {
    t.increments("id").primary();
    t.string("word").notNullable().unique();
  });

  await knex.schema.createTable("games", (t) => {
    t.increments("id").primary();
    t.string("name").notNullable();
    t.integer("round").defaultTo(0);
    t.integer("max_rounds").defaultTo(3);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("players", (t) => {
    t.increments("id").primary();
    t.integer("game_id")
      .unsigned()
      .references("id")
      .inTable("games")
      .onDelete("CASCADE");
    t.string("socket_id").notNullable();
    t.string("name").notNullable();
    t.integer("score").defaultTo(0);
  });

  // minimal other tables could be added later (rounds, messages)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("players");
  await knex.schema.dropTableIfExists("games");
  await knex.schema.dropTableIfExists("words");
}
