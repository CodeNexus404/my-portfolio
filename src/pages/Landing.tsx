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
import { SiteContentProvider, useSiteContent } from "@/hooks/use-site-content";
import { ThemeScopeProvider } from "@/theme/theme";
import { Toaster } from "@/components/ui/sonner";

// The shader bundle never blocks the hero — it mounts right after first paint.
const AnimatedBackdrop = lazy(
  () => import("@/components/portfolio/AnimatedBackdrop"),
);

export default function Landing() {
  const [loading, setLoading] = useState(true);

  return (
    <SiteContentProvider>
      <ThemeScopeProvider storageKey="portfolio-public-theme" defaultTheme="dark">
      <div className="min-h-screen flex flex-col relative">
      {/* Entrance preloader */}
      <AnimatePresence>
        {loading ? <Preloader onComplete={() => setLoading(false)} /> : null}
      </AnimatePresence>

      {/* Desktop trailing cursor */}
      <Cursor />

      {/* Fixed background — the live GrainGradient shader, a static uploaded image,
          or a custom HTML/CSS/React layer (all chosen in the dashboard). Painted
          at z-0 so it sits behind the content but stays visible. AnimatedBackdrop
          renders the correct mode itself. */}
      <div
        className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none bg-background"
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
          <div className="relative rounded-t-[2.5rem] border-t border-border bg-background/70 backdrop-blur-2xl backdrop-saturate-150">
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
      <Toaster />
    </ThemeScopeProvider>
    </SiteContentProvider>
  );
}