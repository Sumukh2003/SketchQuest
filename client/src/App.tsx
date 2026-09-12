import React, { useState } from "react";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import {
  Box,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
  CssBaseline,
} from "@mui/material";

const baseTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#d35400" },
    secondary: { main: "#27ae60" },
    background: { default: "#faf9f6" },
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(","),
  },
  shape: { borderRadius: 10 },
});

// Scales heading font sizes down on small screens so the lobby title etc.
// don't overflow narrow phone widths.
const theme = responsiveFontSizes(baseTheme);

type Session = { room: string; name: string; avatar: string };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        {!session ? (
          <Lobby
            onJoin={(room, name, avatar) => setSession({ room, name, avatar })}
          />
        ) : (
          <Game
            room={session.room}
            name={session.name}
            avatar={session.avatar}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}
