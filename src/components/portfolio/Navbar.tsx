"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { Command, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/hooks/use-site-content";
import { useScopedTheme } from "@/theme/theme";
import { Moon, Sun } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

/* ─────────────────────────────────────────────────────────────────────────
 * EXPERIMENTAL — Liquid Glass navbar.
 * Look & feel inspired by Apple's Liquid Glass / the references shared:
 *   - real backdrop-filter blur + saturate (the heart of the frosted glass)
 *   - translucent fill that lifts slightly on scroll
 *   - hairline light border + inner top specular highlight (the "glass edge")
 *   - soft drop shadow so it floats above the content
 *   - a subtle pointer-tracking sheen sweep across the capsule
 * Functionality (hide-on-scroll, progress bar, links, mobile menu) is kept.
 * ──────────────────────────────────────────────────────────────────────── */

// Pointer-tracked sheen — a radial highlight that follows the cursor inside
// the capsule, reinforcing the wet-glass read.
function LiquidCapsule({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);

  // Scroll adaptation: as the page scrolls, the clear glass gains a touch more
  // frost/definition (--nav-intensity 0→1) so it visibly "adapts" to the content
  // moving behind it, exactly like the adaptive nav bars on iOS.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY || 0;
        const intensity = Math.min(1, y / 400);
        capsuleRef.current?.style.setProperty("--nav-intensity", String(intensity));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={capsuleRef}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => setPos(null)}
      className="liquid-glass navbar-glass pointer-events-auto relative mx-auto flex h-14 max-w-4xl items-center justify-between overflow-hidden rounded-[1.75rem] px-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] transition-all duration-500 sm:px-4"
    >
      {/* Specular top highlight — the bright glass edge (theme-aware) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--foreground)_35%,transparent)] to-transparent"
      />
      {/* Cursor sheen */}
      {pos && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px opacity-60 transition-opacity duration-300"
          style={{
            background: `radial-gradient(140px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.22), transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10 flex w-full items-center justify-between">
        {children}
      </div>
    </div>
  );
}

/**
 * Liquid-glass nav — experimental replacement for the original (saved below in
 * a comment). Free-floating frosted capsule with specular edge + cursor sheen.
 */
export default function Navbar() {
  const { profile: liveProfile } = useSiteContent();
  const { theme: siteTheme, toggle: toggleSiteTheme } = useScopedTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 10;
    const HIDE_DELTA = 5;

    const updateNavbar = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > SCROLL_THRESHOLD);
      const delta = currentScrollY - lastScrollY;
      if (currentScrollY <= SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else if (Math.abs(delta) > HIDE_DELTA) {
        setIsVisible(delta < 0);
      }
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Scroll progress bar — hairline rail fixed above everything */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-accent via-accent to-accent/40"
      />

      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: isVisible ? 0 : -90, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-3 sm:px-5 pt-3 sm:pt-4"
      >
        <LiquidCapsule>
          {/* Wordmark — scrolls to top */}
          <a
            href="#top"
            className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          >
            <span className="font-display text-[13px] font-bold tracking-tight text-foreground/90">
              Personal Portfolio
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-2.5 py-1.5 font-mono text-[11px] text-foreground/60 transition-all duration-200 hover:bg-foreground/10 hover:text-foreground dark:hover:bg-white/10 lg:px-3 lg:text-[12px]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right cluster — ⌘K hint + Resume / mobile menu */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-border bg-foreground/[0.04] px-2.5 py-1 font-mono text-[10px] text-muted-foreground/80 dark:border-white/15 dark:bg-white/[0.06]">
              <Command className="size-3" aria-hidden />K
            </span>
            <a
              href={liveProfile.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 text-[12px] text-foreground/90 backdrop-blur-xl transition-all duration-200 hover:border-accent/50 hover:text-accent active:scale-95 dark:border-white/20 dark:bg-white/[0.08] md:inline-flex"
            >
              Resume
            </a>
            <button
              type="button"
              onClick={toggleSiteTheme}
              aria-label={siteTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="hidden size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-foreground/90 backdrop-blur-xl transition-all duration-200 hover:border-accent/50 hover:text-accent md:inline-flex"
            >
              {siteTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </LiquidCapsule>
      </motion.nav>

      {/* Mobile menu overlay — full frosted sheet */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-2xl backdrop-saturate-150 md:hidden"
        >
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8">
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 text-center font-serif text-2xl tracking-tight text-foreground/80 backdrop-blur-xl transition-colors hover:bg-white/[0.06]"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href={liveProfile.resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 w-full rounded-full border border-accent/30 bg-accent/10 py-4 text-center font-mono text-sm text-accent backdrop-blur-xl active:scale-95"
            >
              Download Resume
            </motion.a>
          </div>
        </motion.div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ORIGINAL NAVBAR — SAVED AS-IS (commented out). Restore by deleting the
 * experimental component above and uncommenting this block.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "use client";
 *
 * import { motion, useScroll, useSpring } from "framer-motion";
 * import { Command, Menu, X } from "lucide-react";
 * import { useEffect, useState } from "react";
 * import { profile } from "@/data/portfolio";
 *
 * const navLinks = [
 *   { label: "Home", href: "#top" },
 *   { label: "About", href: "#about" },
 *   { label: "Skills", href: "#skills" },
 *   { label: "Experience", href: "#experience" },
 *   { label: "Work", href: "#work" },
 *   { label: "Contact", href: "#contact" },
 * ];
 *
 * export default function Navbar() {
 *   const [isVisible, setIsVisible] = useState(true);
 *   const [isScrolled, setIsScrolled] = useState(false);
 *   const [mobileOpen, setMobileOpen] = useState(false);
 *
 *   const { scrollYProgress } = useScroll();
 *   const progress = useSpring(scrollYProgress, {
 *     stiffness: 120,
 *     damping: 30,
 *     restDelta: 0.001,
 *   });
 *
 *   useEffect(() => {
 *     let lastScrollY = window.scrollY;
 *     let ticking = false;
 *     const SCROLL_THRESHOLD = 10;
 *     const HIDE_DELTA = 5;
 *
 *     const updateNavbar = () => {
 *       const currentScrollY = window.scrollY;
 *       setIsScrolled(currentScrollY > SCROLL_THRESHOLD);
 *       const delta = currentScrollY - lastScrollY;
 *       if (currentScrollY <= SCROLL_THRESHOLD) {
 *         setIsVisible(true);
 *       } else if (Math.abs(delta) > HIDE_DELTA) {
 *         setIsVisible(delta < 0);
 *       }
 *       lastScrollY = currentScrollY;
 *       ticking = false;
 *     };
 *
 *     const handleScroll = () => {
 *       if (!ticking) {
 *         window.requestAnimationFrame(updateNavbar);
 *         ticking = true;
 *       }
 *     };
 *
 *     window.addEventListener("scroll", handleScroll, { passive: true });
 *     return () => window.removeEventListener("scroll", handleScroll);
 *   }, []);
 *
 *   return (
 *     <>
 *       <motion.div
 *         aria-hidden
 *         style={{ scaleX: progress }}
 *         className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-accent via-accent to-accent/40"
 *       />
 *
 *       <motion.nav
 *         initial={{ y: 0, opacity: 1 }}
 *         animate={{ y: isVisible ? 0 : -90, opacity: isVisible ? 1 : 0 }}
 *         transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
 *         className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-3 sm:px-5 pt-3 sm:pt-4"
 *       >
 *         <div
 *           className={`pointer-events-auto mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full px-3 sm:px-4 transition-all duration-500 ${
 *             isScrolled
 *               ? "border border-white/[0.14] bg-white/[0.07] backdrop-blur-3xl backdrop-saturate-200"
 *               : "border border-white/[0.06] bg-black/20 backdrop-blur-2xl backdrop-saturate-150"
 *           }`}
 *         >
 *           <a
 *             href="#top"
 *             className="flex shrink-0 items-center transition-opacity hover:opacity-80"
 *           >
 *             <span className="font-display text-[13px] font-bold tracking-tight text-foreground/90">
 *               Personal Portfolio
 *             </span>
 *           </a>
 *
 *           <div className="hidden items-center gap-0.5 md:flex">
 *             {navLinks.map((link) => (
 *               <a
 *                 key={link.href}
 *                 href={link.href}
 *                 className="rounded-full px-2.5 py-1.5 font-mono text-[11px] text-foreground/60 transition-all duration-200 hover:bg-white/[0.08] hover:text-foreground lg:px-3 lg:text-[12px]"
 *               >
 *                 {link.label}
 *               </a>
 *             ))}
 *           </div>
 *
 *           <div className="flex shrink-0 items-center gap-2">
 *             <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-muted-foreground/80">
 *               <Command className="size-3" aria-hidden />K
 *             </span>
 *             <a
 *               href={profile.resumeHref}
 *               target="_blank"
 *               rel="noopener noreferrer"
 *               className="hidden rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[12px] text-foreground/80 backdrop-blur-xl transition-all duration-200 hover:border-accent/50 hover:text-accent active:scale-95 md:inline-flex"
 *             >
 *               Resume
 *             </a>
 *             <button
 *               type="button"
 *               onClick={() => setMobileOpen(!mobileOpen)}
 *               className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-white/[0.08] hover:text-foreground md:hidden"
 *               aria-label="Toggle menu"
 *             >
 *               {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
 *             </button>
 *           </div>
 *         </div>
 *       </motion.nav>
 *
 *       {mobileOpen && (
 *         <motion.div
 *           initial={{ opacity: 0 }}
 *           animate={{ opacity: 1 }}
 *           exit={{ opacity: 0 }}
 *           className="fixed inset-0 z-40 bg-black/80 backdrop-blur-2xl backdrop-saturate-150 md:hidden"
 *         >
 *           <div className="flex h-full flex-col items-center justify-center gap-2 px-8">
 *             {navLinks.map((link) => (
 *               <motion.a
 *                 key={link.href}
 *                 href={link.href}
 *                 onClick={() => setMobileOpen(false)}
 *                 initial={{ opacity: 0, y: 20 }}
 *                 animate={{ opacity: 1, y: 0 }}
 *                 transition={{ ease: [0.16, 1, 0.3, 1] }}
 *                 className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 text-center font-serif text-2xl tracking-tight text-foreground/80 backdrop-blur-xl transition-colors hover:bg-white/[0.06]"
 *               >
 *                 {link.label}
 *               </motion.a>
 *             ))}
 *             <motion.a
 *               href={profile.resumeHref}
 *               target="_blank"
 *               rel="noopener noreferrer"
 *               onClick={() => setMobileOpen(false)}
 *               initial={{ opacity: 0, y: 20 }}
 *               animate={{ opacity: 1, y: 0 }}
 *               transition={{ ease: [0.16, 1, 0.3, 1] }}
 *               className="mt-4 w-full rounded-full border border-accent/30 bg-accent/10 py-4 text-center font-mono text-sm text-accent backdrop-blur-xl active:scale-95"
 *             >
 *               Download Resume
 *             </motion.a>
 *           </div>
 *         </motion.div>
 *       )}
 *     </>
 *   );
 * }
 * ═══════════════════════════════════════════════════════════════════════════ */
