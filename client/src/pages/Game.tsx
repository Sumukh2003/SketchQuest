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
  const [popup, setPopup] = useState<{
    open: boolean;
    message: string;
  } | null>(null);
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

    socket.on("choose_word", ({ options }) => {
      setChooseWords(options);
    });

    socket.on("players", (pls: Player[]) => {
      setPlayers(pls);
      const p = pls.find((x) => x.id === socket.id);
      setIsDrawer(!!p?.isDrawer);
    });

    socket.on("round_started", (data: any) => {
      setRoundInfo({
        round: data.round,
        roundEndsAt: data.roundEndsAt,
      });

      setWord(null);

      setIsDrawer(socket.id === data.drawerId);
    });

    socket.on("drawer_word", (data: any) => {
      setWord(data.word);
    });

    // socket.on("correct_guess", (data: any) => {
    //   alert(`${data.name} guessed the word "${data.word}"`);
    // });

    socket.on("round_end", ({ round, nextRound }) => {
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

    socket.on("round_start", ({ round }) => {
      setShowRoundPopup(false);
    });

    socket.on("next_round_starting", (data: any) => {
      setPopup({
        open: true,
        message: `Starting Round ${data.round} in 3 seconds...`,
      });
    });

    socket.on("game_over", ({ players, winner }) => {
      setFinalResult({ players, winner });
      setShowRoundPopup(false);
    });

    return () => {
      socket.off("players");
      socket.off("round_started");
      socket.off("drawer_word");
      socket.off("correct_guess");
    };
  }, [room, name]);

  const startRound = () => {
    socket.emit("start_round", { room }, (res: any) => {});
  };

  return (
    <Box
      sx={{
        padding: 2,
        width: "100%",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          padding: 2,
          marginBottom: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        elevation={3}
      >
        <Typography variant="h6">Room: {room}</Typography>
        {isHost && !roundInfo?.round && (
          <Button variant="contained" color="primary" onClick={startRound}>
            Start Round
          </Button>
        )}
      </Paper>

      {/* Word Selection for Drawer */}
      <Dialog open={!!chooseWords}>
        <Paper sx={{ padding: 4 }}>
          <Typography variant="h5" gutterBottom>
            Select a word to draw
          </Typography>
          <Stack spacing={2} direction="row">
            {chooseWords?.map((w) => (
              <Button
                key={w}
                variant="contained"
                color="secondary"
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

      {/* Main Game Area */}
      <Grid container spacing={2}>
        {/* Canvas */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              padding: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={3}
          >
            <CanvasDraw room={room} isDrawer={isDrawer} />
            {isDrawer && word && (
              <Typography
                sx={{ marginTop: 1, fontWeight: "bold" }}
                variant="h6"
              >
                Word: {word}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Player List */}
            <Paper sx={{ padding: 2 }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom>
                Players
              </Typography>
              <ScoreList players={players} drawChip={true} />
            </Paper>

            {/* Chat */}
            <Paper sx={{ padding: 2, height: 300 }} elevation={3}>
              <Chat room={room} />
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Round Countdown Popup */}
      <Dialog open={showRoundPopup}>
        <Paper sx={{ padding: 4, textAlign: "center" }}>
          <Typography variant="h5">{popupText}</Typography>
        </Paper>
      </Dialog>

      {/* Game Over Modal */}
      <Dialog open={!!finalResult}>
        <Paper sx={{ padding: 4, minWidth: 300 }}>
          <Typography variant="h4" gutterBottom align="center">
            🏁 Game Over
          </Typography>
          <Typography variant="h6" gutterBottom align="center">
            Winner: {finalResult?.winner.name} 🏆
          </Typography>
          <ScoreList players={finalResult?.players || []} drawChip={false} />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Exit
          </Button>
        </Paper>
      </Dialog>
    </Box>
  );
}
