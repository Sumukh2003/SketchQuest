import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { Paper, TextField, Button, Stack, Typography } from "@mui/material";

export default function Chat({ room }: { room: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("correct_guess", (msg) => {
      setMessages((prev) => [
        ...prev,
        { system: true, text: `${msg.name} guessed the word!` },
      ]);
    });

    return () => {
      socket.off("chat_message");
      socket.off("correct_guess");
    };
  }, []);

  const send = () => {
    if (!input.trim()) return;

    socket.emit("guess", { room, text: input }, (res: any) => {
      // do NOT add own msg here (server already broadcasts)
    });

    setInput("");
  };

  return (
    <Paper style={{ padding: 8 }}>
      <Typography variant="subtitle1">Chat</Typography>

      <div
        style={{
          height: 200,
          overflowY: "scroll",
          border: "1px solid #444",
          padding: 6,
          marginBottom: 8,
        }}
      >
        {messages.map((m, i) =>
          m.system ? (
            <div key={i} style={{ color: "green" }}>
              <i>{m.text}</i>
            </div>
          ) : (
            <div key={i}>
              <b>{m.name}</b>: {m.text}
            </div>
          )
        )}
      </div>

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button variant="contained" onClick={send}>
          Send
        </Button>
      </Stack>
    </Paper>
  );
}
