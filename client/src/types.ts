export type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isDrawer?: boolean;
  hasGuessed?: boolean;
};

export type ChatMessage = {
  name?: string;
  text: string;
  system?: boolean;
  kind?: "join" | "leave";
};

export type ErrorResponse = { error: string };

/** Events emitted by clients, handled by the server. Keep in sync with server/src/types.ts */
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
  drawing_data: (data: any) => void;
  clear_canvas: () => void;
  undo_stroke: () => void;
  chat_message: (msg: ChatMessage) => void;
  correct_guess: (payload: { name?: string; word: string }) => void;
  typing: (payload: { name?: string; isTyping: boolean }) => void;
  game_error: (payload: ErrorResponse) => void;
}
