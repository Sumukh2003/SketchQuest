import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Chip,
  Avatar,
  Container,
  Alert,
  Fab,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Groups as GroupsIcon,
  PlayArrow as PlayIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { io, Socket } from "socket.io-client";
import { Room, CreateRoomForm } from "../types";

interface LobbyProps {
  onRoomJoin: (room: Room) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onRoomJoin }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joinData, setJoinData] = useState({ roomCode: "", username: "" });
  const [createForm, setCreateForm] = useState<CreateRoomForm>({
    name: "",
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    isPublic: true,
    password: "",
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Handle room created
    newSocket.on("room_created", (data) => {
      if (data.success) {
        console.log("Room created:", data);
        const mockRoom: Room = {
          id: Date.now().toString(), // Changed to string
          code: data.room.code,
          name: data.room.name,
          max_players: 8,
          rounds: 3,
          draw_time: 80,
          is_public: true,
          status: "waiting",
        };

        setNotification({
          message: `Room ${data.room.code} created!`,
          type: "success",
        });
        setTimeout(() => onRoomJoin(mockRoom), 1000);
      }
    });

    // Handle room joined
    newSocket.on("room_joined", (data) => {
      if (data.success) {
        console.log("Room joined:", data);
        const mockRoom: Room = {
          id: Date.now().toString(), // Changed to string
          code: data.room.code,
          name: data.room.name,
          max_players: data.room.maxPlayers,
          rounds: 3,
          draw_time: 80,
          is_public: true,
          status: "waiting",
        };
        setNotification({
          message: `Joined room ${data.room.code}!`,
          type: "success",
        });
        setTimeout(() => onRoomJoin(mockRoom), 1000);
      }
    });

    // Handle errors
    newSocket.on("join_error", (data) => {
      setNotification({ message: `Error: ${data.error}`, type: "error" });
    });

    newSocket.on("error", (data) => {
      setNotification({ message: `Error: ${data.message}`, type: "error" });
    });

    // Test connection
    newSocket.on("connect", () => {
      console.log("Connected to server with ID:", newSocket.id);
    });

    return () => {
      newSocket.close();
    };
  }, [onRoomJoin]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) {
      setNotification({ message: "Not connected to server", type: "error" });
      return;
    }

    if (!joinData.roomCode.trim() || !joinData.username.trim()) {
      setNotification({
        message: "Please enter room code and username",
        type: "error",
      });
      return;
    }

    console.log("Joining room:", joinData);
    socket.emit("join_room", {
      roomCode: joinData.roomCode.toUpperCase(),
      username: joinData.username,
    });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) {
      setNotification({ message: "Not connected to server", type: "error" });
      return;
    }

    if (!createForm.name.trim() || !joinData.username.trim()) {
      setNotification({
        message: "Please enter room name and username",
        type: "error",
      });
      return;
    }

    console.log("Creating room:", {
      ...createForm,
      username: joinData.username,
    });
    socket.emit("create_room", {
      roomName: createForm.name,
      username: joinData.username,
      maxPlayers: createForm.maxPlayers,
      rounds: createForm.rounds,
      drawTime: createForm.drawTime,
    });
  };

  const handleQuickStart = () => {
    const randomUsername = `Player${Math.floor(Math.random() * 1000)}`;
    const roomName = `Quick Room ${Math.floor(Math.random() * 100)}`;

    setJoinData((prev) => ({ ...prev, username: randomUsername }));
    setCreateForm((prev) => ({ ...prev, name: roomName }));

    // Auto-create room after a delay
    setTimeout(() => {
      if (socket) {
        socket.emit("create_room", {
          roomName: roomName,
          username: randomUsername,
          maxPlayers: 4,
          rounds: 2,
          drawTime: 60,
        });
      }
    }, 500);
  };

  return (
    <Container maxWidth="lg">
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={notification?.type}
          onClose={() => setNotification(null)}
          sx={{ width: "100%" }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      <Grid container spacing={4}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)",
              backdropFilter: "blur(10px)",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: "linear-gradient(45deg, #6366f1, #ec4899)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                mb: 2,
              }}
            >
              Welcome to SketchQuest! 🎨
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Draw, guess, and compete with players around the world in
              real-time!
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                icon={<GroupsIcon />}
                label="Multiplayer"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PlayIcon />}
                label="Real-time"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<TrophyIcon />}
                label="Competitive"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Join Room Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 3,
                  background: "linear-gradient(45deg, #10b981, #34d399)",
                }}
              >
                <PlayIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Join Existing Room
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter a room code to join your friends
              </Typography>

              <Box component="form" onSubmit={handleJoinRoom}>
                <TextField
                  fullWidth
                  label="Username"
                  value={joinData.username}
                  onChange={(e) =>
                    setJoinData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  margin="normal"
                  placeholder="Enter your display name"
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Room Code"
                  value={joinData.roomCode}
                  onChange={(e) =>
                    setJoinData((prev) => ({
                      ...prev,
                      roomCode: e.target.value.toUpperCase(),
                    }))
                  }
                  margin="normal"
                  placeholder="e.g., ABC123"
                  sx={{ mb: 3 }}
                  required
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!socket || !joinData.roomCode || !joinData.username}
                  startIcon={<GroupsIcon />}
                >
                  {socket ? "Join Room" : "Connecting..."}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Create Room Card */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={4}
            sx={{
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 3,
                  background: "linear-gradient(45deg, #6366f1, #818cf8)",
                }}
              >
                <AddIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Create New Room
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start a new game and invite friends
              </Typography>

              <Box component="form" onSubmit={handleCreateRoom}>
                <TextField
                  fullWidth
                  label="Username"
                  value={joinData.username}
                  onChange={(e) =>
                    setJoinData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  margin="normal"
                  placeholder="Enter your display name"
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Room Name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  margin="normal"
                  placeholder="e.g., Art Masters Tournament"
                  sx={{ mb: 2 }}
                  required
                />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max Players"
                      type="number"
                      value={createForm.maxPlayers}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          maxPlayers: parseInt(e.target.value),
                        }))
                      }
                      inputProps={{ min: 2, max: 12 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Rounds"
                      type="number"
                      value={createForm.rounds}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          rounds: parseInt(e.target.value),
                        }))
                      }
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Draw Time (seconds)"
                  type="number"
                  value={createForm.drawTime}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      drawTime: parseInt(e.target.value),
                    }))
                  }
                  margin="normal"
                  sx={{ mb: 3 }}
                  inputProps={{ min: 30, max: 180 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!socket || !createForm.name || !joinData.username}
                  startIcon={<AddIcon />}
                  sx={{
                    background: "linear-gradient(45deg, #6366f1, #818cf8)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #4f46e5, #6366f1)",
                    },
                  }}
                >
                  {socket ? "Create Room" : "Connecting..."}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Connection Status */}
        <Grid item xs={12}>
          <Alert
            severity={socket?.connected ? "success" : "warning"}
            sx={{
              borderRadius: 3,
              background: socket?.connected
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
              border: socket?.connected
                ? "1px solid rgba(16, 185, 129, 0.2)"
                : "1px solid rgba(245, 158, 11, 0.2)",
            }}
          >
            <Typography variant="body2">
              {socket?.connected
                ? `✅ Connected to server (ID: ${socket.id?.substring(
                    0,
                    8
                  )}...)`
                : "⚠️ Connecting to server..."}
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Floating Action Button for Quick Start */}
      <Fab
        color="primary"
        aria-label="quick start"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "linear-gradient(45deg, #ec4899, #f472b6)",
        }}
        onClick={handleQuickStart}
      >
        <PlayIcon />
      </Fab>
    </Container>
  );
};

export default Lobby;
