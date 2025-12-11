import React, { useState } from "react";
import { Button, TextField, Stack, Paper, Typography } from "@mui/material";
import { socket } from "../socket";

export default function Lobby({
  onJoin,
}: {
  onJoin: (room: string, name: string) => void;
}) {
  const [name, setName] = useState("Player" + Math.floor(Math.random() * 1000));
  const [room, setRoom] = useState("");

  const create = () => {
    socket.emit("create_game", { name: "Room" }, (res: any) => {
      if (res?.room) onJoin(res.room, name);
    });
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
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={create}>
            Create Game
          </Button>
          <TextField
            label="Room ID"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <Button variant="contained" onClick={join}>
            Join
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
