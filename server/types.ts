export interface Room {
  id: number;
  code: string;
  name: string;
  max_players: number;
  rounds: number;
  draw_time: number;
  is_public: boolean;
  password: string | null;
  status: "waiting" | "playing" | "finished";
  current_round: number;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  socket_id: string;
  username: string;
  room_id: number;
  is_host: boolean;
  score: number;
  created_at: Date;
  updated_at: Date;
}

export interface Word {
  id: number;
  word: string;
  category: string;
  difficulty: number;
}

export interface GameRound {
  id: number;
  room_id: number;
  round_number: number;
  drawer_id: number;
  word: string;
  hint: string | null;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Guess {
  id: number;
  round_id: number;
  user_id: number;
  guess: string;
  is_correct: boolean;
  points: number;
  created_at: Date;
  updated_at: Date;
}

export interface ActiveGame {
  roomId: number;
  players: Map<string, { userId: number; username: string; score: number }>;
  currentRound: number | null;
  word: string | null;
  drawer: string | null;
  timer: number | null;
  currentTimer: NodeJS.Timeout | null;
  guessedPlayers: Set<string>;
}

export interface JoinRoomData {
  roomCode: string;
  username: string;
}

export interface StartGameData {
  roomCode: string;
}

export interface DrawData {
  roomCode: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
}

export interface MessageData {
  roomCode: string;
  message: string;
}

export interface CreateRoomData {
  name: string;
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  isPublic: boolean;
  password?: string;
}

export interface Player {
  id: number;
  username: string;
  score: number;
  is_host: boolean;
}
