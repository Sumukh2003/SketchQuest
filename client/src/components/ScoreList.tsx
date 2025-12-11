import React from "react";
import { Player } from "../types";
import { List, ListItem, ListItemText, Chip } from "@mui/material";

export default function ScoreList({ players }: { players: Player[] }) {
  return (
    <List dense>
      {players.map((p) => (
        <ListItem key={p.id}>
          <ListItemText
            primary={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p.name}
                {p.isDrawer && (
                  <Chip
                    label="Drawing"
                    color="primary"
                    size="small"
                    style={{ fontWeight: "bold" }}
                  />
                )}
              </div>
            }
            secondary={`Score: ${p.score}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
