import { io, Socket } from "socket.io-client";

const SERVER = import.meta.env.VITE_SERVER_URL!;
export const socket = io(SERVER, { transports: ["websocket"] });
