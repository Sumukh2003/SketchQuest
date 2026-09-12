import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  SERVER_URL,
  {
    transports: ["websocket"],
    autoConnect: true,
    reconnectionAttempts: 10,
  }
);
