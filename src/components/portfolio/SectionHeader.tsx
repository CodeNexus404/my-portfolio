"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import DecryptText from "./DecryptText";

interface SectionHeaderProps {
  number: string;
  title: string;
  align?: "left" | "right";
}

export default function SectionHeader({
  number,
  title,
  align = "left",
}: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const isRight = align === "right";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-16"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-15 select-none font-heading",
          "text-[120px] font-black leading-none italic text-primary/20 drop-shadow-sm",
          "sm:text-[160px] md:text-[200px]",
          isRight ? "right-0" : "left-0",
        )}
      >
        {number}
      </span>

      <div
        className={cn(
          "relative flex items-center gap-6",
          isRight && "flex-row-reverse",
        )}
      >
        <h2 className="font-heading text-lg uppercase tracking-[0.2em] text-primary/90 font-semibold sm:text-xl md:text-2xl">
          <DecryptText text={title} speed={22} />
        </h2>
        <span
          aria-hidden
          className={cn(
            "h-px flex-1",
            isRight
              ? "bg-gradient-to-l from-white/25 to-transparent"
              : "bg-gradient-to-r from-white/25 to-transparent",
          )}
        />
      </div>
    </motion.div>
  );
}
