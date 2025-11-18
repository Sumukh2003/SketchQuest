import React, { useState } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Groups as GroupsIcon,
  PlayArrow as PlayIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { Room, CreateRoomForm } from "../types";

interface LobbyProps {
  onRoomJoin: (room: Room) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onRoomJoin }) => {
  const [joinData, setJoinData] = useState({ roomCode: "", username: "" });
  const [createForm, setCreateForm] = useState<CreateRoomForm>({
    name: "",
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    isPublic: true,
    password: "",
  });

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual room joining logic
    console.log("Joining room:", joinData);

    // Mock room for testing
    const mockRoom: Room = {
      id: 1,
      code: joinData.roomCode || "TEST123",
      name: "Test Room",
      max_players: 8,
      rounds: 3,
      draw_time: 80,
      is_public: true,
      status: "waiting",
    };
    onRoomJoin(mockRoom);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual room creation logic
    console.log("Creating room:", createForm);

    // Mock room for testing
    const mockRoom: Room = {
      id: 1,
      code: "NEW123",
      name: createForm.name,
      max_players: createForm.maxPlayers,
      rounds: createForm.rounds,
      draw_time: createForm.drawTime,
      is_public: createForm.isPublic,
      status: "waiting",
    };
    onRoomJoin(mockRoom);
  };

  return (
    <Container maxWidth="lg">
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
                  label="Room Code"
                  value={joinData.roomCode}
                  onChange={(e) =>
                    setJoinData((prev) => ({
                      ...prev,
                      roomCode: e.target.value,
                    }))
                  }
                  margin="normal"
                  placeholder="e.g., ABC123"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Your Username"
                  value={joinData.username}
                  onChange={(e) =>
                    setJoinData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  margin="normal"
                  placeholder="Enter your display name"
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!joinData.roomCode || !joinData.username}
                  startIcon={<GroupsIcon />}
                >
                  Join Room
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
                  label="Room Name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  margin="normal"
                  placeholder="e.g., Art Masters Tournament"
                  sx={{ mb: 2 }}
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
                  disabled={!createForm.name}
                  startIcon={<AddIcon />}
                  sx={{
                    background: "linear-gradient(45deg, #6366f1, #818cf8)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #4f46e5, #6366f1)",
                    },
                  }}
                >
                  Create Room
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats/Info */}
        <Grid item xs={12}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 3,
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Typography variant="body2">
              <strong>Tip:</strong> Share your room code with friends to play
              together! Rooms automatically close when empty.
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
        onClick={() => {
          setJoinData({
            roomCode: "DEMO123",
            username: "Player" + Math.floor(Math.random() * 1000),
          });
          setTimeout(() => {
            const mockRoom: Room = {
              id: 1,
              code: "DEMO123",
              name: "Demo Room",
              max_players: 8,
              rounds: 3,
              draw_time: 80,
              is_public: true,
              status: "waiting",
            };
            onRoomJoin(mockRoom);
          }, 500);
        }}
      >
        <PlayIcon />
      </Fab>
    </Container>
  );
};

export default Lobby;
