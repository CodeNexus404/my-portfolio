import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useState } from "react";
import Navbar from "@/components/portfolio/Navbar";
import Hero from "@/components/portfolio/Hero";
import Preloader from "@/components/portfolio/Preloader";
import Cursor from "@/components/portfolio/Cursor";
import Marquee from "@/components/portfolio/Marquee";
import About from "@/components/portfolio/About";
import Skills from "@/components/portfolio/Skills";
import Experience from "@/components/portfolio/Experience";
import Projects from "@/components/portfolio/Projects";
import Contact from "@/components/portfolio/Contact";
import Footer from "@/components/portfolio/Footer";
import CommandPalette from "@/components/portfolio/CommandPalette";

// The shader bundle never blocks the hero — it mounts right after first paint.
const AnimatedBackdrop = lazy(
  () => import("@/components/portfolio/AnimatedBackdrop"),
);

export default function Landing() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Entrance preloader */}
      <AnimatePresence>
        {loading ? <Preloader onComplete={() => setLoading(false)} /> : null}
      </AnimatePresence>

      {/* Desktop trailing cursor */}
      <Cursor />

      {/* Fixed shader background — exact aarab.me GrainGradient
          (github.com/aarabii/An → components/mics/bg/GradientBg.tsx).
          Painted at z-0, NOT -z-50: a negative z-index would drop it behind
          the page's opaque background and the shader would be invisible. */}
      <div
        className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none bg-black"
        aria-hidden
      >
        <Suspense fallback={null}>
          <AnimatedBackdrop />
        </Suspense>
      </div>

      {/* All content lives above the shader */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <CommandPalette />

        <main>
          <Hero />
          {/* Content sections — one continuous frosted-glass sheet over the
              fixed shader (aarab.me pattern): a single backdrop-blur wrapper
              instead of per-section filters, so the blur is complete and
              seamless from the Marquee all the way through Contact */}
          <div className="relative rounded-t-[2.5rem] border-t border-white/10 bg-black/30 backdrop-blur-2xl backdrop-saturate-150">
            <Marquee />
            <About />
            <Skills />
            <Experience />
            <Projects />
            <Contact />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}