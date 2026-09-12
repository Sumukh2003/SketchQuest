import { Server, Socket } from "socket.io";
import { GameManager } from "./gameManager";
import { db } from "../db";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  MESSAGE_MAX_LEN,
  MIN_PLAYERS_TO_START,
  NAME_MAX_LEN,
  ROUND_DURATION_SEC,
  HINT_REVEAL_COUNT,
} from "../types";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const gm = new GameManager();

// Per-room timeout handles so we can clear() when a round ends early.
const roundTimers = new Map<string, NodeJS.Timeout>();
const hintTimers = new Map<string, NodeJS.Timeout[]>();

function clearRoomTimers(room: string) {
  const t = roundTimers.get(room);
  if (t) {
    clearTimeout(t);
    roundTimers.delete(room);
  }
  const hints = hintTimers.get(room);
  if (hints) {
    hints.forEach(clearTimeout);
    hintTimers.delete(room);
  }
}

function sanitizeText(text: unknown, maxLen: number): string {
  return String(text ?? "")
    .trim()
    .slice(0, maxLen);
}

/** Standard edit-distance calculation used to detect "close" guesses. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/** A wrong guess counts as "close" if it's within a small edit distance of the answer. */
function isCloseGuess(guess: string, answer: string): boolean {
  if (!guess || guess === answer) return false;
  const maxDistance = answer.length <= 4 ? 1 : answer.length <= 7 ? 2 : 3;
  return levenshtein(guess, answer) <= maxDistance;
}

async function pickWordOptions(count = 3): Promise<string[]> {
  const rows = await db("words").select("word");
  const options: string[] = [];
  const pool = [...rows];
  while (options.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    options.push(pool.splice(idx, 1)[0].word);
  }
  return options;
}

function maskWord(word: string): string {
  return word
    .split("")
    .map((ch) => (ch === " " ? " " : "_"))
    .join("");
}

/** Reveals up to `count` random non-space letters of `word` on top of an initial mask. */
function scheduleHints(
  io: TypedServer,
  room: string,
  word: string,
  totalMs: number
) {
  const letterIndexes = word
    .split("")
    .map((ch, i) => (ch !== " " ? i : -1))
    .filter((i) => i >= 0);

  if (letterIndexes.length <= 3) return; // too short to bother hinting

  const revealCount = Math.min(HINT_REVEAL_COUNT, letterIndexes.length - 1);
  const shuffled = [...letterIndexes].sort(() => Math.random() - 0.5);
  const revealed = new Set<number>();
  const mask: string[] = word.split("").map((ch) => (ch === " " ? " " : "_"));

  const timers: NodeJS.Timeout[] = [];
  for (let i = 0; i < revealCount; i++) {
    const delay = (totalMs * (i + 1)) / (revealCount + 1);
    const t = setTimeout(() => {
      const idx = shuffled[i];
      revealed.add(idx);
      mask[idx] = word[idx];
      io.to(room).emit("word_hint", { blanks: mask.join("") });
    }, delay);
    timers.push(t);
  }
  hintTimers.set(room, timers);
}

async function scheduleNextDrawerChoice(io: TypedServer, room: string) {
  const drawer = gm.selectDrawer(room);
  if (!drawer) return;

  io.to(room).emit("players", gm.getGame(room)?.players || []);

  const wordOptions = await pickWordOptions(3);
  io.to(drawer.id).emit("choose_word", { options: wordOptions });
}

function endRound(io: TypedServer, room: string) {
  clearRoomTimers(room);

  const game = gm.getGame(room);
  if (!game) return;

  io.to(room).emit("round_end", {
    round: game.round,
    word: game.currentWord || "",
  });

  if (game.round >= game.maxRounds) {
    const sorted = [...game.players].sort((a, b) => b.score - a.score);
    io.to(room).emit("game_over", { players: sorted, winner: sorted[0] });
    return;
  }

  io.to(room).emit("next_round_starting", { nextRound: game.round + 1 });

  setTimeout(() => {
    scheduleNextDrawerChoice(io, room);
  }, 3000);
}

