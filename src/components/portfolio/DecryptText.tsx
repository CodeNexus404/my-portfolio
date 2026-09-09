"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface DecryptTextProps {
  text: string;
  className?: string;
  /** ms each character takes to resolve (staggered from left→right). */
  speed?: number;
  /** delay before the effect starts, in ms. */
  delay?: number;
  /** characters used for the scramble noise. */
  charset?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*<>/\\=+";

/**
 * "Encrypted text" reveal — characters start as random glyphs and resolve
 * left-to-right into the real string when scrolled into view. Mirrors the
 * terminal/cyber aesthetic of the portfolio.
 */
export default function DecryptText({
  text,
  className,
  speed = 28,
  delay = 0,
  charset = GLYPHS,
  as = "span",
}: DecryptTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const chars = [...text];
    const resolved = new Array(chars.length).fill(false);
    let frame = 0;
    let raf = 0;
    let timer = window.setTimeout(start, delay);

    function start() {
      raf = requestAnimationFrame(tick);
    }

    function tick() {
      frame++;
      const next = chars.map((ch, i) => {
        if (ch === " ") return " ";
        // Each character resolves once it has been scrambled for `speed` frames
        // proportional to its position (left resolves first).
        const resolveAt = Math.floor((i / chars.length) * 12) + 6;
        if (frame >= resolveAt) {
          resolved[i] = true;
          return ch;
        }
        return charset[Math.floor(Math.random() * charset.length)];
      });
      setDisplay(next.join(""));
      if (resolved.every(Boolean)) return;
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [inView, text, speed, delay, charset]);

  const Tag = motion[as] as typeof motion.span;

  return (
    <Tag ref={ref as never} className={className}>
      {display}
    </Tag>
  );
}
