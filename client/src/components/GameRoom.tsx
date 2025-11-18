import React from "react";
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
} from "@mui/material";
import {
  ExitToApp as ExitIcon,
  People as PeopleIcon,
  Brush as BrushIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { GameState } from "../types";

interface GameRoomProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameRoom: React.FC<GameRoomProps> = ({ gameState, setGameState }) => {
  const handleLeaveRoom = () => {
    setGameState((prev) => ({ ...prev, room: null }));
  };

  const mockPlayers = [
    { id: 1, username: "You", score: 0, is_host: true },
    { id: 2, username: "Alice", score: 150, is_host: false },
    { id: 3, username: "Bob", score: 75, is_host: false },
  ];

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
            Room: {gameState.room?.name}
          </Typography>
          <Chip
            label={gameState.room?.code}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "1.1rem" }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <PeopleIcon color="action" />
          <Typography variant="body1" color="text.secondary">
            {mockPlayers.length} / {gameState.room?.max_players} players
          </Typography>
          <Chip
            label={gameState.gameStatus}
            color={gameState.gameStatus === "playing" ? "success" : "warning"}
            size="small"
          />
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
              <BrushIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              <Typography variant="h5" gutterBottom color="text.secondary">
                Drawing Canvas
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
              >
                The interactive drawing canvas will be implemented in Day 4.
                <br />
                Players will draw and guess here in real-time!
              </Typography>
              <Box
                sx={{ mt: 3, p: 2, bgcolor: "primary.light", borderRadius: 2 }}
              >
                <Typography variant="body2" color="white" textAlign="center">
                  🎨 Coming Soon: Smooth drawing, colors, brushes, and real-time
                  synchronization!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Players List */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PeopleIcon /> Players ({mockPlayers.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                {mockPlayers.map((player) => (
                  <Box
                    key={player.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2">
                      {player.username} {player.is_host && "👑"}
                    </Typography>
                    <Chip label={player.score} size="small" color="primary" />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Chat Box */}
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ChatIcon /> Chat
              </Typography>
              <Box
                sx={{
                  height: 200,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontStyle="italic"
                >
                  Chat functionality coming in Day 5...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameRoom;