function generateRoomId(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function registerSocketHandlers(io: TypedServer) {
  io.on("connection", (socket: TypedSocket) => {
    console.log("conn:", socket.id);

    socket.on("create_game", ({ name, maxPlayers, numRounds, avatar }, cb) => {
      const cleanName = sanitizeText(name, NAME_MAX_LEN) || "Player";
      const room = generateRoomId();

      gm.createGame(room, socket.id, cleanName, numRounds, maxPlayers);
      gm.addPlayer(room, {
        id: socket.id,
        name: cleanName,
        score: 0,
        avatar: avatar || "🎨",
      });

      socket.join(room);
      cb({ room });
    });

    socket.on("join_game", async ({ room, name, avatar }, cb) => {
      const roomId = sanitizeText(room, 10).toUpperCase();
      const game = gm.getGame(roomId);

      if (!game) {
        return cb({ error: "Room not found. Check the code and try again." });
      }

      const cleanName = sanitizeText(name, NAME_MAX_LEN) || "Player";
      const alreadyIn = game.players.some((p) => p.id === socket.id);

      if (!alreadyIn) {
        if (game.players.length >= game.maxPlayers) {
          return cb({ error: "Room is full." });
        }

        gm.addPlayer(roomId, {
          id: socket.id,
          name: cleanName,
          score: 0,
          avatar: avatar || "🎨",
        });

        socket.join(roomId);
        io.to(roomId).emit("chat_message", {
          system: true,
          kind: "join",
          text: `${cleanName} joined the room`,
        });
      } else {
        socket.join(roomId);
      }

      io.to(roomId).emit("players", game.players);

      const inProgress = game.round > 0 && !!game.currentWord && !!game.roundEndsAt;
      cb({
        ok: true,
        room: roomId,
        hostId: game.hostId,
        activeRound: inProgress
          ? {
              round: game.round,
              roundEndsAt: game.roundEndsAt!,
              wordLength: game.currentWord!.length,
            }
          : undefined,
      });
    });

    // START ROUND (HOST ONLY) -> prompt drawer to choose words
    socket.on("start_round", async ({ room }, cb) => {
      const game = gm.getGame(room);
      if (!game) return cb({ error: "Game not found." });

      if (!gm.isHost(room, socket.id)) {
        return cb({ error: "Only the host can start the game." });
      }

      if (game.players.length < MIN_PLAYERS_TO_START) {
        return cb({ error: `Need at least ${MIN_PLAYERS_TO_START} players to start.` });
      }

      if (game.round >= game.maxRounds && game.round > 0) {
        return cb({ error: "Game already finished." });
      }

      await scheduleNextDrawerChoice(io, room);
      cb({ ok: true });
    });

    // Drawer picks a word -> this actually starts the round (increments round)
    socket.on("word_chosen", ({ room, word }) => {
      const game = gm.getGame(room);
      if (!game) return;

      // Only the player the server designated as drawer may start the round.
      if (!gm.isCurrentDrawer(room, socket.id)) return;

      const cleanWord = sanitizeText(word, 40);
      if (!cleanWord) return;

      gm.nextRound(room, socket.id, cleanWord, ROUND_DURATION_SEC);

      const updated = gm.getGame(room);
      if (!updated) return;
      const drawer = updated.players.find((p) => p.isDrawer);

      io.to(room).emit("round_started", {
        round: updated.round,
        roundEndsAt: updated.roundEndsAt || Date.now(),
        drawerId: drawer?.id || socket.id,
        wordLength: cleanWord.length,
      });

      io.to(room).emit("players", updated.players);

      if (drawer) io.to(drawer.id).emit("drawer_word", { word: cleanWord });

      // Send the initial all-blanks mask to everyone else.
      socket.to(room).emit("word_hint", { blanks: maskWord(cleanWord) });

      clearRoomTimers(room);

      const ms = Math.max(0, (updated.roundEndsAt || Date.now()) - Date.now());
      scheduleHints(io, room, cleanWord, ms);

      const t = setTimeout(() => {
        const gNow = gm.getGame(room);
        if (!gNow) return;
        if (Date.now() >= (gNow.roundEndsAt || 0)) {
          endRound(io, room);
        }
      }, ms);

      roundTimers.set(room, t);
    });

    // DRAWING broadcast — only the current drawer may draw.
    socket.on("drawing_data", ({ room, data }) => {
      if (!gm.isCurrentDrawer(room, socket.id)) return;
      socket.to(room).emit("drawing_data", data);
    });

    socket.on("clear_canvas", ({ room }) => {
      if (!gm.isCurrentDrawer(room, socket.id)) return;
      socket.to(room).emit("clear_canvas");
    });

    socket.on("undo_stroke", ({ room }) => {
      if (!gm.isCurrentDrawer(room, socket.id)) return;
      socket.to(room).emit("undo_stroke");
    });

    // GUESSES
    socket.on("guess", ({ room, text }, cb) => {
      const game = gm.getGame(room);
      if (!game) return cb({ correct: false });

      const player = game.players.find((p) => p.id === socket.id);
      const cleanText = sanitizeText(text, MESSAGE_MAX_LEN);
      if (!player || !cleanText) return cb({ correct: false });

      // The drawer and players who already guessed just chat — never re-evaluated as a guess.
      if (player.isDrawer || player.hasGuessed) {
        io.to(room).emit("chat_message", { name: player.name, text: cleanText });
        return cb({ correct: false });
      }

      const answer = game.currentWord?.toLowerCase();
      const isCorrect = answer != null && cleanText.trim().toLowerCase() === answer;

      if (isCorrect) {
        gm.awardPoints(room, socket.id, 10);

        const drawer = game.players.find((p) => p.isDrawer);
        if (drawer) gm.awardPoints(room, drawer.id, 5);

        io.to(room).emit("correct_guess", {
          name: player.name,
          word: game.currentWord || "",
        });
        io.to(room).emit("players", game.players);

        cb({ correct: true });

        if (gm.allNonDrawersGuessed(room)) {
          endRound(io, room);
        }
      } else {
        io.to(room).emit("chat_message", { name: player.name, text: cleanText });
        const close = answer != null && isCloseGuess(cleanText.toLowerCase(), answer);
        cb({ correct: false, close });
      }
    });

    socket.on("typing", ({ room, isTyping }) => {
      const game = gm.getGame(room);
      const name = game?.players.find((p) => p.id === socket.id)?.name;
      socket.to(room).emit("typing", { name, isTyping });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);

      rooms.forEach((room) => {
        const wasDrawer = gm.isCurrentDrawer(room, socket.id);
        const { name, gameDeleted } = gm.removePlayer(room, socket.id);

        if (gameDeleted) {
          clearRoomTimers(room);
          return;
        }

        const game = gm.getGame(room);
        if (!game) return;

        if (name) {
          io.to(room).emit("chat_message", {
            system: true,
            kind: "leave",
            text: `${name} left the room`,
          });
        }
        io.to(room).emit("players", game.players);

        // If the drawer disconnected mid-round, end the round early.
        if (wasDrawer && game.currentWord) {
          endRound(io, room);
        }
      });
    });
  });
}
