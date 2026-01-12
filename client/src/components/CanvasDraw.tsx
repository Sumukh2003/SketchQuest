import React, { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  Slider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Brush as BrushIcon,
  Undo as UndoIcon,
  ClearAll as ClearIcon,
  AutoFixNormal as EraserIcon,
  Palette,
} from "@mui/icons-material";

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
  const [color, setColor] = useState("#d35400");
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

    const handleDrawing = (stroke: Stroke) => {
      drawStroke(ctx, stroke);
      setStrokes((prev) => [...prev, stroke]);
    };

    socket.on("drawing_data", handleDrawing);

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
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
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

  // Compact color palette
  const themeColors = [
    "#d35400", // Primary orange
    "#27ae60", // Green
    "#e67e22", // Orange
    "#e74c3c", // Red
    "#2c3e50", // Dark
    "#000000", // Black
    "#ffffff", // White
  ];

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "transparent",
      }}
    >
      {/* Compact Toolbar - Fixed to top of canvas */}
      <Paper
        sx={{
          p: 1.5,
          borderRadius: "8px 8px 0 0",
          background: "white",
          border: "1px solid #e8e6e1",
          borderBottom: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: "auto",
        }}
      >
        {/* Color Picker - Compact */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Palette fontSize="small" sx={{ color: "#888" }} />
          <Stack direction="row" spacing={0.5}>
            {themeColors.map((col) => (
              <Tooltip key={col} title={col === "#ffffff" ? "White" : col}>
                <Box
                  onClick={() => setColor(col)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: col,
                    cursor: "pointer",
                    border: `2px solid ${
                      color === col ? "#d35400" : "transparent"
                    }`,
                    boxShadow:
                      col === "#ffffff" ? "inset 0 0 0 1px #ddd" : "none",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                    transition: "transform 0.2s ease",
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
        </Box>

        {/* Brush Size - Compact */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: eraser ? "#999" : color,
              border: `1px solid ${eraser ? "#ccc" : color}`,
            }}
          />
          <Slider
            value={size}
            onChange={(e, newValue) => setSize(newValue as number)}
            min={1}
            max={30}
            sx={{
              width: 80,
              color: eraser ? "#999" : color,
              "& .MuiSlider-thumb": {
                width: 16,
                height: 16,
                bgcolor: eraser ? "#999" : color,
              },
            }}
          />
          <Chip
            label={`${size}`}
            size="small"
            sx={{
              bgcolor: "rgba(211, 84, 0, 0.1)",
              color: "#d35400",
              fontWeight: 600,
              minWidth: 30,
              height: 24,
            }}
          />
        </Box>

        {/* Tools - Compact */}
        <Stack direction="row" spacing={0.5} sx={{ ml: "auto" }}>
          <Tooltip title={eraser ? "Brush" : "Eraser"}>
            <IconButton
              onClick={() => setEraser(!eraser)}
              size="small"
              sx={{
                bgcolor: eraser
                  ? "rgba(231, 76, 60, 0.1)"
                  : "rgba(39, 174, 96, 0.1)",
                color: eraser ? "#e74c3c" : "#27ae60",
                width: 36,
                height: 36,
                borderRadius: 1,
              }}
            >
              {eraser ? (
                <EraserIcon fontSize="small" />
              ) : (
                <BrushIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Undo">
            <IconButton
              onClick={undo}
              disabled={strokes.length === 0}
              size="small"
              sx={{
                bgcolor: "rgba(230, 126, 34, 0.1)",
                color: "#e67e22",
                width: 36,
                height: 36,
                borderRadius: 1,
                "&:disabled": {
                  bgcolor: "rgba(0, 0, 0, 0.05)",
                  color: "#999",
                },
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear">
            <IconButton
              onClick={clearCanvas}
              size="small"
              sx={{
                bgcolor: "rgba(231, 76, 60, 0.1)",
                color: "#e74c3c",
                width: 36,
                height: 36,
                borderRadius: 1,
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Status - Compact */}
        <Chip
          label={isDrawer ? "Draw" : "View"}
          size="small"
          sx={{
            bgcolor: isDrawer
              ? "rgba(39, 174, 96, 0.1)"
              : "rgba(153, 153, 153, 0.1)",
            color: isDrawer ? "#27ae60" : "#999",
            fontWeight: 600,
            height: 28,
            border: `1px solid ${
              isDrawer ? "rgba(39, 174, 96, 0.3)" : "rgba(153, 153, 153, 0.3)"
            }`,
          }}
        />
      </Paper>

      {/* Canvas Area - Takes most space */}
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden",
          bgcolor: "white",
          border: "1px solid #e8e6e1",
          borderTop: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            backgroundColor: "white",
            cursor: isDrawer
              ? eraser
                ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="%23e74c3c" stroke-width="2"/></svg>') 12 12, auto`
                : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="${Math.min(
                    size / 2,
                    10
                  )}" fill="${color.replace(
                    "#",
                    "%23"
                  )}" stroke="%23fff" stroke-width="1"/></svg>') 12 12, crosshair`
              : "not-allowed",
          }}
          onMouseDown={startStroke}
          onMouseUp={endStroke}
          onMouseMove={moveStroke}
          onMouseLeave={endStroke}
          onTouchStart={startStroke}
          onTouchMove={moveStroke}
          onTouchEnd={endStroke}
        />

        {/* Mode Indicator - Minimal */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backdropFilter: "blur(4px)",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: eraser ? "#e74c3c" : color,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: eraser ? "#e74c3c" : "#666",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          >
            {eraser ? "Eraser" : "Brush"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#999", ml: 1 }}>
            Strokes: {strokes.length}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
