import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { registerSocketHandlers } from "./game/sockets";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

registerSocketHandlers(io);

// health
app.get("/", (req, res) => res.send("skribbl-server OK"));

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log("Server listening on", port);
});
