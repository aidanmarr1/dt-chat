"use client";

import { useEffect, useRef } from "react";
import { playCelebrationSound } from "@/lib/sounds";
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
  type: "confetti" | "fire" | "heart" | "sparkle";
}

interface CelebrationEffectsProps {
  messages: Message[];
  reduceMotion: boolean;
}

const CONFETTI_COLORS = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
const FIRE_COLORS = ["#FF4500", "#FF6347", "#FF8C00", "#FFA500", "#FFD700", "#FFFF00"];
const GOLDEN_CONFETTI_COLORS = ["#FFD700", "#FFA500", "#FFDF00", "#F0C420", "#DAA520"];
const MAX_PARTICLES = 200;
const COOLDOWN_MS = 3000;

function detectCelebration(content: string): "confetti" | "fire" | "hearts" | "sparkle" | "firework" | "golden" | null {
  if (!content) return null;
  if (content.includes("\u{1F389}") || content.includes("\u{1F38A}")) return "confetti";
  if (content.includes("\u{1F973}")) return "confetti"; // 🥳 party face → confetti variant
  if (content.includes("\u{1F525}")) return "fire";
  if (content.includes("\u{2728}")) return "sparkle"; // ✨ sparkle particles
  if (content.includes("\u{1F386}")) return "firework"; // 🎆 firework burst
  if (content.includes("\u{1F4AF}")) return "golden"; // 💯 golden confetti
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
  const lastTriggerRef = useRef(0);

  // Canvas resize handler
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (canvas && particlesRef.current.length > 0) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cancel on reduceMotion change
  useEffect(() => {
    if (reduceMotion) {
      particlesRef.current = [];
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [reduceMotion]);

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

    // Cooldown check
    const now = Date.now();
    if (now - lastTriggerRef.current < COOLDOWN_MS) return;
    lastTriggerRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Play celebration sound
    playCelebrationSound();

    let count: number;
    if (effect === "confetti") count = 80;
    else if (effect === "fire") count = 50;
    else if (effect === "sparkle") count = 40;
    else if (effect === "firework") count = 60;
    else if (effect === "golden") count = 70;
    else count = 40; // hearts

    // Particle cap: don't exceed MAX_PARTICLES
    const available = MAX_PARTICLES - particlesRef.current.length;
    count = Math.min(count, available);
    if (count <= 0) return;

    for (let i = 0; i < count; i++) {
      let p: Particle;

      if (effect === "firework") {
        // Firework: burst from center
        const angle = (Math.PI * 2 * i) / count;
        const speed = 3 + Math.random() * 4;
        p = {
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 70 + Math.random() * 30,
          size: 3 + Math.random() * 3,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          type: "confetti",
        };
      } else if (effect === "sparkle") {
        p = {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          life: 0,
          maxLife: 50 + Math.random() * 40,
          size: 3 + Math.random() * 4,
          color: `hsl(${45 + Math.random() * 30}, 100%, ${70 + Math.random() * 20}%)`,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          type: "sparkle",
        };
      } else if (effect === "golden") {
        p = {
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 3 + 1,
          life: 0,
          maxLife: 100 + Math.random() * 50,
          size: 6 + Math.random() * 4,
          color: GOLDEN_CONFETTI_COLORS[Math.floor(Math.random() * GOLDEN_CONFETTI_COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          type: "confetti",
        };
      } else {
        p = {
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
      }
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
      } else if (p.type === "sparkle") {
        p.vx *= 0.98;
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
      } else if (p.type === "sparkle") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        // Draw a 4-point star
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
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
