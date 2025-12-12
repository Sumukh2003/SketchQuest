import { Game, Player } from "../types";

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
      maxRounds,
      maxPlayers,
      guessedPlayers: [],
    };

    this.games.set(id, game);
    return game;
  }

  getGame(id: string): Game | undefined {
    return this.games.get(id);
  }

  isHost(gameId: string, socketId: string): boolean {
    const g = this.games.get(gameId);
    return g?.hostId === socketId;
  }

  selectDrawer(gameId: string) {
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

  addPlayer(gameId: string, player: Player) {
    const g = this.games.get(gameId);
    if (!g) return;

    if (g.players.some((p) => p.id === player.id)) return;

    if (g.players.length >= g.maxPlayers) return;

    g.players.push(player);

    if (!g.hostId) g.hostId = player.id;
  }

  removePlayer(gameId: string, socketId: string) {
    const g = this.games.get(gameId);
    if (!g) return;

    g.players = g.players.filter((p) => p.id !== socketId);

    if (g.players.length === 0) {
      this.games.delete(gameId);
    }
  }

  nextRound(gameId: string, word: string, durationSec: number) {
    const g = this.games.get(gameId);
    if (!g) return;

    g.round += 1;
    g.currentWord = word;
    g.roundEndsAt = Date.now() + durationSec * 1000;
    g.guessedPlayers = [];

    const drawerIndex = (g.round - 1) % g.players.length;
    g.players.forEach((p, i) => {
      p.isDrawer = i === drawerIndex;
      p.hasGuessed = false;
    });
  }

  awardPoints(gameId: string, socketId: string, points: number) {
    const g = this.games.get(gameId);
    if (!g) return;

    const p = g.players.find((x) => x.id === socketId);
    if (p && !p.isDrawer && !p.hasGuessed) {
      p.score += points;
      p.hasGuessed = true;

      g.guessedPlayers?.push(socketId);
    }
  }

  allNonDrawersGuessed(gameId: string): boolean {
    const g = this.games.get(gameId);
    if (!g) return false;

    const nonDrawers = g.players.filter((p) => !p.isDrawer);
    return nonDrawers.every((p) => p.hasGuessed);
  }
}
