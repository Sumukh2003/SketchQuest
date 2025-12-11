import { Server, Socket } from "socket.io";
import { GameManager } from "./gameManager";
import { db } from "../db";

const gm = new GameManager();

function generateRoomId(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("conn:", socket.id);

    // CREATE GAME
    socket.on("create_game", ({ name, maxPlayers, numRounds }, cb) => {
      const room = generateRoomId();
      gm.createGame(room, socket.id, name, numRounds || 3, maxPlayers || 5);
      cb({ room });
    });

    // JOIN GAME
    socket.on("join_game", async ({ room, name }, cb) => {
      let game = gm.getGame(room);

      // If room doesn't exist, create it
      if (!game) {
        game = gm.createGame(room, socket.id, name, 3, 5);
      }

      // Room full?
      if (game.players.length >= game.maxPlayers) {
        return cb({ error: "Room full" });
      }

      // Already in room?
      const exists = game.players.some((p) => p.id === socket.id);
      if (!exists) {
        gm.addPlayer(room, { id: socket.id, name, score: 0 });
      }

      socket.join(room);

      io.to(room).emit("players", game.players);
      cb({ ok: true, room, hostId: game.hostId });
    });

    // START ROUND (HOST ONLY)
    socket.on("start_round", async ({ room }, cb) => {
      const game = gm.getGame(room);
      if (!game) return cb({ error: "no game" });

      if (!gm.isHost(room, socket.id)) {
        return cb({ error: "Only host can start" });
      }

      // --- Fetch Words ---
      const rows = await db("words").select("word");
      if (!rows.length) return cb({ error: "No words in DB" });

      // --- Choose drawer ---
      const drawer = gm.selectDrawer(room);

      if (!drawer) return cb({ error: "No drawer" });

      // --- Send 3 words to drawer ---
      const wordOptions: string[] = [];
      while (wordOptions.length < 3) {
        const w = rows[Math.floor(Math.random() * rows.length)].word;
        if (!wordOptions.includes(w)) wordOptions.push(w);
      }

      io.to(drawer.id).emit("choose_word", { options: wordOptions });

      cb({ ok: true });
    });

    // Drawer picks a word
    socket.on("word_chosen", ({ room, word }) => {
      const game = gm.getGame(room);
      if (!game) return;

      gm.nextRound(room, word, 60); // 60 seconds

      const updated = gm.getGame(room);
      if (!updated) return;
      const drawer = updated.players.find((p) => p.isDrawer);

      io.to(room).emit("round_started", {
        round: updated.round,
        roundEndsAt: updated.roundEndsAt,
        drawerId: drawer?.id,
      });
      io.to(room).emit("players", updated.players);
      if (!drawer) return;
      io.to(drawer.id).emit("drawer_word", { word });
    });

    // DRAWING
    socket.on("drawing_data", ({ room, data }) => {
      socket.to(room).emit("drawing_data", data);
    });

    // GUESSES
    socket.on("guess", ({ room, text }, cb) => {
      const game = gm.getGame(room);
      if (!game) return;

      const guess = text.trim().toLowerCase();
      const answer = game.currentWord?.toLowerCase();

      if (guess === answer) {
        gm.awardPoints(room, socket.id, 10);

        const drawer = game.players.find((p) => p.isDrawer);
        if (drawer) gm.awardPoints(room, drawer.id, 5);

        io.to(room).emit("correct_guess", {
          name: game.players.find((p) => p.id === socket.id)?.name,
          word: game.currentWord,
        });

        io.to(room).emit("players", game.players);

        cb({ correct: true });
      } else {
        io.to(room).emit("chat_message", {
          name: game.players.find((p) => p.id === socket.id)?.name,
          text,
        });

        cb({ correct: false });
      }
    });

    // DISCONNECT
    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);

      rooms.forEach((room) => {
        gm.removePlayer(room, socket.id);
        const game = gm.getGame(room);
        if (game) io.to(room).emit("players", game.players);
      });
    });
  });
}
