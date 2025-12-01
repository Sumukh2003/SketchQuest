export interface Player {
  id: string; // Changed from number to string
  username: string;
  score: number;
  is_host: boolean;
}

export interface Room {
  id: string; // Changed from number to string
  code: string;
  name: string;
  max_players: number;
  rounds: number;
  draw_time: number;
  is_public: boolean;
  status: string;
}

export interface Message {
  username: string;
  message: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface GameState {
  room: Room | null;
  players: Player[];
  messages: Message[];
  currentDrawer: string | null;
  wordHint: string | null;
  timeLeft: number;
  gameStatus: "waiting" | "playing" | "finished";
  isDrawing: boolean;
  currentWord: string | null;
}

export interface DrawData {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
}

export interface CreateRoomForm {
  name: string;
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  isPublic: boolean;
  password: string;
}
