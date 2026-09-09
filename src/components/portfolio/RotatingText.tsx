import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RotatingTextProps {
  constant: string;
  words: string[];
}

export default function RotatingText({ constant, words }: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      3000,
    );
    return () => window.clearInterval(t);
  }, [words.length]);

  return (
    <div className="pl-4 font-mono text-base text-muted-foreground sm:text-lg">
      <span>{constant}</span>
      <span className="ml-1 inline-flex min-w-[20ch] overflow-hidden align-baseline">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ y: "0.6em", opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-0.6em", opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-accent whitespace-nowrap"
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
