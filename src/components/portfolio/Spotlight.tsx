"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import type { ReactNode } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
  radius?: number;
}

export default function Spotlight({
  children,
  className,
  radius = 350,
}: SpotlightProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden bg-transparent",
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient
            ${radius}px circle at ${mouseX}px ${mouseY}px,
            hsla(193, 85%, 66%, 0.12),
            transparent 80%
          `,
        }}
      />
      {children}
    </div>
  );
}
