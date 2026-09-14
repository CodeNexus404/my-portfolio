"use client";

import { useRef } from "react";
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
  // Throttle mousemove to one update per animation frame. On the contact form the
  // cursor sits over the wrapper continuously, so an unthrottled handler repaints
  // the radial-gradient every pointer event — which, layered with the glass
  // buttons' backdrop-filter, caused visible flicker. rAF-coalescing keeps the
  // spotlight smooth and GPU-composited at 120Hz without main-thread thrash.
  const frame = useRef(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    });
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
        // will-change promotes the gradient to its own compositor layer so it
        // animates on the GPU instead of repainting the whole glass card.
        style={{ willChange: "background" }}
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: useMotionTemplate`
              radial-gradient
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              hsla(193, 85%, 66%, 0.12),
              transparent 80%
            `,
          }}
        />
      </motion.div>
      {children}
    </div>
  );
}
