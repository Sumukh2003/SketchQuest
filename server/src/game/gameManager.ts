import { Game, Player, MIN_MAX_PLAYERS, MAX_MAX_PLAYERS, MIN_ROUNDS, MAX_ROUNDS } from "../types";

export class GameManager {
  private games = new Map<string, Game>();

  createGame(
    id: string,
    hostId: string,
    name: string,
    maxRounds: number,
    maxPlayers: number
  ): Game {
    const game: Game = {
      id,
      name,
      hostId,
      players: [],
      round: 0,
      maxRounds: clamp(maxRounds || 3, MIN_ROUNDS, MAX_ROUNDS),
      maxPlayers: clamp(maxPlayers || 8, MIN_MAX_PLAYERS, MAX_MAX_PLAYERS),
      guessedPlayers: [],
    };

    this.games.set(id, game);
    return game;
  }

  getGame(id: string): Game | undefined {
    return this.games.get(id);
  }

  gameExists(id: string): boolean {
    return this.games.has(id);
  }

  isHost(gameId: string, socketId: string): boolean {
    const g = this.games.get(gameId);
    return g?.hostId === socketId;
  }

  isCurrentDrawer(gameId: string, socketId: string): boolean {
    const g = this.games.get(gameId);
    return !!g?.players.find((p) => p.id === socketId)?.isDrawer;
  }

  getCurrentDrawer(gameId: string): Player | undefined {
    return this.games.get(gameId)?.players.find((p) => p.isDrawer);
  }

  /** Marks the next player (round-robin) as drawer without starting the round yet. */
  selectDrawer(gameId: string): Player | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.players.length === 0) return null;

    const index = game.round % game.players.length;

    game.players.forEach((p, i) => {
      p.isDrawer = i === index;
      p.hasGuessed = false;
    });

    return game.players[index];
  }

  addPlayer(gameId: string, player: Player): boolean {
    const g = this.games.get(gameId);
    if (!g) return false;

    if (g.players.some((p) => p.id === player.id)) return true;

    if (g.players.length >= g.maxPlayers) return false;

    g.players.push(player);

    if (!g.hostId) g.hostId = player.id;

    return true;
  }

  /** Removes a player and returns their last known name plus whether the game was deleted. */
  removePlayer(
    gameId: string,
    socketId: string
  ): { name?: string; gameDeleted: boolean } {
    const g = this.games.get(gameId);
    if (!g) return { gameDeleted: false };

    const player = g.players.find((p) => p.id === socketId);
    g.players = g.players.filter((p) => p.id !== socketId);

    // Hand off host duties if the host left.
    if (g.hostId === socketId && g.players.length > 0) {
      g.hostId = g.players[0].id;
    }

    if (g.players.length === 0) {
      this.games.delete(gameId);
      return { name: player?.name, gameDeleted: true };
    }

    return { name: player?.name, gameDeleted: false };
  }

  /** Starts a round for the given (already-chosen) drawer. Only the current drawer may call this. */
  nextRound(gameId: string, drawerId: string, word: string, durationSec: number) {
    const g = this.games.get(gameId);
    if (!g) return;

    g.round += 1;
    g.currentWord = word;
    g.roundEndsAt = Date.now() + durationSec * 1000;
    g.guessedPlayers = [];

    g.players.forEach((p) => {
      p.isDrawer = p.id === drawerId;
      p.hasGuessed = false;
    });
  }

  awardPoints(gameId: string, socketId: string, points: number): boolean {
    const g = this.games.get(gameId);
    if (!g) return false;

    const p = g.players.find((x) => x.id === socketId);
    if (p && !p.isDrawer && !p.hasGuessed) {
      p.score += points;
      p.hasGuessed = true;

      g.guessedPlayers?.push(socketId);
      return true;
    }
    return false;
  }

  allNonDrawersGuessed(gameId: string): boolean {
    const g = this.games.get(gameId);
    if (!g) return false;

    const nonDrawers = g.players.filter((p) => !p.isDrawer);
    return nonDrawers.length > 0 && nonDrawers.every((p) => p.hasGuessed);
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
