import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  AvatarGroup,
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
} from "@mui/material";
import {
  ExitToApp as ExitIcon,
  People as PeopleIcon,
  Brush as BrushIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { GameState, Message, Player } from "../types";
import { io, Socket } from "socket.io-client";

interface GameRoomProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameRoom: React.FC<GameRoomProps> = ({ gameState, setGameState }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Listen for game events
    newSocket.on("player_joined", (data) => {
      setPlayers(data.players);
    });

    newSocket.on("player_left", (data) => {
      setPlayers(data.players);
    });

    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("game_started", (data) => {
      setGameState((prev) => ({
        ...prev,
        gameStatus: "playing",
        currentDrawer: data.drawer,
      }));
    });

    newSocket.on("round_started", (data) => {
      setGameState((prev) => ({
        ...prev,
        wordHint: "_ ".repeat(data.wordLength).trim(),
        currentDrawer: data.drawer,
      }));
    });

    newSocket.on("correct_guess", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: data.username,
          message: `Guessed the word "${data.word}"! +${data.points} points!`,
          isCorrect: true,
          timestamp: new Date(),
        },
      ]);
    });

    return () => {
      newSocket.close();
    };
  }, [setGameState]);

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit("leave_room", { roomCode: gameState.room?.code });
      socket.disconnect();
    }
    setGameState((prev) => ({ ...prev, room: null }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !socket || !gameState.room) return;

    socket.emit("send_message", {
      roomCode: gameState.room.code,
      message: chatMessage,
    });

    setChatMessage("");
  };

  const handleStartGame = () => {
    if (socket && gameState.room) {
      socket.emit("start_game", { roomCode: gameState.room.code });
    }
  };

  const isHost = players.some((p) => p.username === "You" && p.is_host);

  return (
    <Box sx={{ p: 3 }}>
      {/* Room Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {gameState.room?.name}
          </Typography>
          <Chip
            label={`Code: ${gameState.room?.code}`}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "1.1rem" }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <PeopleIcon color="action" />
          <Typography variant="body1" color="text.secondary">
            {players.length} players
          </Typography>
          <Chip
            label={gameState.gameStatus}
            color={gameState.gameStatus === "playing" ? "success" : "warning"}
            size="small"
          />
          {isHost && gameState.gameStatus === "waiting" && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartGame}
              disabled={players.length < 2}
            >
              Start Game
            </Button>
          )}
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<ExitIcon />}
          onClick={handleLeaveRoom}
        >
          Leave Room
        </Button>
      </Paper>

      <Grid container spacing={3}>
        {/* Game Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 500 }}>
            <CardContent
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              }}
            >
              {gameState.gameStatus === "playing" ? (
                <>
                  <BrushIcon
                    sx={{ fontSize: 64, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h5" gutterBottom>
                    {gameState.currentDrawer === socket?.id
                      ? "Your Turn to Draw!"
                      : "Guess the Drawing!"}
                  </Typography>
                  {gameState.wordHint && (
                    <Typography variant="h6" sx={{ mb: 2, letterSpacing: 3 }}>
                      {gameState.wordHint}
                    </Typography>
                  )}
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    textAlign="center"
                  >
                    {gameState.currentDrawer === socket?.id
                      ? "The word is: [Only you can see this]"
                      : "Type your guesses in the chat!"}
                  </Typography>
                </>
              ) : (
                <>
                  <BrushIcon
                    sx={{ fontSize: 64, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h5" gutterBottom color="text.secondary">
                    Waiting to Start
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    textAlign="center"
                  >
                    {isHost
                      ? 'Click "Start Game" when ready!'
                      : "Waiting for host to start the game..."}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Players List */}
          <Card sx={{ mb: 3, maxHeight: 300 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PeopleIcon /> Players ({players.length})
              </Typography>
              <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                {players.map((player) => (
                  <ListItem key={player.id} sx={{ py: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                      >
                        {player.username.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {player.username}
                          </Typography>
                          {player.is_host && <Chip label="Host" size="small" />}
                        </Box>
                      }
                      secondary={`Score: ${player.score}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Chat Box */}
          <Card sx={{ height: 300 }}>
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ChatIcon /> Chat
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  overflow: "auto",
                }}
              >
                {messages.map((msg, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {msg.username}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: msg.isCorrect ? "success.main" : "text.primary",
                        fontWeight: msg.isCorrect ? 600 : 400,
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
                  >
                    No messages yet. Start chatting!
                  </Typography>
                )}
              </Box>
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
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!chatMessage.trim()}
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
