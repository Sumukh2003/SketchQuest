import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import knex from "knex";
import knexConfig from "./knexfile.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Database connection
const db = knex(knexConfig.development);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SketchQuest Server is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Database connection test endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.raw("SELECT 1 + 1 as result");
    res.json({
      database: "Connected successfully",
      result: result[0][0].result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Basic socket connection
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });

  socket.on("ping", (data) => {
    socket.emit("pong", {
      message: "Hello from SketchQuest Server!",
      timestamp: new Date().toISOString(),
      yourData: data,
    });
  });

  socket.on("join_room_test", (data) => {
    console.log("Join room test:", data);
    socket.emit("room_joined_test", {
      message: "Room join test successful!",
      room: data.roomCode,
      user: data.username,
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 SketchQuest Server started!");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: development`);
  console.log(`📊 Database: MySQL with Knex`);
  console.log(`🔗 Socket.IO: Enabled`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});
