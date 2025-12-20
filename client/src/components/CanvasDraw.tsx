import React, { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BrushIcon from "@mui/icons-material/Brush";
import UndoIcon from "@mui/icons-material/Undo";
import ClearIcon from "@mui/icons-material/Clear";
import EraserIcon from "@mui/icons-material/AutoFixNormal";
type Props = { room: string; isDrawer: boolean };

type Stroke = {
  color: string;
  size: number;
  eraser?: boolean;
  points: { x: number; y: number }[];
};

export default function CanvasBoard({ room, isDrawer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);
  const [eraser, setEraser] = useState(false);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = 800;
    canvas.height = 500;

    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    // define handler
    const handleDrawing = (stroke: Stroke) => {
      drawStroke(ctx, stroke);
      setStrokes((prev) => [...prev, stroke]);
    };

    // attach listener
    socket.on("drawing_data", handleDrawing);

    // cleanup function
    return () => {
      socket.off("drawing_data", handleDrawing);
    };
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startStroke = (e: any) => {
    if (!isDrawer) return;
    setDrawing(true);
    const pos = getPos(e);
    currentStroke.current = {
      color,
      size,
      eraser,
      points: [pos],
    };
  };

  const moveStroke = (e: any) => {
    if (!drawing || !isDrawer || !currentStroke.current) return;
    const pos = getPos(e);
    currentStroke.current.points.push(pos);

    drawStroke(ctxRef.current!, {
      ...currentStroke.current,
      points: [currentStroke.current.points.slice(-2)[0], pos],
    });

    socket.emit("drawing_data", {
      ...currentStroke.current,
      points: [currentStroke.current.points.slice(-2)[0], pos],
    });
  };

  const endStroke = () => {
    if (!currentStroke.current) return;
    setStrokes((prev) => [...prev, currentStroke.current!]);
    currentStroke.current = null;
    setDrawing(false);
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.eraser) {
      ctx.globalCompositeOperation = "destination-out"; // this actually erases
    } else {
      ctx.globalCompositeOperation = "source-over"; // normal drawing
      ctx.strokeStyle = stroke.color;
    }

    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      ctx.moveTo(p0.x * ctx.canvas.width, p0.y * ctx.canvas.height);
      ctx.lineTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
    }
    ctx.stroke();
  };

  const undo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawAll(newStrokes);
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    setStrokes([]);
    socket.emit("drawing_data", {
      color: "#fff",
      size: ctx.lineWidth,
      points: [{ x: 0, y: 0 }],
      eraser: true,
    });
  };

  const redrawAll = (strokesToDraw: Stroke[]) => {
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    strokesToDraw.forEach((s) => drawStroke(ctx, s));
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, margin: "0 auto" }}>
      {/* Toolbar Section */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          backgroundColor: "#f8f9fa",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          rowGap={1}
        >
          {/* Color Picker */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Color:
            </Typography>
            <Box
              sx={{
                position: "relative",
                width: 40,
                height: 40,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #dee2e6",
                cursor: "pointer",
              }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0,
                }}
              />
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: color,
                }}
              />
            </Box>
          </Box>

          {/* Brush Size */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Size:
            </Typography>
            <TextField
              type="number"
              size="small"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              inputProps={{ min: 1, max: 50 }}
              sx={{
                width: 80,
                "& .MuiInputBase-root": {
                  backgroundColor: "white",
                  borderRadius: 1,
                },
              }}
            />
          </Box>

          {/* Tools */}
          <Box sx={{ display: "flex", gap: 1, ml: 1 }}>
            <Button
              variant={eraser ? "contained" : "outlined"}
              onClick={() => setEraser(!eraser)}
              startIcon={eraser ? <EraserIcon /> : <BrushIcon />}
              color={eraser ? "error" : "primary"}
              sx={{
                borderRadius: 2,
                minWidth: 120,
              }}
            >
              {eraser ? "Eraser" : "Brush"}
            </Button>

            <Button
              variant="outlined"
              onClick={undo}
              startIcon={<UndoIcon />}
              sx={{ borderRadius: 2 }}
            >
              Undo
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={clearCanvas}
              startIcon={<ClearIcon />}
              sx={{ borderRadius: 2 }}
            >
              Clear
            </Button>
          </Box>

          {/* Status Indicator */}
          <Chip
            label={isDrawer ? "Ready to draw" : "Drawing disabled"}
            color={isDrawer ? "success" : "default"}
            size="small"
            sx={{ ml: "auto" }}
          />
        </Stack>
      </Paper>

      {/* Canvas Section */}
      <Paper
        elevation={1}
        sx={{
          p: 1,
          borderRadius: 2,
          backgroundColor: "white",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            width: "100%",
            height: "500px",
            backgroundColor: "white",
            cursor: isDrawer ? "crosshair" : "not-allowed",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
          onMouseDown={startStroke}
          onMouseUp={endStroke}
          onMouseMove={moveStroke}
          onMouseLeave={endStroke}
          onTouchStart={startStroke}
          onTouchMove={moveStroke}
          onTouchEnd={endStroke}
        />
      </Paper>

      {/* Instructions */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Click and drag to draw •{" "}
          {eraser ? "Eraser mode active" : "Brush mode active"}
        </Typography>
      </Box>
    </Box>
  );
}
