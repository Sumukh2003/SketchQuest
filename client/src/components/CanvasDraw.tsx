import React, { useRef, useEffect, useState } from "react";
import { socket } from "../socket";
import { Box } from "@mui/material";

type Props = { room: string; isDrawer: boolean };

export default function CanvasDraw({ room, isDrawer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [drawing, setDrawing] = useState(false);
  const color = "#000";
  const size = 3;

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = 800;
    canvas.height = 500;

    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;

    ctxRef.current = ctx;

    socket.on("drawing_data", (d: any) => {
      const c = canvasRef.current!;
      const ctx = ctxRef.current!;
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.size;
      ctx.beginPath();
      ctx.moveTo(d.x0 * c.width, d.y0 * c.height);
      ctx.lineTo(d.x1 * c.width, d.y1 * c.height);
      ctx.stroke();
    });

    return () => {
      socket.off("drawing_data");
    };
  }, []);

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawer) return;
    setDrawing(true);
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !isDrawer) return;

    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;

    const { x, y } = getPos(e);

    const prev = (canvas as any)._lastPos || { x, y };
    (canvas as any)._lastPos = { x, y };

    ctx.beginPath();
    ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();

    socket.emit("drawing_data", {
      room,
      data: {
        x0: prev.x,
        y0: prev.y,
        x1: x,
        y1: y,
        color,
        size,
      },
    });
  };

  const handleMouseLeave = () => {
    setDrawing(false);
  };

  return (
    <Box>
      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid #333",
          width: "100%",
          cursor: isDrawer ? "crosshair" : "not-allowed",
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </Box>
  );
}
