import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  TextField,
  Stack,
  Paper,
  Typography,
  MenuItem,
  Box,
  Grid,
  Avatar,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  Container,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Person,
  People,
  Settings,
  VpnKey,
  AddCircle,
  ArrowForward,
  Brush,
  Info,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { socket } from "../socket";

const MotionCard = motion(Card);

export default function Lobby({
  onJoin,
}: {
  onJoin: (room: string, name: string, avatar: string) => void;
}) {
  const [name, setName] = useState("Player" + Math.floor(Math.random() * 1000));
  const [room, setRoom] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [numRounds, setNumRounds] = useState(3);

  const avatars = ["🦊", "🐱", "🐶", "🐼", "🐸", "🦁", "🐵"];

  const create = () => {
    socket.emit(
      "create_game",
      { name, maxPlayers, numRounds, avatar },
      (res: { room: string }) => {
        onJoin(res.room, name, avatar);
      }
    );
  };

  const join = () => {
    if (!room) return;
    socket.emit("join_game", { room, name, avatar }, (res: { ok: any }) => {
      if (res?.ok) onJoin(room, name, avatar);
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #8e9eff 0%, #5b5be0 40%, #2b2f77 100%)",
        color: "white",
      }}
    >
      {/* Top App Bar */}
      {/* <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar sx={{ maxWidth: 1400, width: "100%", mx: "auto" }}>
          <Brush sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Sketch Quest
          </Typography>
          <Tooltip title="About the game">
            <IconButton color="inherit">
              <Info />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar> */}

      <Container maxWidth={false} sx={{ py: 1, maxWidth: 1400 }}>
        {/* Hero */}
        <Box textAlign="center" mb={2}>
          <Typography
            variant="h2"
            fontWeight={600}
            sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" } }}
          >
            Sketch Quest
          </Typography>
          <Typography sx={{ opacity: 0.85, mt: 1 }}>
            A real‑time multiplayer drawing & guessing game
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Player Profile */}
          <Grid item xs={12} md={4}>
            <MotionCard
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              sx={{
                height: "100%",
                borderRadius: 3,
                background: "rgba(255,255,255,0.95)",
                color: "text.primary",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} mb={1}>
                  Player Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Choose how others see you
                </Typography>

                <Typography fontWeight={600} mb={2}>
                  Avatar
                </Typography>
                <Grid container spacing={2} mb={3}>
                  {avatars.map((a) => (
                    <Grid item key={a}>
                      <Avatar
                        onClick={() => setAvatar(a)}
                        sx={{
                          width: 56,
                          height: 56,
                          fontSize: 26,
                          cursor: "pointer",
                          border:
                            avatar === a
                              ? "3px solid #5b5be0"
                              : "2px solid #ddd",
                          transition: "0.2s",
                          bgcolor: avatar === a ? "#eef" : "transparent",
                        }}
                      >
                        {a}
                      </Avatar>
                    </Grid>
                  ))}
                </Grid>

                <TextField
                  fullWidth
                  label="Player Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />

                <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "#5b5be0" }}>{avatar}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ready to play
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Game Actions */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={4}>
              {/* Create Game */}
              <Grid item xs={12} md={6}>
                <MotionCard
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  sx={{ borderRadius: 3, height: "100%" }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={800} mb={1}>
                      Create Game Room
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Host a private match with custom rules
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          select
                          fullWidth
                          label="Max Players"
                          value={maxPlayers}
                          onChange={(e) =>
                            setMaxPlayers(Number(e.target.value))
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <People />
                              </InputAdornment>
                            ),
                          }}
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <MenuItem key={n} value={n}>
                              {n} Players
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Rounds"
                          value={numRounds}
                          onChange={(e) => setNumRounds(Number(e.target.value))}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Settings />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          size="large"
                          variant="contained"
                          startIcon={<AddCircle />}
                          onClick={create}
                          sx={{ py: 1.8, fontWeight: 700 }}
                        >
                          Create Room
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Join Game */}
              <Grid item xs={12} md={6}>
                <MotionCard
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  sx={{ borderRadius: 3, height: "100%" }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={800} mb={1}>
                      Join Game
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Enter a room code to jump in
                    </Typography>

                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Room Code"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <VpnKey />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Button
                        fullWidth
                        size="large"
                        variant="contained"
                        endIcon={<ArrowForward />}
                        disabled={!room.trim()}
                        onClick={join}
                        sx={{ py: 1.8, fontWeight: 700 }}
                      >
                        Join
                      </Button>
                    </Stack>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box mt={6} textAlign="center" sx={{ opacity: 0.7 }}>
          <Typography variant="caption">
            © Sketch Quest <br /> The owner of this site is not responsible for
            any user generated content (drawings, messages, usernames)
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
