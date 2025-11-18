import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("words").del();

  // Inserts seed entries
  await knex("words").insert([
    // Easy words
    { word: "cat", category: "animals", difficulty: 1 },
    { word: "dog", category: "animals", difficulty: 1 },
    { word: "sun", category: "nature", difficulty: 1 },
    { word: "car", category: "vehicles", difficulty: 1 },
    { word: "house", category: "objects", difficulty: 1 },
    { word: "ball", category: "objects", difficulty: 1 },
    { word: "tree", category: "nature", difficulty: 1 },
    { word: "book", category: "objects", difficulty: 1 },
    { word: "fish", category: "animals", difficulty: 1 },
    { word: "star", category: "nature", difficulty: 1 },

    // Medium words
    { word: "elephant", category: "animals", difficulty: 2 },
    { word: "mountain", category: "nature", difficulty: 2 },
    { word: "airplane", category: "vehicles", difficulty: 2 },
    { word: "computer", category: "objects", difficulty: 2 },
    { word: "basketball", category: "sports", difficulty: 2 },
    { word: "guitar", category: "music", difficulty: 2 },
    { word: "pizza", category: "food", difficulty: 2 },
    { word: "rainbow", category: "nature", difficulty: 2 },
    { word: "butterfly", category: "animals", difficulty: 2 },
    { word: "castle", category: "objects", difficulty: 2 },

    // Hard words
    { word: "chameleon", category: "animals", difficulty: 3 },
    { word: "waterfall", category: "nature", difficulty: 3 },
    { word: "helicopter", category: "vehicles", difficulty: 3 },
    { word: "microscope", category: "objects", difficulty: 3 },
    { word: "archaeologist", category: "professions", difficulty: 3 },
    { word: "kaleidoscope", category: "objects", difficulty: 3 },
    { word: "xylophone", category: "music", difficulty: 3 },
    { word: "astronaut", category: "professions", difficulty: 3 },
    { word: "volcano", category: "nature", difficulty: 3 },
    { word: "skyscraper", category: "objects", difficulty: 3 },
  ]);
}
