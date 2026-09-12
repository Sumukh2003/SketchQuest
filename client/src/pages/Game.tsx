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
  Snackbar,
  Alert,
  Tooltip,
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
  ContentCopy,
  Check,
  VolumeUp,
  VolumeOff,
} from "@mui/icons-material";
import { sounds, isSoundEnabled, setSoundEnabled, unlockAudio } from "../sounds";

const MIN_PLAYERS_TO_START = 2;
const LOW_TIME_THRESHOLD = 10;

export default function Game({
  room,
  name,
  avatar,
}: {
  room: string;
  name: string;
  avatar: string;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [chooseWords, setChooseWords] = useState<string[] | null>(null);

  const [showRoundPopup, setShowRoundPopup] = useState(false);
  const [popupText, setPopupText] = useState("");
  const [revealedWord, setRevealedWord] = useState<string | null>(null);

  const [roundInfo, setRoundInfo] = useState<{
    round?: number;
    roundEndsAt?: number;
  } | null>(null);

  const [word, setWord] = useState<string | null>(null);
  const [wordBlanks, setWordBlanks] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<{
    players: Player[];
    winner: Player;
  } | null>(null);

  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Fallback audio unlock: any click/tap anywhere on the game screen counts
  // as a user gesture, so grab the first one in case the Lobby's click
  // didn't leave the AudioContext running (e.g. it was suspended again).
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Tick every second so the countdown chip actually counts down.
  useEffect(() => {
    if (!roundInfo?.roundEndsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [roundInfo?.roundEndsAt]);

  // Play a soft tick each second once the round is running low on time.
  useEffect(() => {
    if (!roundInfo?.roundEndsAt) return;
    const secsLeft = Math.ceil((roundInfo.roundEndsAt - now) / 1000);
    if (secsLeft > 0 && secsLeft <= LOW_TIME_THRESHOLD) sounds.tick();
  }, [now, roundInfo?.roundEndsAt]);

  useEffect(() => {
    socket.emit("join_game", { room, name, avatar }, (res: any) => {
      if (res?.error) {
        setFatalError(res.error);
        return;
      }
      setIsHost(res.hostId === socket.id);
      if (res.activeRound) {
        setRoundInfo({
          round: res.activeRound.round,
          roundEndsAt: res.activeRound.roundEndsAt,
        });
        setWordBlanks("_ ".repeat(res.activeRound.wordLength).trim());
      }
    });

    const onChooseWord = ({ options }: { options: string[] }) =>
      setChooseWords(options);

    const onPlayers = (pls: Player[]) => {
      setPlayers(pls);
      const me = pls.find((p) => p.id === socket.id);
      setIsDrawer(!!me?.isDrawer);
    };

    const onRoundStarted = (data: any) => {
      setRoundInfo({ round: data.round, roundEndsAt: data.roundEndsAt });
      setWord(null);
      setRevealedWord(null);
      setWordBlanks(
        data.drawerId === socket.id
          ? null
          : Array(data.wordLength).fill("_").join(" ")
      );
      setIsDrawer(socket.id === data.drawerId);
      setNow(Date.now());
    };

    const onDrawerWord = (data: { word: string }) => setWord(data.word);

    const onWordHint = (data: { blanks: string }) =>
      setWordBlanks(data.blanks.split("").join(" "));

    const onRoundEnd = ({ round, word: revealed }: { round: number; word: string }) => {
      setRevealedWord(revealed);
      let countdown = 3;
      setShowRoundPopup(true);
      setPopupText(`Round ${round} ended. Next round starts in ${countdown}...`);

      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          setPopupText(`Round ${round} ended. Next round starts in ${countdown}...`);
        } else {
          clearInterval(interval);
          setShowRoundPopup(false);
        }
      }, 1000);
    };

    const onGameOver = ({ players: pls, winner }: { players: Player[]; winner: Player }) => {
      setFinalResult({ players: pls, winner });
      setShowRoundPopup(false);
    };

    const onGameError = ({ error: err }: { error: string }) => setError(err);

    socket.on("choose_word", onChooseWord);
    socket.on("players", onPlayers);
    socket.on("round_started", onRoundStarted);
    socket.on("drawer_word", onDrawerWord);
    socket.on("word_hint", onWordHint);
    socket.on("round_end", onRoundEnd);
    socket.on("game_over", onGameOver);
    socket.on("game_error", onGameError);

    return () => {
      socket.off("choose_word", onChooseWord);
      socket.off("players", onPlayers);
      socket.off("round_started", onRoundStarted);
      socket.off("drawer_word", onDrawerWord);
      socket.off("word_hint", onWordHint);
      socket.off("round_end", onRoundEnd);
      socket.off("game_over", onGameOver);
      socket.off("game_error", onGameError);
    };
  }, [room, name, avatar]);

  const startRound = () => {
    socket.emit("start_round", { room }, (res: any) => {
      if (res?.error) setError(res.error);
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(room).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const secondsLeft = roundInfo?.roundEndsAt
    ? Math.max(0, Math.ceil((roundInfo.roundEndsAt - now) / 1000))
    : null;

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
          flexWrap: "wrap",
          gap: 2,
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
              <Tooltip title={copied ? "Copied!" : "Copy room code"}>
                <IconButton size="small" onClick={copyRoomCode}>
                  {copied ? (
                    <Check fontSize="small" sx={{ color: "#27ae60" }} />
                  ) : (
                    <ContentCopy fontSize="small" sx={{ color: "#888" }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
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
            <Tooltip
              title={
                players.length < MIN_PLAYERS_TO_START
                  ? `Need at least ${MIN_PLAYERS_TO_START} players to start`
                  : ""
              }
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={startRound}
                  disabled={players.length < MIN_PLAYERS_TO_START}
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
                    "&:disabled": { opacity: 0.5 },
                    transition: "all 0.3s ease",
                  }}
                >
                  Start Round
                </Button>
              </span>
            </Tooltip>
          )}
          <Tooltip title={soundOn ? "Mute sounds" : "Unmute sounds"}>
            <IconButton
              onClick={toggleSound}
              sx={{
                bgcolor: "rgba(0, 0, 0, 0.04)",
                color: "#666",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.08)" },
              }}
            >
              {soundOn ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Leave game">
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
          </Tooltip>
        </Box>
      </Paper>

      {players.length < MIN_PLAYERS_TO_START && !roundInfo?.round && (
        <Container maxWidth="xl" sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Waiting for more players to join — share the room code{" "}
            <b>{room}</b> with friends. Need at least {MIN_PLAYERS_TO_START} to
            start.
          </Alert>
        </Container>
      )}

      {/* MAIN GAME AREA */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* CANVAS AREA - LEFT */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                height: { xs: "60vh", sm: "70vh", md: "600px" },
                minHeight: { xs: 380, md: 600 },
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
                        sx={{ color: "#888", fontWeight: 600, display: "block" }}
                      >
                        Your word to draw:
                      </Typography>
                      <Typography
                        sx={{ fontSize: 20, fontWeight: 700, color: "#d35400", mt: 0.5 }}
                      >
                        {word}
                      </Typography>
                    </>
                  ) : wordBlanks ? (
                    <>
                      <Typography
                        variant="caption"
                        sx={{ color: "#888", fontWeight: 600, display: "block" }}
                      >
                        Guess the word ({wordBlanks.replace(/\s/g, "").length} letters):
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#333",
                          mt: 0.5,
                          fontFamily: "monospace",
                          letterSpacing: 2,
                        }}
                      >
                        {wordBlanks}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="caption"
                        sx={{ color: "#888", fontWeight: 600, display: "block" }}
                      >
                        {roundInfo?.round ? "Guess the word:" : "Waiting for the round to start"}
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
                        {roundInfo?.round
                          ? "Type your guess in the chat..."
                          : "The host will start the round shortly"}
                      </Typography>
                    </>
                  )}
                </Box>

                {secondsLeft !== null && (
                  <Chip
                    icon={<Timer />}
                    label={`${secondsLeft}s`}
                    sx={{
                      bgcolor:
                        secondsLeft <= 10
                          ? "rgba(231, 76, 60, 0.15)"
                          : "rgba(230, 126, 34, 0.1)",
                      color: secondsLeft <= 10 ? "#e74c3c" : "#e67e22",
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
            <Stack spacing={3} sx={{ height: { xs: 500, sm: 550, md: "600px" } }}>
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
                  Players ({players.length})
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
                <Typography variant="h6" sx={{ color: "#333", fontWeight: 700, mb: 2 }}>
                  Chat
                </Typography>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <Chat room={room} isDrawer={isDrawer} />
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* WORD CHOICE DIALOG */}
      <Dialog
        open={!!chooseWords}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", m: { xs: 2, sm: 3 } } }}
      >
        <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
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
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", m: { xs: 2, sm: 3 } } }}
      >
        <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
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
          {revealedWord && (
            <Typography variant="h5" sx={{ color: "#d35400", fontWeight: 700, mb: 1 }}>
              The word was: {revealedWord}
            </Typography>
          )}
          <Typography variant="h6" sx={{ color: "#666", fontWeight: 600, mb: 1 }}>
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
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", m: { xs: 2, sm: 3 } } }}
      >
        <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
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
              Winner: {finalResult?.winner?.name}
            </Typography>
            <Typography variant="body1" color="#666">
              Congratulations to our champion!
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{ color: "#333", fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              Final Scores
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
              <ScoreList players={finalResult?.players || []} drawChip={false} />
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

      {/* JOIN FAILURE (unrecoverable) */}
      <Dialog
        open={!!fatalError}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { m: { xs: 2, sm: 3 } } }}
      >
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Couldn't join room
          </Typography>
          <Typography color="#666" sx={{ mb: 3 }}>
            {fatalError}
          </Typography>
          <Button fullWidth variant="contained" onClick={() => window.location.reload()}>
            Back to Lobby
          </Button>
        </Paper>
      </Dialog>

      {/* TRANSIENT ERRORS */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
