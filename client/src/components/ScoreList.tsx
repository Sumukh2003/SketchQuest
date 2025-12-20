import React from "react";
import { Player } from "../types";
import {
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

export default function ScoreList({
  players,
  drawChip,
}: {
  players: Player[];
  drawChip: boolean;
}) {
  return (
    <List dense>
      {players.map((p) => (
        <ListItem key={p.id}>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Avatar emoji */}
                <Typography style={{ fontSize: 22 }}>{p.avatar}</Typography>
                {/* Player name */}
                <Typography>{p.name}</Typography>
                {/* Drawing chip */}
                {p.isDrawer && drawChip && (
                  <Chip
                    label="Drawing"
                    color="primary"
                    size="small"
                    style={{ fontWeight: "bold", marginLeft: 4 }}
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
