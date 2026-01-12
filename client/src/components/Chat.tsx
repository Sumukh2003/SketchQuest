import React, { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import {
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { Send } from "@mui/icons-material";

type Message = {
  name?: string;
  text: string;
  system?: boolean;
};

export default function Chat({ room }: { room: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("chat_message", (msg: { name: string; text: string }) => {
      setMessages((prev) => [...prev, { name: msg.name, text: msg.text }]);
    });

    socket.on("correct_guess", (msg: { name: string }) => {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    socket.emit("guess", { room, text: input });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Paper
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        background: "white",
        border: "1px solid #e8e6e1",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #e8e6e1",
          bgcolor: "#fafafa",
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#333" }}>Chat</Typography>
        <Typography variant="caption" sx={{ color: "#888" }}>
          Guess the word in real-time
        </Typography>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {messages.map((m, i) => (
          <Box key={i}>
            {m.system ? (
              <Typography
                variant="caption"
                sx={{
                  color: "#27ae60",
                  fontWeight: 600,
                  display: "block",
                  textAlign: "center",
                  my: 1,
                }}
              >
                {m.text}
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#d35400", fontWeight: 600, minWidth: 60 }}
                >
                  {m.name}:
                </Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {m.text}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: "1px solid #e8e6e1" }}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="Type your guess..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fafafa",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e67e22",
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={send}
            disabled={!input.trim()}
            sx={{
              bgcolor: "#d35400",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "#a04000",
              },
              "&:disabled": {
                bgcolor: "#e8e6e1",
                color: "#999",
              },
            }}
          >
            <Send />
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
