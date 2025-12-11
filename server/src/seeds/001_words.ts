import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("words").del();
  const list = [
    "apple",
    "banana",
    "house",
    "cat",
    "dog",
    "car",
    "bicycle",
    "tree",
    "sun",
    "moon",
    "star",
    "book",
    "phone",
    "computer",
    "keyboard",
    "guitar",
    "pizza",
    "cake",
    "ball",
    "river",
  ];
  await knex("words").insert(list.map((w) => ({ word: w })));
}
