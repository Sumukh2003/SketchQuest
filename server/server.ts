const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Types
interface Player {
  id: string;
  username: string;
  score: number;
  isHost: boolean;
}

interface Room {
  id: string;
  code: string;
  name: string;
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  players: Player[];
  status: "waiting" | "playing";
  currentDrawer: string | null;
  currentWord: string | null;
  gameState: string;
  guessedPlayers?: string[];
  createdAt: Date;
}

interface User {
  username: string;
  roomCode: string;
}

// In-memory storage (replace with MySQL tomorrow)
const rooms = new Map<string, Room>();
const users = new Map<string, User>();
const words = [
  "cat",
  "dog",
  "house",
  "car",
  "tree",
  "sun",
  "ball",
  "book",
  "elephant",
  "mountain",
  "airplane",
  "computer",
  "guitar",
  "pizza",
];

// Utility functions
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

// API Routes
app.use(cors());
app.use(express.json());

app.get("/api/health", (req: any, res: any) => {
  res.json({
    status: "OK",
    message: "🎨 SketchQuest Server - Day 2 Ready!",
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    activeUsers: users.size,
  });
});

app.post("/api/rooms/create", (req: any, res: any) => {
  const {
    name,
    username,
    maxPlayers = 8,
    rounds = 3,
    drawTime = 80,
  } = req.body;

  const roomCode = generateRoomCode();
  const roomId = uuidv4();

  const room: Room = {
    id: roomId,
    code: roomCode,
    name,
    maxPlayers,
    rounds,
    drawTime,
    players: [],
    status: "waiting",
    currentDrawer: null,
    currentWord: null,
    gameState: "lobby",
    createdAt: new Date(),
  };

  rooms.set(roomCode, room);

  res.json({
    success: true,
    room: {
      code: roomCode,
      name: room.name,
      maxPlayers: room.maxPlayers,
    },
  });
});

app.get("/api/rooms/:code", (req: any, res: any) => {
  const roomCode = req.params.code.toUpperCase();
  const room = rooms.get(roomCode);

  if (!room) {
    return res.status(404).json({
      success: false,
      error: "Room not found",
    });
  }

  res.json({
    success: true,
    room: {
      code: room.code,
      name: room.name,
      players: room.players,
      maxPlayers: room.maxPlayers,
      status: room.status,
    },
  });
});

