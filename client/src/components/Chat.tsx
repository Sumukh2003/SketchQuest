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
import { sounds } from "../sounds";

const MESSAGE_MAX_LEN = 200;

type Message = {
  name?: string;
  text: string;
  system?: boolean;
  correct?: boolean;
  close?: boolean;
  kind?: "join" | "leave";
};

export default function Chat({
  room,
  isDrawer,
}: {
  room: string;
  isDrawer: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.kind === "join") sounds.join();
      if (msg.kind === "leave") sounds.leave();
    };

    const onCorrectGuess = (msg: { name?: string }) => {
      setMessages((prev) => [
        ...prev,
        { system: true, correct: true, text: `${msg.name} guessed the word!` },
      ]);
      sounds.correctGuess();
    };

    socket.on("chat_message", onChatMessage);
    socket.on("correct_guess", onCorrectGuess);

    return () => {
      socket.off("chat_message", onChatMessage);
      socket.off("correct_guess", onCorrectGuess);
    };
  }, []);

  useEffect(() => {
    setMessages([]);
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim().slice(0, MESSAGE_MAX_LEN);
    if (!text) return;
    socket.emit("guess", { room, text }, (res) => {
      if (res.correct) return; // correct_guess event already handles feedback
      sounds.wrongGuess();
      if (res.close) {
        setMessages((prev) => [
          ...prev,
          { system: true, close: true, text: "🔥 So close! Try again" },
        ]);
      }
    });
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
      <Box sx={{ p: 2, borderBottom: "1px solid #e8e6e1", bgcolor: "#fafafa" }}>
        <Typography sx={{ fontWeight: 700, color: "#333" }}>Chat</Typography>
        <Typography variant="caption" sx={{ color: "#888" }}>
          {isDrawer ? "You can't guess while drawing" : "Guess the word in real-time"}
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
        {messages.length === 0 && (
          <Typography variant="caption" sx={{ color: "#aaa", textAlign: "center", mt: 2 }}>
            No messages yet
          </Typography>
        )}
        {messages.map((m, i) => (
          <Box key={i}>
            {m.system ? (
              <Typography
                variant="caption"
                sx={{
                  color: m.correct ? "#27ae60" : m.close ? "#e67e22" : "#999",
                  fontWeight: 600,
                  display: "block",
                  textAlign: "center",
                  my: 1,
                  fontStyle: m.correct || m.close ? "normal" : "italic",
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
                <Typography variant="body2" sx={{ color: "#333", wordBreak: "break-word" }}>
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
            placeholder={isDrawer ? "Drawing… chat is disabled" : "Type your guess..."}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MESSAGE_MAX_LEN))}
            onKeyPress={handleKeyPress}
            disabled={isDrawer}
            inputProps={{ maxLength: MESSAGE_MAX_LEN }}
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
            disabled={!input.trim() || isDrawer}
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
