import React, { useState } from "react";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import { Container } from "@mui/material";

export default function App() {
  const [room, setRoom] = useState<string | null>(null);
  const [name, setName] = useState<string>("Player");

  return (
    <Container maxWidth="md" style={{ paddingTop: 20 }}>
      {!room ? (
        <Lobby
          onJoin={(r, n) => {
            setRoom(r);
            setName(n);
          }}
        />
      ) : (
        <Game room={room} name={name} />
      )}
    </Container>
  );
}
