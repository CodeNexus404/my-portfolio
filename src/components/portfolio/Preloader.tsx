import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * Rockstar Games-style preloader.
 * Black screen → dramatic SS monogram glow-in → repeated shine sweeps across
 * the logo (like the R★ loader) → loading bar → curtain reveal.
 */
export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    let frame: number;
    let start = performance.now();
    const duration = 2400; // 2.4s loading bar fill

    function tick(now: number) {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      // Ease out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);

      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase("hold");
        setTimeout(() => setPhase("exit"), 600);
        setTimeout(onComplete, 1200);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background dark:bg-[#050a14] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.45, 0, 0.15, 1] }}
      style={{ pointerEvents: phase === "exit" ? "none" : "auto" }}
    >
      {/* Radial glow behind the logo — starburst feel */}
      <motion.div
        className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsla(193,85%,66%,0.15) 0%, hsla(193,85%,66%,0.05) 40%, transparent 70%)",
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Secondary pulsing ring */}
      <motion.div
        className="absolute w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full border border-cyan-500/10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: [0.5, 1.2, 1],
          opacity: [0, 0.4, 0.1],
        }}
        transition={{ duration: 2, ease: "easeOut", times: [0, 0.6, 1] }}
      />

      {/* The SS monogram */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.6, opacity: 0, filter: "blur(12px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        {/* Outer ring */}
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border border-cyan-500/30 flex items-center justify-center relative overflow-hidden">
          {/* Inner glow ring */}
          <div
            className="absolute inset-1 rounded-full"
            style={{
              background:
                "radial-gradient(circle, hsla(193,85%,66%,0.08) 0%, transparent 70%)",
            }}
          />
          {/* SS text */}
          <span
            className="text-5xl md:text-6xl font-bold tracking-wider"
            style={{
              fontFamily: "Instrument Serif, Georgia, serif",
              color: "hsl(193, 85%, 72%)",
              textShadow:
                "0 0 40px hsla(193,85%,66%,0.4), 0 0 80px hsla(193,85%,66%,0.15)",
            }}
          >
            SS
          </span>

          {/* Rockstar-style shine sweep — a bright diagonal bar that wipes
              across the monogram repeatedly while the loader runs */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            animate={{ x: ["-160%", "160%"] }}
            transition={{
              duration: 1.6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.9,
              delay: 0.4,
            }}
          >
            <div
              className="absolute inset-y-0 w-1/2"
              style={{
                transform: "skewX(-18deg)",
                background:
                  "linear-gradient(90deg, transparent 0%, hsla(193,85%,90%,0.05) 30%, hsla(193,85%,95%,0.35) 50%, hsla(193,85%,90%,0.05) 70%, transparent 100%)",
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="relative z-10 mt-8 text-[11px] md:text-xs tracking-[0.35em] uppercase"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "hsl(215, 15%, 50%)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        Initializing portfolio
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="relative z-10 mt-5 w-48 md:w-56 h-[2px] overflow-hidden rounded-full"
        style={{ background: "hsla(215, 15%, 20%, 0.5)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, hsl(193,85%,56%), hsl(193,85%,72%))",
            boxShadow: "0 0 12px hsla(193,85%,66%,0.5)",
          }}
        />
      </motion.div>

      {/* Percentage */}
      <motion.span
        className="relative z-10 mt-3 text-[10px] tabular-nums"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "hsl(193, 85%, 56%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        {Math.round(progress * 100)}%
      </motion.span>
    </motion.div>
  );
}
