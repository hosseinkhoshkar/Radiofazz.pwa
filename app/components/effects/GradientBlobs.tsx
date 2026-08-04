"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useFinePointer } from "@/lib/useFinePointer";

const BLOBS = [
  {
    factor: 26,
    className:
      "absolute -top-[12%] -left-[8%] h-[45vh] w-[45vh] rounded-full bg-neon-cyan/20 blur-[100px]",
  },
  {
    factor: 40,
    className:
      "absolute top-[18%] -right-[12%] h-[50vh] w-[50vh] rounded-full bg-neon-purple/20 blur-[110px]",
  },
  {
    factor: 18,
    className:
      "absolute -bottom-[15%] left-[28%] h-[40vh] w-[40vh] rounded-full bg-neon-pink/10 blur-[100px]",
  },
];

export default function GradientBlobs() {
  const isFinePointer = useFinePointer();
  const prefersReducedMotion = useReducedMotion();
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const parallaxEnabled = isFinePointer && !prefersReducedMotion;

  useEffect(() => {
    if (!parallaxEnabled) return;

    let ticking = false;

    function applyParallax(clientX: number, clientY: number) {
      const x = clientX / window.innerWidth - 0.5;
      const y = clientY / window.innerHeight - 0.5;

      blobRefs.current.forEach((el, index) => {
        if (!el) return;
        const factor = BLOBS[index].factor;
        el.style.transform = `translate3d(${x * factor}px, ${y * factor}px, 0)`;
      });
    }

    function handlePointerMove(event: PointerEvent) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        applyParallax(event.clientX, event.clientY);
        ticking = false;
      });
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [parallaxEnabled]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {BLOBS.map((blob, index) => (
        <div
          key={index}
          ref={(el) => {
            blobRefs.current[index] = el;
          }}
          className={`${blob.className} will-change-transform ${
            parallaxEnabled ? "transition-transform duration-700 ease-out" : ""
          }`}
        />
      ))}
    </div>
  );
}
