import React from "react";
import { Player } from "../types";
import {
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { socket } from "../socket";

const medalColors = ["#f1c40f", "#bdc3c7", "#cd7f32"];

export default function ScoreList({
  players,
  drawChip,
}: {
  players: Player[];
  drawChip: boolean;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (players.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "#999", textAlign: "center", mt: 2 }}>
        No players yet
      </Typography>
    );
  }

  return (
    <List dense>
      {sorted.map((p, i) => (
        <ListItem
          key={p.id}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            bgcolor: p.id === socket.id ? "rgba(211, 84, 0, 0.06)" : "transparent",
          }}
        >
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    color: i < 3 ? medalColors[i] : "#999",
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </Box>
                <Typography style={{ fontSize: 22 }}>{p.avatar}</Typography>
                <Typography sx={{ fontWeight: p.id === socket.id ? 700 : 400 }}>
                  {p.name}
                  {p.id === socket.id ? " (you)" : ""}
                </Typography>
                {p.isDrawer && drawChip && (
                  <Chip
                    label="Drawing"
                    color="primary"
                    size="small"
                    style={{ fontWeight: "bold", marginLeft: 4 }}
                  />
                )}
                {p.hasGuessed && !p.isDrawer && drawChip && (
                  <Chip
                    label="Guessed"
                    size="small"
                    sx={{
                      fontWeight: "bold",
                      marginLeft: 4,
                      bgcolor: "rgba(39, 174, 96, 0.15)",
                      color: "#27ae60",
                    }}
                  />
                )}
              </Stack>
            }
            secondary={`Score: ${p.score}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
