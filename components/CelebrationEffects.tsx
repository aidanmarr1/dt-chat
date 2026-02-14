"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  type: "confetti" | "fire" | "heart";
}

interface CelebrationEffectsProps {
  messages: Message[];
  reduceMotion: boolean;
}

const CONFETTI_COLORS = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
const FIRE_COLORS = ["#FF4500", "#FF6347", "#FF8C00", "#FFA500", "#FFD700", "#FFFF00"];

function detectCelebration(content: string): "confetti" | "fire" | "hearts" | null {
  if (!content) return null;
  if (content.includes("\u{1F389}") || content.includes("\u{1F38A}")) return "confetti";
  if (content.includes("\u{1F525}")) return "fire";
  const hearts = (content.match(/\u{2764}\uFE0F?|\u{1F496}|\u{1F497}|\u{1F495}|\u{1F49E}|\u{1F49D}|\u{1F49B}|\u{1F49A}|\u{1F499}|\u{1F49C}/gu) || []);
  if (hearts.length >= 3) return "hearts";
  return null;
}

export default function CelebrationEffects({ messages, reduceMotion }: CelebrationEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastMessageIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion) return;
    if (messages.length === 0) return;

    const latestMsg = messages[messages.length - 1];

    // Skip the very first load
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastMessageIdRef.current = latestMsg.id;
      return;
    }

    // Only trigger on genuinely new messages
    if (latestMsg.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = latestMsg.id;

    const effect = detectCelebration(latestMsg.content);
    if (!effect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = effect === "confetti" ? 80 : effect === "fire" ? 50 : 40;

    for (let i = 0; i < count; i++) {
      const p: Particle = {
        x: effect === "fire" ? canvas.width / 2 + (Math.random() - 0.5) * 200 : Math.random() * canvas.width,
        y: effect === "fire" ? canvas.height : effect === "hearts" ? canvas.height + 20 : -10,
        vx: (Math.random() - 0.5) * (effect === "confetti" ? 6 : 3),
        vy: effect === "fire" ? -(Math.random() * 6 + 3) : effect === "hearts" ? -(Math.random() * 3 + 1.5) : Math.random() * 3 + 1,
        life: 0,
        maxLife: effect === "fire" ? 60 + Math.random() * 30 : 100 + Math.random() * 50,
        size: effect === "confetti" ? 6 + Math.random() * 4 : effect === "hearts" ? 12 + Math.random() * 8 : 4 + Math.random() * 3,
        color: effect === "confetti"
          ? CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
          : effect === "fire"
          ? FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
          : `hsl(${340 + Math.random() * 30}, 80%, ${55 + Math.random() * 20}%)`,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        type: effect === "confetti" ? "confetti" : effect === "fire" ? "fire" : "heart",
      };
      particlesRef.current.push(p);
    }

    if (!animFrameRef.current) {
      animate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, reduceMotion]);

  function animate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => {
      p.life++;
      if (p.life > p.maxLife) return false;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (p.type === "confetti") {
        p.vy += 0.1; // gravity
      } else if (p.type === "fire") {
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy *= 0.98;
      } else {
        p.vy *= 0.99;
        p.vx += Math.sin(p.life * 0.05) * 0.1;
      }

      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = alpha;

      if (p.type === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.type === "fire") {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2764\uFE0F", 0, 0);
        ctx.restore();
      }

      return true;
    });

    ctx.globalAlpha = 1;

    if (particlesRef.current.length > 0) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      animFrameRef.current = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
