import React, { useState } from "react";
import {
  Button,
  TextField,
  Stack,
  Paper,
  Typography,
  MenuItem,
} from "@mui/material";
import { socket } from "../socket";

export default function Lobby({
  onJoin,
}: {
  onJoin: (room: string, name: string) => void;
}) {
  const [name, setName] = useState("Player" + Math.floor(Math.random() * 1000));
  const [room, setRoom] = useState("");

  // Options for creating room
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [numRounds, setNumRounds] = useState(3);

  const create = () => {
    socket.emit(
      "create_game",
      {
        name: "Room",
        maxPlayers,
        numRounds,
      },
      (res: any) => {
        if (res?.room) onJoin(res.room, name);
      }
    );
  };

  const join = () => {
    if (!room) return;
    socket.emit("join_game", { room, name }, (res: any) => {
      if (res?.ok) onJoin(room, name);
      else alert("Failed to join");
    });
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Skribbl Clone — Minimal</Typography>

        {/* Name */}
        <TextField
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Create game section */}
        <Typography variant="h6">Create Game</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            select
            label="Max Players"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            style={{ width: 150 }}
          >
            {[2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Rounds"
            type="number"
            value={numRounds}
            onChange={(e) => setNumRounds(Number(e.target.value))}
            inputProps={{ min: 1, max: 10 }}
            style={{ width: 150 }}
          />

          <Button variant="contained" onClick={create}>
            Create
          </Button>
        </Stack>

        {/* Join game section */}
        <Typography variant="h6">Join Game</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            style={{ width: 200 }}
          />
          <Button variant="contained" onClick={join}>
            Join
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
