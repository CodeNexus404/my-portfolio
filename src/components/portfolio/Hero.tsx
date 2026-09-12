import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/portfolio";
import { useSiteContent } from "@/hooks/use-site-content";
import Magnetic from "./Magnetic";
import RotatingText from "./RotatingText";
import InteractiveTerminal from "./InteractiveTerminal";
import TextReveal from "./TextReveal";

/** Ticking IST clock */
function LocalClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Clock3 className="size-3.5 text-accent" />
      {time} IST
    </span>
  );
}

/**
 * Hero — aarab.me structure with Apple display typography.
 * Headlines get the signature tight negative tracking; CTAs follow the
 * Apple pill grammar (one filled ghost pill + one text link).
 */
export default function Hero() {
  const { profile: liveProfile } = useSiteContent();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.75], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.75], [0, 40]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden"
    >
      <motion.div
        style={{ opacity, scale, y }}
        className="relative z-10 flex min-h-svh w-full flex-col items-center justify-center gap-7 px-6 py-24 text-center"
      >
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="card-static inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[12px] text-muted-foreground"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          {liveProfile.availability}
        </motion.div>

        {/* Location + Role */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[12px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-accent" />
            {profile.location}
          </span>
          <span aria-hidden className="text-primary/30">/</span>
          <span>{profile.role}</span>
          <span aria-hidden className="hidden text-primary/30 sm:inline">/</span>
          <span className="hidden sm:inline-flex"><LocalClock /></span>
        </motion.p>

        {/* Main name — Apple display-hero tracking on the serif identity.
            Clicking the name glides back to the top of the page. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative"
        >
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -z-10 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
            style={{
              background: "radial-gradient(circle, hsla(193, 85%, 66%, 0.15), transparent 70%)",
            }}
          />
          <a
            href="#top"
            className="inline-block cursor-pointer select-none"
            aria-label="Scroll to top"
          >
            <TextReveal
              text={profile.name}
              className="font-serif text-[clamp(3.25rem,11vw,8.5rem)] font-normal leading-[1.05] tracking-[-0.025em] text-foreground transition-colors duration-300 hover:text-accent"
              staggerDelay={0.04}
              delay={0.3}
            />
          </a>
        </motion.div>

        {/* CTAs — Apple button grammar: ghost pill + quiet text link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-5 pt-2"
        >
          <Magnetic strength={0.2}>
            <a
              href="#contact"
              className="liquid-glass-accent inline-flex items-center rounded-full px-6 py-2.5 text-[15px] active:scale-95"
            >
              Contact Me
            </a>
          </Magnetic>
          <Magnetic strength={0.2}>
            <a
              href={liveProfile.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[15px] active:scale-95"
            >
              View Resume
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Magnetic>
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl"
        >
          <InteractiveTerminal />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 right-5 z-20 hidden md:bottom-12 md:right-12 lg:block"
      >
        <RotatingText
          constant={liveProfile.hero.constant}
          words={liveProfile.hero.rotating}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 text-muted-foreground lg:flex"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <div className="relative h-10 w-px overflow-hidden bg-foreground/15">
          <span className="animate-scroll-cue absolute left-0 top-0 h-4 w-px bg-accent" />
        </div>
      </motion.div>
    </section>
  );
}