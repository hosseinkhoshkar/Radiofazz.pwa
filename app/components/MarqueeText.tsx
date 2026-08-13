"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Horizontal marquee for a single line of text — only when it actually
// overflows its container at the current font size; short text renders as
// a plain static (truncated as a safety net, though it should never
// actually need to truncate once this measurement is correct) line, never
// scrolling. A separate always-mounted invisible measuring span (not the
// visible one, which swaps between the static/marquee markup) is what
// makes re-measurement correct even after the text has already started
// scrolling — measuring the visible node directly would go stale once it
// stops being an unbroken single-line element, so a later short text could
// never be detected as "no longer overflowing" and switch back.
// prefers-reduced-motion: renders the static branch outright instead of an
// animated-but-motionless marquee, matching how continuous motion is
// avoided elsewhere in this app (also backstopped at the CSS level in
// globals.css, same belt-and-suspenders pattern as .logo-shine there).
// Shared by the Home hero's track title and the mini-player's title/artist
// lines — same overflow-detection logic, same scroll behavior, just a
// different container width/font size via className each time.
interface MarqueeTextProps {
  text: string;
  className: string;
  // Lets the Home hero render the live track title as the view's h1 (its
  // actual primary content — see HomeHero.tsx) while every other caller
  // (mini-player title/artist, both non-heading chrome) keeps the plain div
  // default.
  as?: "div" | "h1";
}

export default function MarqueeText({ text, className, as: Tag = "div" }: MarqueeTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function measure() {
      if (containerRef.current && measureRef.current) {
        setIsOverflowing(measureRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  const shouldScroll = isOverflowing && !prefersReducedMotion;

  const content = (
    <>
      <span ref={measureRef} aria-hidden="true" className="invisible absolute whitespace-nowrap">
        {text}
      </span>

      {shouldScroll ? (
        <div className="flex w-max animate-marquee whitespace-nowrap">
          <span className="pe-16">{text}</span>
          <span aria-hidden="true" className="pe-16">
            {text}
          </span>
        </div>
      ) : (
        <span className="block truncate whitespace-nowrap">{text}</span>
      )}
    </>
  );

  const mergedClassName = `relative overflow-hidden ${className}`;

  return Tag === "h1" ? (
    <h1 ref={containerRef as React.RefObject<HTMLHeadingElement | null>} className={mergedClassName}>
      {content}
    </h1>
  ) : (
    <div ref={containerRef as React.RefObject<HTMLDivElement | null>} className={mergedClassName}>
      {content}
    </div>
  );
}
