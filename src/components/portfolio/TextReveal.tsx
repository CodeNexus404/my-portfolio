"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

function splitText(text: string) {
  const parts: string[] = [];
  const buffer: string[] = [];
  for (const ch of text) {
    if (ch === " " || ch === " ") {
      if (buffer.length > 0) { parts.push(buffer.join("")); buffer.length = 0; }
      parts.push(" ");
    } else {
      buffer.push(ch);
    }
  }
  if (buffer.length > 0) parts.push(buffer.join(""));
  return parts;
}

export default function TextReveal({
  text,
  className,
  staggerDelay = 0.035,
  delay = 0,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const words = splitText(text);

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, filter: "blur(0px)" } : {}}
          transition={{
            opacity: { duration: 0.3, delay: delay + i * staggerDelay, ease: [0.16, 1, 0.3, 1] },
            filter: { duration: 0.4, delay: delay + i * staggerDelay, ease: [0.16, 1, 0.3, 1] },
          }}
          style={{ display: "inline-block", marginRight: word === " " ? "0.25em" : undefined }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function WordReveal({
  text,
  className,
  staggerDelay = 0.04,
}: {
  text: string;
  className?: string;
  staggerDelay?: number;
}) {
  const words = splitText(text);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(5px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{
            opacity: { duration: 0.3, delay: i * staggerDelay, ease: [0.16, 1, 0.3, 1] },
            filter: { duration: 0.4, delay: i * staggerDelay, ease: [0.16, 1, 0.3, 1] },
          }}
          style={{ display: "inline-block", marginRight: word === " " ? "0.3em" : undefined }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
