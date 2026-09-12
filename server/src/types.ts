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

export const ROUND_DURATION_SEC = 80;
export const HINT_REVEAL_COUNT = 2;
export const MIN_PLAYERS_TO_START = 2;
export const NAME_MAX_LEN = 20;
export const MESSAGE_MAX_LEN = 200;
export const MIN_MAX_PLAYERS = 2;
export const MAX_MAX_PLAYERS = 12;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 15;

export type ChatMessage = {
  name?: string;
  text: string;
  system?: boolean;
  kind?: "join" | "leave";
};

export type ErrorResponse = { error: string };

/** Events emitted by clients, handled by the server. */
export interface ClientToServerEvents {
  create_game: (
    payload: {
      name: string;
      maxPlayers: number;
      numRounds: number;
      avatar: string;
    },
    cb: (res: { room: string } | ErrorResponse) => void
  ) => void;

  join_game: (
    payload: { room: string; name: string; avatar?: string },
    cb: (
      res:
        | {
            ok: true;
            room: string;
            hostId: string;
            activeRound?: {
              round: number;
              roundEndsAt: number;
              wordLength: number;
            };
          }
        | ErrorResponse
    ) => void
  ) => void;

  start_round: (
    payload: { room: string },
    cb: (res: { ok: true } | ErrorResponse) => void
  ) => void;

  word_chosen: (payload: { room: string; word: string }) => void;

  drawing_data: (payload: { room: string; data: unknown }) => void;

  clear_canvas: (payload: { room: string }) => void;

  undo_stroke: (payload: { room: string }) => void;

  guess: (
    payload: { room: string; text: string },
    cb: (res: { correct: boolean; close?: boolean }) => void
  ) => void;

  typing: (payload: { room: string; isTyping: boolean }) => void;
}

/** Events emitted by the server, handled by clients. */
export interface ServerToClientEvents {
  players: (players: Player[]) => void;
  choose_word: (payload: { options: string[] }) => void;
  round_started: (payload: {
    round: number;
    roundEndsAt: number;
    drawerId: string;
    wordLength: number;
  }) => void;
  drawer_word: (payload: { word: string }) => void;
  word_hint: (payload: { blanks: string }) => void;
  round_end: (payload: { round: number; word: string }) => void;
  next_round_starting: (payload: { nextRound: number }) => void;
  game_over: (payload: { players: Player[]; winner: Player }) => void;
  drawing_data: (data: unknown) => void;
  clear_canvas: () => void;
  undo_stroke: () => void;
  chat_message: (msg: ChatMessage) => void;
  correct_guess: (payload: { name?: string; word: string }) => void;
  typing: (payload: { name?: string; isTyping: boolean }) => void;
  game_error: (payload: ErrorResponse) => void;
}
