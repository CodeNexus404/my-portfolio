"use client";
import { motion } from "framer-motion";

const items = [
  "Full-Stack Developer", "•", "AI Automation", "•",
  "React & Next.js", "•", "Python & LLMs", "•",
  "n8n Workflows", "•", "Open Source", "•",
  "Computer Vision", "•",
];

function MarqueeTrack() {
  const content = [...items, ...items];
  return (
    <div className="flex w-max items-center gap-6 pr-6">
      {content.map((item, i) => (
        <span
          key={i}
          className={
            item === "•"
              ? "whitespace-nowrap font-mono text-sm tracking-wide text-accent/70"
              : "whitespace-nowrap font-mono text-sm tracking-wide text-muted-foreground/75"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] py-4">
      <div className="flex">
        <div className="animate-marquee"><MarqueeTrack /></div>
        <div className="animate-marquee" aria-hidden><MarqueeTrack /></div>
      </div>
    </div>
  );
}
