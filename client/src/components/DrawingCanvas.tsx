import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Slider,
  ButtonGroup,
  Button,
  IconButton,
} from "@mui/material";
import {
  Brush,
  Palette,
  Undo,
  ClearAll,
  Circle,
  Square,
} from "@mui/icons-material";
import { Socket } from "socket.io-client";

interface DrawingCanvasProps {
  socket: Socket | null;
  roomCode: string;
  isDrawingEnabled: boolean;
  isDrawer: boolean;
  wordHint?: string | null;
}

interface Point {
  x: number;
  y: number;
}

interface DrawData {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  socket,
  roomCode,
  isDrawingEnabled,
  isDrawer,
  wordHint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [currentTool, setCurrentTool] = useState<"brush" | "circle" | "square">(
    "brush"
  );
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Colors palette
  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#A52A2A",
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Redraw from history
        redrawFromHistory(ctx);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Handle incoming drawings
  useEffect(() => {
    if (!socket) return;

    const handleDrawing = (data: DrawData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawLine(
        ctx,
        data.x,
        data.y,
        data.prevX,
        data.prevY,
        data.color,
        data.lineWidth
      );
    };

    const handleCanvasCleared = () => {
      clearCanvas();
    };

    socket.on("drawing", handleDrawing);
    socket.on("canvas_cleared", handleCanvasCleared);

    return () => {
      socket.off("drawing", handleDrawing);
      socket.off("canvas_cleared", handleCanvasCleared);
    };
  }, [socket]);

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    prevX: number,
    prevY: number,
    color: string,
    width: number
  ) => {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
  };

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    if (currentTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
    } else if (currentTool === "square") {
      const width = endX - startX;
      const height = endY - startY;
      ctx.rect(startX, startY, width, height);
    }

    ctx.stroke();
    ctx.closePath();
  };

  const redrawFromHistory = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawingHistory.forEach((imageData) => {
      ctx.putImageData(imageData, 0, 0);
    });
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory((prev) => [...prev, imageData]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory([]);

    if (socket && isDrawer) {
      socket.emit("clear_canvas", { roomCode });
    }
  };

  const undoLast = () => {
    if (drawingHistory.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = drawingHistory.slice(0, -1);
    setDrawingHistory(newHistory);

    // Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    newHistory.forEach((imageData) => {
      ctx.putImageData(imageData, 0, 0);
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingEnabled || !isDrawer) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setLastPoint(pos);

    if (currentTool === "brush") {
      saveToHistory();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingEnabled || !isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getMousePos(e);

    if (currentTool === "brush") {
      if (lastPoint) {
        drawLine(ctx, pos.x, pos.y, lastPoint.x, lastPoint.y, color, lineWidth);

        // Send drawing to other players
        if (socket) {
          socket.emit("draw", {
            roomCode,
            x: pos.x,
            y: pos.y,
            prevX: lastPoint.x,
            prevY: lastPoint.y,
            color,
            lineWidth,
          });
        }
      }
      setLastPoint(pos);
    } else if (
      (currentTool === "circle" || currentTool === "square") &&
      lastPoint
    ) {
      // For shapes, clear and redraw preview
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawFromHistory(ctx);
      drawShape(ctx, lastPoint.x, lastPoint.y, pos.x, pos.y);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingEnabled || !isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getMousePos(e);

    if ((currentTool === "circle" || currentTool === "square") && lastPoint) {
      // Finalize shape
      drawShape(ctx, lastPoint.x, lastPoint.y, pos.x, pos.y);
      saveToHistory();

      // For shapes, we'd need to broadcast the shape data
      // For simplicity, we'll skip real-time sync for shapes in MVP
    }

    setIsDrawing(false);
    setLastPoint(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Canvas Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Brush /> Drawing Board
          </Typography>
          {wordHint && (
            <Typography
              variant="body1"
              sx={{ fontFamily: "monospace", letterSpacing: 2 }}
            >
              Hint: {wordHint}
            </Typography>
          )}
        </Box>

        <Typography
          variant="body2"
          color={isDrawer ? "success.main" : "text.secondary"}
        >
          {isDrawer ? "🎨 You are drawing!" : "👀 You are guessing!"}
        </Typography>
      </Box>

      {/* Canvas Container */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          border: "2px solid",
          borderColor: isDrawingEnabled ? "primary.main" : "grey.300",
          cursor: isDrawingEnabled && isDrawer ? "crosshair" : "default",
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "white",
          }}
        />

        {!isDrawingEnabled && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 10,
            }}
          >
            <Typography variant="h5" color="text.secondary">
              {isDrawer ? "Waiting for your turn..." : "Waiting for drawer..."}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Drawing Controls */}
      {isDrawer && (
        <Paper
          elevation={2}
          sx={{
            mt: 2,
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Tool Selection */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              Tools:
            </Typography>
            <ButtonGroup size="small">
              <Button
                variant={currentTool === "brush" ? "contained" : "outlined"}
                onClick={() => setCurrentTool("brush")}
                startIcon={<Brush />}
              >
                Brush
              </Button>
              <Button
                variant={currentTool === "circle" ? "contained" : "outlined"}
                onClick={() => setCurrentTool("circle")}
                startIcon={<Circle />}
              >
                Circle
              </Button>
              <Button
                variant={currentTool === "square" ? "contained" : "outlined"}
                onClick={() => setCurrentTool("square")}
                startIcon={<Square />}
              >
                Square
              </Button>
            </ButtonGroup>
          </Box>

          {/* Color Palette */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              <Palette sx={{ verticalAlign: "middle", mr: 1 }} />
              Colors:
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {colors.map((col) => (
                <IconButton
                  key={col}
                  size="small"
                  onClick={() => setColor(col)}
                  sx={{
                    width: 30,
                    height: 30,
                    backgroundColor: col,
                    border: color === col ? "2px solid #000" : "1px solid #ccc",
                    "&:hover": {
                      backgroundColor: col,
                      opacity: 0.9,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Brush Size */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              Brush Size:
            </Typography>
            <Slider
              value={lineWidth}
              onChange={(_, value) => setLineWidth(value as number)}
              min={1}
              max={20}
              sx={{ width: 150 }}
            />
            <Typography variant="body2" sx={{ minWidth: 40 }}>
              {lineWidth}px
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Undo />}
              onClick={undoLast}
              disabled={drawingHistory.length === 0}
            >
              Undo
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<ClearAll />}
              onClick={clearCanvas}
            >
              Clear Canvas
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DrawingCanvas;
