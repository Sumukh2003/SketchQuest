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
  Container,
  IconButton,
} from "@mui/material";
import {
  Person,
  People,
  Settings,
  VpnKey,
  AddCircle,
  ArrowForward,
  Edit,
  Check,
  Brush,
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
  const [avatar, setAvatar] = useState("🎨");
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [numRounds, setNumRounds] = useState(3);
  const [isEditingName, setIsEditingName] = useState(false);

  const avatars = ["🎨", "✏️", "🖌️", "🎯", "🌟", "✨", "🔥", "💎"];

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

  const handleNameSubmit = () => {
    if (name.trim()) {
      setIsEditingName(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #faf9f6 0%, #f0ede9 100%)",
        color: "#333",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: "#d35400",
              letterSpacing: "-0.5px",
            }}
          >
            Sketch Quest
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666",
              fontWeight: 400,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Draw, guess, and compete with friends in real-time
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Profile Section */}
          <Grid item xs={12} md={4}>
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              sx={{
                borderRadius: 3,
                background: "white",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e8e6e1",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "rgba(211, 84, 0, 0.1)",
                      color: "#d35400",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#333",
                        fontWeight: 600,
                      }}
                    >
                      Your Profile
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#888", mt: 0.5 }}>
                      Customize your player identity
                    </Typography>
                  </Box>
                </Box>

                {/* Avatar Selection */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "#444",
                      mb: 2,
                      fontWeight: 600,
                    }}
                  >
                    Choose Avatar
                  </Typography>
                  <Grid container spacing={1.5}>
                    {avatars.map((a) => (
                      <Grid item key={a} xs={4} sm={3}>
                        <Avatar
                          onClick={() => setAvatar(a)}
                          sx={{
                            width: 56,
                            height: 56,
                            fontSize: 28,
                            cursor: "pointer",
                            bgcolor: avatar === a ? "#f9e4d4" : "#f8f8f8",
                            color: avatar === a ? "#d35400" : "#666",
                            border: `2px solid ${
                              avatar === a ? "#d35400" : "#e0e0e0"
                            }`,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.05)",
                              borderColor: "#d35400",
                              bgcolor: "#f9e4d4",
                            },
                          }}
                        >
                          {a}
                        </Avatar>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Name Input */}
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ color: "#444", fontWeight: 600 }}
                    >
                      Display Name
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        isEditingName
                          ? handleNameSubmit()
                          : setIsEditingName(true)
                      }
                      sx={{
                        color: isEditingName ? "#27ae60" : "#999",
                        "&:hover": {
                          backgroundColor: "rgba(39, 174, 96, 0.1)",
                        },
                      }}
                    >
                      {isEditingName ? <Check /> : <Edit />}
                    </IconButton>
                  </Box>
                  {isEditingName ? (
                    <TextField
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleNameSubmit()
                      }
                      autoFocus
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fafafa",
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#27ae60",
                          },
                        },
                      }}
                    />
                  ) : (
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: "#fafafa",
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "#27ae60",
                        },
                      }}
                      onClick={() => setIsEditingName(true)}
                    >
                      <Typography sx={{ color: "#333" }}>{name}</Typography>
                    </Paper>
                  )}
                </Box>

                {/* Preview */}
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, #f9e4d4 0%, #f6d5c2 100%)",
                    border: "1px solid #f0c8a8",
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        fontSize: 30,
                        bgcolor: "white",
                        color: "#d35400",
                        border: "2px solid #d35400",
                      }}
                    >
                      {avatar}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ color: "#333", fontWeight: 600 }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#666",
                          display: "block",
                          mt: 0.5,
                          bgcolor: "rgba(255,255,255,0.6)",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        Ready to draw! ✨
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  sx={{
                    borderRadius: 3,
                    background: "white",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                    border: "1px solid #e8e6e1",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: "linear-gradient(90deg, #27ae60, #2ecc71)",
                    }}
                  />
                  <CardContent sx={{ p: 3, pt: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "rgba(39, 174, 96, 0.1)",
                          color: "#27ae60",
                          width: 48,
                          height: 48,
                        }}
                      >
                        <AddCircle />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{ color: "#333", fontWeight: 700 }}
                        >
                          Create Room
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#888", mt: 0.5 }}
                        >
                          Start a new drawing session
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={3}>
                      <TextField
                        select
                        fullWidth
                        label="Max Players"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "#fafafa",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#27ae60",
                            },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <People sx={{ color: "#27ae60" }} />
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

                      <TextField
                        fullWidth
                        type="number"
                        label="Rounds"
                        value={numRounds}
                        onChange={(e) => setNumRounds(Number(e.target.value))}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Settings sx={{ color: "#27ae60" }} />
                            </InputAdornment>
                          ),
                          inputProps: { min: 1, max: 10 },
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "#fafafa",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#27ae60",
                            },
                          },
                        }}
                      />

                      <Button
                        fullWidth
                        size="large"
                        variant="contained"
                        startIcon={<AddCircle />}
                        onClick={create}
                        sx={{
                          py: 1.8,
                          fontWeight: 700,
                          backgroundColor: "#27ae60",
                          "&:hover": {
                            backgroundColor: "#219653",
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(39, 174, 96, 0.3)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Create Game Room
                      </Button>
                    </Stack>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Join Game */}
              <Grid item xs={12} md={6}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  sx={{
                    borderRadius: 3,
                    background: "white",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                    border: "1px solid #e8e6e1",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: "linear-gradient(90deg, #e67e22, #f39c12)",
                    }}
                  />
                  <CardContent sx={{ p: 3, pt: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "rgba(230, 126, 34, 0.1)",
                          color: "#e67e22",
                          width: 48,
                          height: 48,
                        }}
                      >
                        <VpnKey />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{ color: "#333", fontWeight: 700 }}
                        >
                          Join Game
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#888", mt: 0.5 }}
                        >
                          Enter a room code to play
                        </Typography>
                      </Box>
                    </Box>

                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Room Code"
                        value={room}
                        onChange={(e) => setRoom(e.target.value.toUpperCase())}
                        placeholder="Enter 6-digit code"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "#fafafa",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#e67e22",
                            },
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <VpnKey sx={{ color: "#e67e22" }} />
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
                        sx={{
                          py: 1.8,
                          fontWeight: 700,
                          backgroundColor: "#e67e22",
                          "&:hover:not(:disabled)": {
                            backgroundColor: "#d35400",
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(230, 126, 34, 0.3)",
                          },
                          "&:disabled": {
                            opacity: 0.6,
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Join Room
                      </Button>
                    </Stack>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Bottom Info Card */}
              <Grid item xs={12}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  sx={{
                    borderRadius: 3,
                    background: "white",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                    border: "1px solid #e8e6e1",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "rgba(211, 84, 0, 0.1)",
                          color: "#d35400",
                        }}
                      >
                        <Brush />
                      </Avatar>
                      <Typography
                        variant="h6"
                        sx={{ color: "#333", fontWeight: 600 }}
                      >
                        About Sketch Quest
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#666", lineHeight: 1.6 }}
                    >
                      A fun, social drawing game where players take turns
                      drawing prompts while others guess in real-time. Perfect
                      for game nights with friends or making new connections!
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            mt: 8,
            pt: 4,
            borderTop: "1px solid #e8e6e1",
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#888",
              maxWidth: 600,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            © {new Date().getFullYear()} Sketch Quest
            <br />
            All user-generated content reflects individual creativity
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
