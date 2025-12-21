import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { Player } from "../types";
import {
  Box,
  Button,
  Stack,
  Paper,
  Typography,
  Dialog,
  Grid,
} from "@mui/material";
import CanvasDraw from "../components/CanvasDraw";
import Chat from "../components/Chat";
import ScoreList from "../components/ScoreList";

export default function Game({ room, name }: { room: string; name: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [chooseWords, setChooseWords] = useState<string[] | null>(null);

  const [showRoundPopup, setShowRoundPopup] = useState(false);
  const [popupText, setPopupText] = useState("");

  const [roundInfo, setRoundInfo] = useState<{
    round?: number;
    roundEndsAt?: number;
  } | null>(null);

  const [word, setWord] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<{
    players: Player[];
    winner: Player;
  } | null>(null);

  useEffect(() => {
    socket.emit(
      "join_game",
      { room, name },
      (res: { hostId: string | undefined }) => {
        setIsHost(res.hostId === socket.id);
      }
    );

    socket.on("choose_word", ({ options }) => setChooseWords(options));

    socket.on("players", (pls: Player[]) => {
      setPlayers(pls);
      const me = pls.find((p) => p.id === socket.id);
      setIsDrawer(!!me?.isDrawer);
    });

    socket.on("round_started", (data: any) => {
      setRoundInfo({
        round: data.round,
        roundEndsAt: data.roundEndsAt,
      });
      setWord(null);
      setIsDrawer(socket.id === data.drawerId);
    });

    socket.on("drawer_word", (data: any) => setWord(data.word));

    socket.on("round_end", ({ round }) => {
      let countdown = 3;
      setShowRoundPopup(true);
      setPopupText(
        `Round ${round} ended. Next round starts in ${countdown}...`
      );

      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          setPopupText(
            `Round ${round} ended. Next round starts in ${countdown}...`
          );
        } else {
          clearInterval(interval);
          setShowRoundPopup(false);
          socket.emit("start_next_round");
        }
      }, 1000);
    });

    socket.on("game_over", ({ players, winner }) => {
      setFinalResult({ players, winner });
      setShowRoundPopup(false);
    });

    return () => {
      socket.off();
    };
  }, [room, name]);

  const startRound = () => socket.emit("start_round", { room });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top, #eef2ff 0%, #e0e7ff 40%, #c7d2fe 100%)",
      }}
    >
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {/* ROOM CODE */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 0.5,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.2)",
            fontFamily: "monospace",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              opacity: 0.8,
              fontWeight: 600,
            }}
          >
            ROOM -
          </Typography>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {room}
          </Typography>
        </Box>

        {/* START ROUND BUTTON */}
        {isHost && !roundInfo?.round && (
          <Button
            variant="contained"
            onClick={startRound}
            sx={{
              bgcolor: "white",
              color: "#4f46e5",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: 2,
              "&:hover": { bgcolor: "#eef2ff" },
            }}
          >
            Start Round
          </Button>
        )}
      </Paper>

      {/* MAIN GAME AREA */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          {/* CANVAS */}
          <Grid item xs={12} md={8} sx={{ height: "100%" }}>
            <Paper
              elevation={6}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <CanvasDraw room={room} isDrawer={isDrawer} />
              </Box>

              <Box
                sx={{
                  px: 2,
                  py: 1,
                  background: "#f8fafc",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                {isDrawer && word ? (
                  <Typography fontWeight={700} color="#4f46e5">
                    Word: {word}
                  </Typography>
                ) : (
                  <Typography color="text.secondary">
                    Guess the word…
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* SIDEBAR */}
          <Grid item xs={12} md={4} sx={{ height: "100%" }}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              {/* PLAYERS */}
              <Paper
                elevation={4}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f1f5ff 100%)",
                }}
              >
                <Typography fontWeight={800} gutterBottom color="#4f46e5">
                  Players
                </Typography>
                <ScoreList players={players} drawChip />
              </Paper>

              {/* CHAT */}
              <Paper
                elevation={4}
                sx={{
                  p: 2,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  background: "#ffffff",
                }}
              >
                <Typography fontWeight={800} gutterBottom color="#4f46e5">
                  Chat
                </Typography>
                <Chat room={room} />
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* WORD CHOICE */}
      <Dialog open={!!chooseWords}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Choose a word
          </Typography>

          <Stack direction="row" spacing={2}>
            {chooseWords?.map((w) => (
              <Button
                key={w}
                variant="contained"
                sx={{
                  bgcolor: "#4f46e5",
                  fontWeight: 700,
                }}
                onClick={() => {
                  socket.emit("word_chosen", { room, word: w });
                  setChooseWords(null);
                }}
              >
                {w}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Dialog>

      {/* ROUND POPUP */}
      <Dialog open={showRoundPopup}>
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            {popupText}
          </Typography>
        </Paper>
      </Dialog>

      {/* GAME OVER */}
      <Dialog open={!!finalResult}>
        <Paper sx={{ p: 4, minWidth: 340, borderRadius: 3 }}>
          <Typography variant="h4" align="center" gutterBottom>
            🏁 Game Over
          </Typography>

          <Typography variant="h6" align="center" gutterBottom>
            Winner: {finalResult?.winner.name} 🏆
          </Typography>

          <ScoreList players={finalResult?.players || []} drawChip={false} />

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: "#4f46e5",
              fontWeight: 700,
            }}
            onClick={() => window.location.reload()}
          >
            Exit
          </Button>
        </Paper>
      </Dialog>
    </Box>
  );
}
