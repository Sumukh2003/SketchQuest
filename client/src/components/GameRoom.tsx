import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Badge,
} from "@mui/material";
import {
  ExitToApp as ExitIcon,
  People as PeopleIcon,
  Brush as BrushIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import { GameState, Message, Player } from "../types";
import { io, Socket } from "socket.io-client";
import DrawingCanvas from "./DrawingCanvas";

interface GameRoomProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

// Define the Score type for socket events
interface ScoreData {
  username: string;
  score: number;
}

const GameRoom: React.FC<GameRoomProps> = ({ gameState, setGameState }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", username: "You", score: 0, is_host: true },
    { id: "2", username: "Alice", score: 150, is_host: false },
    { id: "3", username: "Bob", score: 75, is_host: false },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      username: "System",
      message: "Welcome to the game!",
      isCorrect: false,
      timestamp: new Date(),
    },
    {
      username: "Alice",
      message: "Is it a cat?",
      isCorrect: false,
      timestamp: new Date(),
    },
    {
      username: "Bob",
      message: "Maybe a house?",
      isCorrect: false,
      timestamp: new Date(),
    },
  ]);
  const [timeLeft, setTimeLeft] = useState(80);
  const [round, setRound] = useState(1);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Define event handlers with proper typing
    const handlePlayerJoined = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleGameStarted = (data: { drawer: string | null }) => {
      setGameState((prev) => ({
        ...prev,
        gameStatus: "playing",
        currentDrawer: data.drawer,
      }));
      setTimeLeft(80);
    };

    const handleRoundStarted = (data: {
      drawer: string;
      wordLength: number;
      round: number;
    }) => {
      setGameState((prev) => ({
        ...prev,
        wordHint: "_ ".repeat(data.wordLength).trim(),
        currentDrawer: data.drawer,
        isDrawing: data.drawer === newSocket.id,
      }));
      setRound(data.round);
      setTimeLeft(80);
    };

    const handleRoundEnded = (data: { word: string; scores: ScoreData[] }) => {
      setGameState((prev) => ({
        ...prev,
        gameStatus: "finished",
        currentWord: data.word,
      }));
      // Update scores
      setPlayers((prev) =>
        prev.map((p) => {
          const newScore = data.scores.find((s) => s.username === p.username);
          return newScore ? { ...p, score: newScore.score } : p;
        })
      );
    };

    const handleCorrectGuess = (data: {
      username: string;
      word: string;
      points: number;
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          username: data.username,
          message: `Guessed the word "${data.word}"! +${data.points} points!`,
          isCorrect: true,
          timestamp: new Date(),
        },
      ]);
      // Update player score
      setPlayers((prev) =>
        prev.map((p) =>
          p.username === data.username
            ? { ...p, score: p.score + data.points }
            : p
        )
      );
    };

    const handleTimerUpdate = (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    };

    const handleYourTurnToDraw = (data: { word: string }) => {
      setGameState((prev) => ({
        ...prev,
        currentWord: data.word,
        isDrawing: true,
      }));
    };

    // Attach event listeners
    newSocket.on("player_joined", handlePlayerJoined);
    newSocket.on("player_left", handlePlayerLeft);
    newSocket.on("new_message", handleNewMessage);
    newSocket.on("game_started", handleGameStarted);
    newSocket.on("round_started", handleRoundStarted);
    newSocket.on("round_ended", handleRoundEnded);
    newSocket.on("correct_guess", handleCorrectGuess);
    newSocket.on("timer_update", handleTimerUpdate);
    newSocket.on("your_turn_to_draw", handleYourTurnToDraw);

    return () => {
      // Clean up event listeners
      newSocket.off("player_joined", handlePlayerJoined);
      newSocket.off("player_left", handlePlayerLeft);
      newSocket.off("new_message", handleNewMessage);
      newSocket.off("game_started", handleGameStarted);
      newSocket.off("round_started", handleRoundStarted);
      newSocket.off("round_ended", handleRoundEnded);
      newSocket.off("correct_guess", handleCorrectGuess);
      newSocket.off("timer_update", handleTimerUpdate);
      newSocket.off("your_turn_to_draw", handleYourTurnToDraw);
      newSocket.close();
    };
  }, [setGameState]);

  // Timer effect
  useEffect(() => {
    if (gameState.gameStatus !== "playing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStatus, timeLeft]);

  const handleLeaveRoom = () => {
    if (socket && gameState.room?.code) {
      socket.emit("leave_room", { roomCode: gameState.room.code });
      socket.disconnect();
    }
    setGameState((prev) => ({ ...prev, room: null }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !socket || !gameState.room?.code) return;

    socket.emit("send_message", {
      roomCode: gameState.room.code,
      message: chatMessage,
    });

    // Add local message immediately for better UX
    setMessages((prev) => [
      ...prev,
      {
        username: "You",
        message: chatMessage,
        isCorrect: false,
        timestamp: new Date(),
      },
    ]);

    setChatMessage("");
  };

  const handleStartGame = () => {
    if (socket && gameState.room?.code) {
      socket.emit("start_game", { roomCode: gameState.room.code });
    }
  };

  const isHost = players.some((p) => p.username === "You" && p.is_host);
  const isDrawer = gameState.isDrawing;
  const currentDrawerUsername = players.find(
    (p) => p.id === gameState.currentDrawer
  )?.username;

  return (
    <Box
      sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Room Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {gameState.room?.name}
            </Typography>
            <Chip
              label={`Code: ${gameState.room?.code}`}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              icon={<TimerIcon />}
              label={`${timeLeft}s`}
              color={timeLeft < 20 ? "error" : "primary"}
              variant="outlined"
            />
            <Chip
              label={`Round ${round}/3`}
              color="secondary"
              variant="outlined"
            />
            {isHost && gameState.gameStatus === "waiting" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartGame}
                disabled={players.length < 2}
                size="small"
              >
                Start Game
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitIcon />}
              onClick={handleLeaveRoom}
              size="small"
            >
              Leave
            </Button>
          </Box>
        </Box>

        {/* Game Status Bar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {players.length} players
            </Typography>
          </Box>
          <Chip
            label={gameState.gameStatus.toUpperCase()}
            color={gameState.gameStatus === "playing" ? "success" : "warning"}
            size="small"
          />
          {gameState.currentDrawer && (
            <Typography variant="body2" color="text.secondary">
              Drawer:{" "}
              {gameState.currentDrawer === socket?.id
                ? "You"
                : currentDrawerUsername}
            </Typography>
          )}
        </Box>

        {/* Timer Progress */}
        {gameState.gameStatus === "playing" && (
          <LinearProgress
            variant="determinate"
            value={(timeLeft / 80) * 100}
            sx={{ mt: 1, height: 6, borderRadius: 3 }}
            color={timeLeft < 20 ? "error" : "primary"}
          />
        )}
      </Paper>

      {/* Main Game Area */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left Column - Canvas */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <Card
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <CardContent
              sx={{ flex: 1, p: 0, display: "flex", flexDirection: "column" }}
            >
              <DrawingCanvas
                socket={socket}
                roomCode={gameState.room?.code || ""}
                isDrawingEnabled={gameState.gameStatus === "playing"}
                isDrawer={isDrawer || false}
                wordHint={gameState.wordHint}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Players & Chat */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minHeight: 0,
          }}
        >
          {/* Players Card */}
          <Card
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                p: 2,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PeopleIcon /> Players ({players.length})
              </Typography>
              <List dense sx={{ flex: 1, overflow: "auto" }}>
                {players.map((player) => (
                  <ListItem
                    key={player.id}
                    sx={{
                      py: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      backgroundColor:
                        player.id === gameState.currentDrawer
                          ? "action.hover"
                          : "transparent",
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        badgeContent={player.score}
                        anchorOrigin={{ vertical: "top", horizontal: "left" }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: player.is_host
                              ? "primary.main"
                              : "secondary.main",
                          }}
                        >
                          {player.username.charAt(0)}
                          {player.is_host && "👑"}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="subtitle2">
                            {player.username}
                          </Typography>
                          {player.id === gameState.currentDrawer && (
                            <BrushIcon fontSize="small" color="primary" />
                          )}
                          {player.is_host && <Chip label="Host" size="small" />}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Score: {player.score} points
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{
                flex: 1,
                p: 2,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ChatIcon /> Chat
              </Typography>

              {/* Chat Messages */}
              <Box
                sx={{
                  flex: 1,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  p: 1.5,
                  mb: 2,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: msg.isCorrect
                        ? "success.light"
                        : "transparent",
                      borderLeft: msg.isCorrect ? "4px solid" : "none",
                      borderColor: "success.main",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="medium"
                        color={
                          msg.isCorrect ? "success.dark" : "text.secondary"
                        }
                      >
                        {msg.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: msg.isCorrect ? "success.dark" : "text.primary",
                        fontWeight: msg.isCorrect ? 600 : 400,
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.message}
                    </Typography>
                  </Box>
                ))}
                {messages.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontStyle="italic"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No messages yet. Start chatting!
                  </Typography>
                )}
              </Box>

              {/* Chat Input */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{ display: "flex", gap: 1 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type your guess..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={!socket}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!chatMessage.trim()}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "grey.300",
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameRoom;
