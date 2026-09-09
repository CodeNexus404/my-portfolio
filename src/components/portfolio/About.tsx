import { AnimatePresence, motion, useInView } from "framer-motion";
import { GraduationCap, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { codeQuotes, profile } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import SectionHeader from "./SectionHeader";
import Spotlight from "./Spotlight";
import TextReveal, { WordReveal } from "./TextReveal";
import DecryptText from "./DecryptText";
import type { ReactNode } from "react";

function QuoteEngine() {
  const [index, setIndex] = useState(0);
  const total = codeQuotes.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => window.clearInterval(t);
  }, [total]);

  const shuffle = () => setIndex((i) => { let next = Math.floor(Math.random() * total); if (next === i) next = (next + 1) % total; return next; });
  const quote = codeQuotes[index] ?? "";

  return (
    <div className="relative flex h-full flex-col justify-between">
      <div className="relative flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{"// thoughts.log"}</p>
        <button type="button" onClick={shuffle} aria-label="Show another quote" className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all duration-200 hover:border-accent/40 hover:bg-accent/10 hover:text-accent">
          <RefreshCw className="size-3 transition-transform duration-300 group-hover:rotate-180" />
          next
        </button>
      </div>
      <div className="relative mt-6 min-h-[7.5rem] sm:min-h-[8.5rem]">
        <AnimatePresence mode="wait">
          <motion.p key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="font-['SF_Pro_Display','SF_Pro_Text',-apple-system,system-ui,sans-serif] text-2xl font-bold italic leading-snug tracking-tight text-foreground sm:text-[1.7rem]">
            &ldquo;{quote}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-5 flex items-center justify-end">
        <span className="flex gap-1.5" aria-hidden>
          {codeQuotes.map((_, i) => (
            <span key={i} className={cn("h-1 rounded-full transition-all duration-300", i === index ? "w-4 bg-accent" : "w-1.5 bg-foreground/20")} />
          ))}
        </span>
      </div>
    </div>
  );
}

export default function About() {
  const [btech, hsc, ssc] = profile.educationHistory;

  return (
    <section id="about" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <SectionHeader number="02" title="About" align="left" />

        {/* Statement card */}
        <Spotlight className="mb-6 rounded-[28px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[28px] border border-white/[0.06] bg-black/40 p-6 backdrop-blur-xl sm:p-8"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{"// statement"}</p>
            <div className="mt-6 overflow-hidden">
              <WordReveal
                text={profile.about[0]}
                className="font-display text-2xl leading-snug tracking-tight text-foreground sm:text-3xl"
                staggerDelay={0.04}
              />
            </div>
            <div className="mt-8 rounded-2xl border border-accent/15 bg-accent/5 p-5">
              <p className="font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">{profile.objective}</p>
            </div>
          </motion.div>
        </Spotlight>

        <div className="grid grid-cols-1 items-stretch gap-6 sm:gap-8 md:grid-cols-3">
          {/* Education card — left column, matches the right stack's height */}
          <Spotlight className="h-full rounded-[28px]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full flex-col rounded-[28px] border border-white/[0.06] bg-black/40 p-6 backdrop-blur-xl sm:p-8"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent"><GraduationCap className="size-5" /></span>
              <h3 className="mt-5 font-display text-xl font-semibold leading-snug tracking-tight text-foreground">{btech.credential}</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{btech.school}</p>
              <p className="mt-2 w-fit inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[11px] text-accent">{btech.score}</p>
              <div className="mt-6 space-y-4 border-t border-white/[0.06] pt-5">
                {[hsc, ssc].map((edu) => (
                  <div key={edu.school}>
                    <p className="font-mono text-xs font-medium leading-relaxed text-foreground/85">{edu.school}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{edu.credential} &middot; <span className="text-accent/90">{edu.score}</span></p>
                  </div>
                ))}
              </div>
            </motion.div>
          </Spotlight>

          {/* Right column — stats on top, thoughts.log directly beneath at the same width */}
          <div className="flex flex-col gap-6 sm:gap-8 md:col-span-2">
            {/* Stats card */}
            <Spotlight className="rounded-[28px]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[28px] border border-white/[0.06] bg-black/40 p-6 backdrop-blur-xl sm:p-8"
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {profile.stats.map((stat) => (
                    <div key={stat.label} className="text-left">
                      <p className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl"><DecryptText text={stat.value} speed={18} /></p>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Spotlight>

            {/* Quote card — sits directly below the stats card, same width */}
            <Spotlight className="rounded-[28px]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[28px] border border-white/[0.06] bg-black/40 p-6 backdrop-blur-xl sm:p-8"
              >
                <QuoteEngine />
              </motion.div>
            </Spotlight>
          </div>
        </div>
      </div>
    </section>
  );
}