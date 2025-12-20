export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isDrawer?: boolean;
  hasGuessed?: boolean;
}

export interface Game {
  id: string;
  name?: string;

  hostId: string;
  players: Player[];

  round: number;
  maxRounds: number;
  maxPlayers: number;

  // round details
  currentWord?: string; // word drawer must draw
  roundEndsAt?: number; // timestamp
  guessedPlayers?: string[]; // players who guessed correctly
}
