"use client";

import { useEffect, useRef } from "react";

const MATRIX_CHARS = "01BTCETHSOLADAAVAXDOGELINKBNBSANTOSPIMATRIXTEAM".split("");

export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let fontSize = window.innerWidth < 768 ? 12 : 14;
    let columns = 0;
    let drops: number[] = [];
    let animationFrame = 0;
    let lastFrame = 0;
    const frameGap = 50;

    const initialize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      fontSize = window.innerWidth < 768 ? 12 : 14;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
    };

    const draw = (time: number) => {
      if (time - lastFrame >= frameGap) {
        lastFrame = time;
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00FF00";
        ctx.font = `${fontSize}px monospace`;

        for (let index = 0; index < drops.length; index += 1) {
          const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const x = index * fontSize;
          const y = drops[index] * fontSize;
          ctx.fillText(char, x, y);

          if (drops[index] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[index] = 0;
          }
          drops[index] += 1;
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    const handleResize = () => {
      initialize();
    };

    initialize();
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div id="matrix-rain-container" aria-hidden="true">
      <canvas id="matrix-rain" ref={canvasRef} />
    </div>
  );
}