// Socket.io Game Logic
io.on("connection", (socket: any) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("create_room", (data: any) => {
    const { roomName, username, maxPlayers, rounds, drawTime } = data;

    const roomCode = generateRoomCode();
    const roomId = uuidv4();

    const room: Room = {
      id: roomId,
      code: roomCode,
      name: roomName,
      maxPlayers,
      rounds,
      drawTime,
      players: [
        {
          id: socket.id,
          username,
          score: 0,
          isHost: true,
        },
      ],
      status: "waiting",
      currentDrawer: null,
      currentWord: null,
      gameState: "lobby",
      createdAt: new Date(),
    };

    rooms.set(roomCode, room);
    users.set(socket.id, { username, roomCode });

    socket.join(roomCode);

    socket.emit("room_created", {
      success: true,
      room: {
        code: roomCode,
        name: room.name,
        players: room.players,
      },
    });

    console.log(`🎮 Room created: ${roomCode} by ${username}`);
  });

  socket.on("join_room", (data: any) => {
    const { roomCode, username } = data;
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      socket.emit("join_error", {
        error: "Room not found",
      });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit("join_error", {
        error: "Room is full",
      });
      return;
    }

    if (room.status !== "waiting") {
      socket.emit("join_error", {
        error: "Game has already started",
      });
      return;
    }

    // Add player to room
    room.players.push({
      id: socket.id,
      username,
      score: 0,
      isHost: false,
    });

    users.set(socket.id, { username, roomCode: room.code });
    socket.join(room.code);

    // Notify room about new player
    io.to(room.code).emit("player_joined", {
      username,
      players: room.players,
    });

    socket.emit("room_joined", {
      success: true,
      room: {
        code: room.code,
        name: room.name,
        players: room.players,
        maxPlayers: room.maxPlayers,
      },
    });

    console.log(`👤 ${username} joined room: ${room.code}`);
  });

  socket.on("start_game", (data: any) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    const user = users.get(socket.id);

    if (!room || !user) return;

    // Check if user is host
    const player = room.players.find((p: Player) => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit("error", { message: "Only host can start the game" });
      return;
    }

    if (room.players.length < 2) {
      socket.emit("error", { message: "Need at least 2 players to start" });
      return;
    }

    room.status = "playing";
    room.gameState = "round_start";

    // Start first round
    startNewRound(room);

    io.to(roomCode).emit("game_started", {
      message: "Game started!",
      round: 1,
      drawer: room.currentDrawer,
    });
  });

  socket.on("send_message", (data: any) => {
    const { roomCode, message } = data;
    const room = rooms.get(roomCode);
    const user = users.get(socket.id);

    if (!room || !user) return;

    const chatMessage = {
      username: user.username,
      message,
      timestamp: new Date(),
      isCorrect: false,
    };

    // Check if message is correct guess
    if (
      room.currentWord &&
      message.toLowerCase() === room.currentWord.toLowerCase()
    ) {
      if (
        socket.id !== room.currentDrawer &&
        !room.guessedPlayers?.includes(socket.id)
      ) {
        chatMessage.isCorrect = true;

        // Award points
        const player = room.players.find((p: Player) => p.id === socket.id);
        if (player) {
          player.score += 100;
        }

        if (!room.guessedPlayers) room.guessedPlayers = [];
        room.guessedPlayers.push(socket.id);

        io.to(roomCode).emit("correct_guess", {
          username: user.username,
          word: room.currentWord,
          points: 100,
        });

        // Check if all players guessed
        if (room.guessedPlayers.length === room.players.length - 1) {
          endRound(room);
        }
      }
    }

    io.to(roomCode).emit("new_message", chatMessage);
  });

  socket.on("draw", (data: any) => {
    const { roomCode, x, y, prevX, prevY, color, lineWidth } = data;
    const room = rooms.get(roomCode);
    const user = users.get(socket.id);

    if (!room || !user || room.currentDrawer !== socket.id) return;

    // Broadcast drawing to other players
    socket.to(roomCode).emit("drawing", {
      x,
      y,
      prevX,
      prevY,
      color,
      lineWidth,
    });
  });

  socket.on("clear_canvas", (data: any) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);

    if (!room || room.currentDrawer !== socket.id) return;

    socket.to(roomCode).emit("canvas_cleared");
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);

    if (user) {
      const room = rooms.get(user.roomCode);

      if (room) {
        // Remove player from room
        room.players = room.players.filter((p: Player) => p.id !== socket.id);

        // Notify other players
        socket.to(room.code).emit("player_left", {
          username: user.username,
          players: room.players,
        });

        // If room is empty, delete it
        if (room.players.length === 0) {
          rooms.delete(room.code);
          console.log(`🗑️ Room deleted: ${room.code}`);
        }
      }

      users.delete(socket.id);
    }

    console.log("❌ User disconnected:", socket.id);
  });
});

function startNewRound(room: Room) {
  room.gameState = "drawing";
  room.guessedPlayers = [];

  // Select random drawer
  const drawerIndex = Math.floor(Math.random() * room.players.length);
  room.currentDrawer = room.players[drawerIndex].id;

  // Select random word
  room.currentWord = getRandomWord();

  // Notify players
  io.to(room.code).emit("round_started", {
    drawer: room.players[drawerIndex].username,
    wordLength: room.currentWord.length,
    round: 1,
  });

  // Notify drawer privately
  io.to(room.currentDrawer).emit("your_turn_to_draw", {
    word: room.currentWord,
  });
}

function endRound(room: Room) {
  room.gameState = "round_end";

  io.to(room.code).emit("round_ended", {
    word: room.currentWord,
    scores: room.players.map((p: Player) => ({
      username: p.username,
      score: p.score,
    })),
  });

  // Start next round after delay
  setTimeout(() => {
    if (room.status === "playing") {
      startNewRound(room);
    }
  }, 5000);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 SketchQuest Server - Day 2 Features Active!");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: development`);
  console.log(`🎮 Game Logic: Enabled`);
  console.log(`🔗 Socket.IO: Real-time features ready`);
  console.log(`📊 Storage: In-memory (MySQL ready for Day 3)`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});
