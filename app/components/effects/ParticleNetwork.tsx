"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useFinePointer } from "@/lib/useFinePointer";

const PARTICLE_COUNT = 70;
const LINK_DISTANCE = 130;
const CURSOR_RADIUS = 140;
const CURSOR_PUSH = 0.6;
const DEFAULT_COLOR = "148, 148, 194";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function hexToRgbTriplet(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

export default function ParticleNetwork() {
  const isFinePointer = useFinePointer();
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = isFinePointer && !prefersReducedMotion;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let color = DEFAULT_COLOR;
    let frame = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      }));
    }

    function readColor() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--muted")
        .trim();
      color = hexToRgbTriplet(raw) ?? DEFAULT_COLOR;
    }

    function handlePointerMove(event: PointerEvent) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }

    function handlePointerLeave() {
      mouseX = -9999;
      mouseY = -9999;
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < CURSOR_RADIUS) {
          const force = (1 - dist / CURSOR_RADIUS) * CURSOR_PUSH;
          const safeDist = dist || 1;
          p.x += (dx / safeDist) * force;
          p.y += (dy / safeDist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            ctx!.strokeStyle = `rgba(${color}, ${0.4 * (1 - dist / LINK_DISTANCE)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }

        ctx!.fillStyle = `rgba(${color}, 0.75)`;
        ctx!.beginPath();
        ctx!.arc(particles[i].x, particles[i].y, 2, 0, Math.PI * 2);
        ctx!.fill();
      }

      frame = requestAnimationFrame(step);
    }

    resize();
    seed();
    readColor();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
