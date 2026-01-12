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
  Chip,
  Avatar,
  Container,
  IconButton,
} from "@mui/material";
import CanvasDraw from "../components/CanvasDraw";
import Chat from "../components/Chat";
import ScoreList from "../components/ScoreList";
import {
  ExitToApp,
  PlayArrow,
  Timer,
  EmojiEvents,
  Refresh,
} from "@mui/icons-material";

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
        background: "linear-gradient(135deg, #faf9f6 0%, #f0ede9 100%)",
        color: "#333",
      }}
    >
      {/* HEADER */}
      <Paper
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "white",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          borderBottom: "1px solid #e8e6e1",
        }}
      >
        {/* LEFT: ROOM INFO */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "rgba(211, 84, 0, 0.1)",
              color: "#d35400",
              width: 40,
              height: 40,
            }}
          >
            <Typography fontWeight={700}>SQ</Typography>
          </Avatar>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#888", fontWeight: 600, display: "block" }}
            >
              Room Code
            </Typography>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: "#333",
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              {room}
            </Typography>
          </Box>
        </Box>

        {/* CENTER: ROUND INFO */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {roundInfo?.round && (
            <Chip
              icon={<Timer />}
              label={`Round ${roundInfo.round}`}
              sx={{
                bgcolor: "rgba(39, 174, 96, 0.1)",
                color: "#27ae60",
                fontWeight: 600,
                border: "1px solid rgba(39, 174, 96, 0.3)",
              }}
            />
          )}
          {isDrawer && (
            <Chip
              label="You're Drawing"
              sx={{
                bgcolor: "rgba(211, 84, 0, 0.1)",
                color: "#d35400",
                fontWeight: 600,
                border: "1px solid rgba(211, 84, 0, 0.3)",
              }}
            />
          )}
        </Box>

        {/* RIGHT: ACTIONS */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isHost && !roundInfo?.round && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={startRound}
              sx={{
                bgcolor: "#27ae60",
                fontWeight: 700,
                px: 3,
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#219653",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(39, 174, 96, 0.3)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Start Round
            </Button>
          )}
          <IconButton
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: "rgba(231, 76, 60, 0.1)",
              color: "#e74c3c",
              "&:hover": {
                bgcolor: "rgba(231, 76, 60, 0.2)",
              },
            }}
          >
            <ExitToApp />
          </IconButton>
        </Box>
      </Paper>

      {/* MAIN GAME AREA */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* CANVAS AREA - LEFT */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                height: "600px",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                background: "white",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e8e6e1",
              }}
            >
              {/* CANVAS */}
              <Box sx={{ flexGrow: 1, position: "relative" }}>
                <CanvasDraw room={room} isDrawer={isDrawer} />
              </Box>

              {/* WORD INFO BAR */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  background: "#f8f8f8",
                  borderTop: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  {isDrawer && word ? (
                    <>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#888",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Your word to draw:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#d35400",
                          mt: 0.5,
                        }}
                      >
                        {word}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#888",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Guess the word:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#666",
                          fontStyle: "italic",
                          mt: 0.5,
                        }}
                      >
                        Type your guess in the chat...
                      </Typography>
                    </>
                  )}
                </Box>

                {roundInfo?.roundEndsAt && (
                  <Chip
                    icon={<Timer />}
                    label={`${Math.max(
                      0,
                      Math.floor((roundInfo.roundEndsAt - Date.now()) / 1000)
                    )}s`}
                    sx={{
                      bgcolor: "rgba(230, 126, 34, 0.1)",
                      color: "#e67e22",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  />
                )}
              </Box>
            </Paper>
          </Grid>

          {/* SIDEBAR - RIGHT */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3} sx={{ height: "600px" }}>
              {/* PLAYERS SCOREBOARD */}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "white",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #e8e6e1",
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#333",
                    fontWeight: 700,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <EmojiEvents sx={{ color: "#d35400" }} />
                  Players & Scores
                </Typography>
                <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                  <ScoreList players={players} drawChip />
                </Box>
              </Paper>

              {/* CHAT */}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "white",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #e8e6e1",
                  flex: 2,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#333",
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Chat
                </Typography>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <Chat room={room} />
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* WORD CHOICE DIALOG */}
      <Dialog
        open={!!chooseWords}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <Paper sx={{ p: 4, minWidth: 400 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(211, 84, 0, 0.1)",
                color: "#d35400",
                width: 60,
                height: 60,
                mx: "auto",
                mb: 2,
              }}
            >
              <Typography variant="h4">🎨</Typography>
            </Avatar>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Choose Your Word
            </Typography>
            <Typography variant="body1" color="#666" gutterBottom>
              Pick one word to draw for this round
            </Typography>
          </Box>

          <Stack spacing={2}>
            {chooseWords?.map((w) => (
              <Button
                key={w}
                fullWidth
                size="large"
                variant="contained"
                onClick={() => {
                  socket.emit("word_chosen", { room, word: w });
                  setChooseWords(null);
                }}
                sx={{
                  py: 2,
                  fontWeight: 700,
                  fontSize: 16,
                  background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                  borderRadius: 2,
                  "&:hover": {
                    background: "linear-gradient(135deg, #219653, #27ae60)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(39, 174, 96, 0.3)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {w}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Dialog>

      {/* ROUND POPUP DIALOG */}
      <Dialog
        open={showRoundPopup}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <Paper sx={{ p: 5, textAlign: "center", minWidth: 300 }}>
          <Avatar
            sx={{
              bgcolor: "rgba(230, 126, 34, 0.1)",
              color: "#e67e22",
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
            }}
          >
            <Refresh sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Round Complete!
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "#666", fontWeight: 600, mb: 1 }}
          >
            {popupText}
          </Typography>
          <Typography variant="body2" color="#888">
            Scores will be updated in the next round
          </Typography>
        </Paper>
      </Dialog>

      {/* GAME OVER DIALOG */}
      <Dialog
        open={!!finalResult}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <Paper sx={{ p: 4, minWidth: 400 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(241, 196, 15, 0.1)",
                color: "#f1c40f",
                width: 80,
                height: 80,
                mx: "auto",
                mb: 3,
                border: "3px solid #f1c40f",
              }}
            >
              <EmojiEvents sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              🏆 Game Over!
            </Typography>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Winner: {finalResult?.winner.name}
            </Typography>
            <Typography variant="body1" color="#666">
              Congratulations to our champion!
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: 700,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Final Scores
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              <ScoreList
                players={finalResult?.players || []}
                drawChip={false}
              />
            </Box>
          </Box>

          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<ExitToApp />}
            onClick={() => window.location.reload()}
            sx={{
              py: 2,
              fontWeight: 700,
              fontSize: 16,
              background: "linear-gradient(135deg, #e67e22, #f39c12)",
              borderRadius: 2,
              "&:hover": {
                background: "linear-gradient(135deg, #d35400, #e67e22)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(230, 126, 34, 0.3)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Exit to Lobby
          </Button>
        </Paper>
      </Dialog>
    </Box>
  );
}
