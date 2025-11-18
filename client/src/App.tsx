import React, { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  CssBaseline,
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
} from "@mui/material";
import { sketchQuestTheme } from "./themes/theme";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";
import { GameState } from "./types";

function App() {
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    players: [],
    messages: [],
    currentDrawer: null,
    wordHint: null,
    timeLeft: 0,
    gameStatus: "waiting",
    isDrawing: false,
    currentWord: null,
  });

  return (
    <ThemeProvider theme={sketchQuestTheme}>
      <CssBaseline />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography
              variant="h4"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                background: "linear-gradient(45deg, #ffffff, #e0e7ff)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              🎨 SketchQuest
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Real-time Drawing & Guessing Game
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {!gameState.room ? (
            <Lobby
              onRoomJoin={(room) => setGameState((prev) => ({ ...prev, room }))}
            />
          ) : (
            <GameRoom gameState={gameState} setGameState={setGameState} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
