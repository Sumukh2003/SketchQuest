import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { Player } from "../types";
import { Box, Button, Stack, Paper, Typography, Dialog } from "@mui/material";
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

    socket.on("game_over", (data: any) => {
      setPopup({
        open: true,
        message: `Game Over! Winner: ${data.winner}`,
      });
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
    <Stack spacing={2}>
      <Paper style={{ padding: 12 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Room: {room}</Typography>
          <div>
            {isHost && !roundInfo?.round && (
              <Button variant="contained" onClick={startRound}>
                Start Round
              </Button>
            )}
          </div>
        </Stack>
      </Paper>

      {chooseWords && (
        <div>
          <h3>Choose a word</h3>
          {chooseWords.map((w) => (
            <button
              key={w}
              onClick={() => {
                socket.emit("word_chosen", { room, word: w });
                setChooseWords(null);
              }}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      <Stack direction="row" spacing={2}>
        <Box flex={1}>
          <Paper style={{ padding: 8 }}>
            <CanvasDraw room={room} isDrawer={isDrawer} />
          </Paper>
        </Box>

        <Box width={320}>
          <Paper style={{ padding: 8, marginBottom: 8 }}>
            <Typography variant="subtitle1">Players</Typography>
            <ScoreList players={players} />
            <Typography variant="caption">
              You are: {name} {isDrawer ? "(drawer)" : ""}
            </Typography>
            {isDrawer && word && (
              <Typography variant="h6">Word: {word}</Typography>
            )}
          </Paper>
          <Chat room={room} />
        </Box>
      </Stack>
      <Dialog open={showRoundPopup}>
        <Paper style={{ padding: 30, textAlign: "center" }}>
          <Typography variant="h5">{popupText}</Typography>
        </Paper>
      </Dialog>
    </Stack>
  );
}
