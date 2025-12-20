import { Server, Socket } from "socket.io";
import { GameManager } from "./gameManager";
import { db } from "../db";

const gm = new GameManager();

// per-room timeout handles so we can clear() when round ends early
const roundTimers = new Map<string, NodeJS.Timeout>();

function clearRoundTimer(room: string) {
  const t = roundTimers.get(room);
  if (t) {
    clearTimeout(t);
    roundTimers.delete(room);
  }
}

async function scheduleNextDrawerChoice(io: Server, room: string) {
  // select drawer (does not increment round)
  const drawer = gm.selectDrawer(room);
  if (!drawer) return;

  // broadcast players (so UI shows who will draw next)
  io.to(room).emit("players", gm.getGame(room)?.players || []);

  // fetch words
  const rows = await db("words").select("word");
  const wordOptions: string[] = [];
  while (wordOptions.length < 3 && rows.length > 0) {
    const w = rows[Math.floor(Math.random() * rows.length)].word;
    if (!wordOptions.includes(w)) wordOptions.push(w);
  }

  io.to(drawer.id).emit("choose_word", { options: wordOptions });
}

function endRound(io: Server, room: string) {
  // clear any running timer for safety
  clearRoundTimer(room);

  const game = gm.getGame(room);
  if (!game) return;

  // Emit round_end (client expects this event name)
  io.to(room).emit("round_end", {
    round: game.round,
    word: game.currentWord,
  });

  // If last round → end game
  if (game.round >= game.maxRounds) {
    const sorted = [...game.players].sort((a, b) => b.score - a.score);

    io.to(room).emit("game_over", {
      players: sorted,
      winner: sorted[0],
    });

    return;
  }

  // Tell clients next round is starting in 3 seconds
  io.to(room).emit("next_round_starting", {
    nextRound: game.round + 1,
  });

  // After 3s, prompt next drawer to choose
  setTimeout(() => {
    scheduleNextDrawerChoice(io, room);
  }, 3000);
}

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
    socket.on("create_game", ({ name, maxPlayers, numRounds, avatar }, cb) => {
      const room = generateRoomId();
      const game = gm.createGame(
        room,
        socket.id,
        name,
        numRounds || 3,
        maxPlayers || 5
      );

      // Add host as first player with avatar
      gm.addPlayer(room, { id: socket.id, name, score: 0, avatar });

      cb({ room });
    });

    // JOIN GAME
    socket.on("join_game", async ({ room, name, avatar }, cb) => {
      let game = gm.getGame(room);

      // If room doesn't exist, create it (creator becomes host)
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
        gm.addPlayer(room, { id: socket.id, name, score: 0, avatar });
      }

      socket.join(room);

      io.to(room).emit("players", game.players);
      cb({ ok: true, room, hostId: game.hostId });
    });

    // START ROUND (HOST ONLY) -> prompt drawer to choose words
    socket.on("start_round", async ({ room }, cb) => {
      const game = gm.getGame(room);
      if (!game) return cb({ error: "no game" });

      if (!gm.isHost(room, socket.id)) {
        return cb({ error: "Only host can start" });
      }

      // fetch words
      const rows = await db("words").select("word");
      if (!rows.length) return cb({ error: "No words in DB" });

      // choose drawer (based on current round)
      const drawer = gm.selectDrawer(room);
      if (!drawer) return cb({ error: "No drawer" });

      // prepare 3 words
      const wordOptions: string[] = [];
      while (wordOptions.length < 3 && rows.length > 0) {
        const w = rows[Math.floor(Math.random() * rows.length)].word;
        if (!wordOptions.includes(w)) wordOptions.push(w);
      }
      if (game.round >= game.maxRounds) {
        return cb({ error: "Game already finished" });
      }

      // send choose_word to drawer and broadcast players
      io.to(drawer.id).emit("choose_word", { options: wordOptions });
      io.to(room).emit("players", gm.getGame(room)?.players || []);

      cb({ ok: true });
    });

    // Drawer picks a word -> this actually starts the round (increments round)
    socket.on("word_chosen", ({ room, word }) => {
      const game = gm.getGame(room);
      if (!game) return;

      // start the round (increments round, sets drawer, sets roundEndsAt)
      gm.nextRound(room, word, 60); // 60 seconds

      // emit round_started so clients enable drawing instantly
      const updated = gm.getGame(room);
      if (!updated) return;
      const drawer = updated.players.find((p) => p.isDrawer);

      io.to(room).emit("round_started", {
        round: updated.round,
        roundEndsAt: updated.roundEndsAt,
        drawerId: drawer?.id,
      });

      // emit players so UI shows drawer chip immediately
      io.to(room).emit("players", updated.players);

      // send the secret word only to drawer
      if (drawer) io.to(drawer.id).emit("drawer_word", { word });

      // clear any existing timer and set a new timer to end the round after duration
      clearRoundTimer(room);

      const ms = Math.max(0, (updated.roundEndsAt || Date.now()) - Date.now());
      const t = setTimeout(() => {
        const gNow = gm.getGame(room);
        if (!gNow) return;
        if (Date.now() >= (gNow.roundEndsAt || 0)) {
          endRound(io, room);
        }
      }, ms);

      roundTimers.set(room, t);
    });

    // DRAWING broadcast
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
        // award points and mark guessed (awardPoints prevents double awarding)
        gm.awardPoints(room, socket.id, 10);

        const drawer = game.players.find((p) => p.isDrawer);
        if (drawer) gm.awardPoints(room, drawer.id, 5);

        io.to(room).emit("correct_guess", {
          name: game.players.find((p) => p.id === socket.id)?.name,
          word: game.currentWord,
        });

        io.to(room).emit("players", game.players);

        cb({ correct: true });

        // End round when all non-drawers have guessed
        if (gm.allNonDrawersGuessed(room)) {
          // clear timer and end round
          clearRoundTimer(room);
          endRound(io, room);
        }
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
