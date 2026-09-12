import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { registerSocketHandlers } from "./game/sockets";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://sketchquest.vercel.app",
];

const allowedOrigins = process.env.CLIENT_URL
  ? [...DEFAULT_ORIGINS, ...process.env.CLIENT_URL.split(",").map((s) => s.trim())]
  : DEFAULT_ORIGINS;

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "sketchquest-server" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
