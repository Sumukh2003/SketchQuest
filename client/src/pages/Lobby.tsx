import React, { useState } from "react";
import {
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
} from "@mui/material";
import { socket } from "../socket";
import {
  Person,
  People,
  Settings,
  VpnKey,
  AddCircle,
  ArrowForward,
} from "@mui/icons-material";

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
  const avatars = ["🦊", "🐱", "🐶", "🐼", "🐸"];

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
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: { xs: 2, md: 4 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "60%",
          height: "100%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
          transform: "rotate(45deg)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "40%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: { xs: 2, md: 6 },
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "white",
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              mb: 1,
              letterSpacing: "-0.5px",
            }}
          >
            🎨 Sketch Quest
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.8)",
              fontWeight: 300,
              maxWidth: 500,
              mx: "auto",
            }}
          >
            Draw, guess, and have fun with friends
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Profile Section */}
          <Grid item xs={12} md={5}>
            <Card
              elevation={8}
              sx={{
                borderRadius: 3,
                height: "100%",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: "#667eea",
                      width: 48,
                      height: 48,
                      mr: 2,
                    }}
                  >
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Player Setup
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customize your profile
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 3 }}>
                  Choose Your Avatar
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {avatars.map((a) => (
                    <Grid item key={a}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          fontSize: 28,
                          cursor: "pointer",
                          border:
                            avatar === a
                              ? "3px solid #667eea"
                              : "2px solid #e0e0e0",
                          bgcolor: avatar === a ? "#667eea10" : "transparent",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                            borderColor: avatar === a ? "#667eea" : "#bdbdbd",
                          },
                        }}
                        onClick={() => setAvatar(a)}
                      >
                        {a}
                      </Avatar>
                    </Grid>
                  ))}
                </Grid>

                <TextField
                  fullWidth
                  label="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: "#f8f9ff",
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Preview
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "#667eea", mr: 2, fontSize: 18 }}>
                      {avatar || "👤"}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>
                        {name || "Player Name"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ready to play
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Game Actions Section */}
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              {/* Create Game Card */}
              <Card
                elevation={8}
                sx={{
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: "#4caf50",
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      <AddCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Create New Game
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start a private room with custom settings
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        label="Max Players"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <People color="action" />
                            </InputAdornment>
                          ),
                        }}
                      >
                        {[2, 3, 4, 5, 6].map((n) => (
                          <MenuItem key={n} value={n}>
                            {n} Players
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Number of Rounds"
                        type="number"
                        value={numRounds}
                        onChange={(e) => setNumRounds(Number(e.target.value))}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Settings color="action" />
                            </InputAdornment>
                          ),
                          inputProps: { min: 1, max: 10 },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={create}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          background:
                            "linear-gradient(45deg, #4caf50, #2e7d32)",
                          fontSize: "1rem",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #43a047, #1b5e20)",
                          },
                        }}
                        startIcon={<ArrowForward />}
                      >
                        Create Game Room
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Divider with OR */}
              <Box sx={{ display: "flex", alignItems: "center", px: 2 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    px: 3,
                    py: 1,
                    color: "rgba(255,255,255,0.6)",
                    bgcolor: "rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    fontWeight: 500,
                  }}
                >
                  OR
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* Join Game Card */}
              <Card
                elevation={8}
                sx={{
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,248,248,0.95) 100%)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: "#ff4081",
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      <VpnKey />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Join Existing Game
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Enter a room code to join friends
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Room Code"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        variant="outlined"
                        placeholder="Enter room ID"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <VpnKey color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={join}
                        disabled={!room.trim()}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          background:
                            "linear-gradient(45deg, #ff4081, #c51162)",
                          fontSize: "1rem",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #f50057, #9a0036)",
                          },
                          "&.Mui-disabled": {
                            background: "#e0e0e0",
                          },
                        }}
                        startIcon={<ArrowForward />}
                      >
                        Join Game
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(5px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  💡 Quick Tips
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.7)" }}
                >
                  1. Share the room code with friends to play together
                  <br />
                  2. Choose rounds based on your available time
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            mt: 6,
            textAlign: "center",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <Typography variant="caption">
            Draw your imagination • Guess with friends • Have fun together
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
