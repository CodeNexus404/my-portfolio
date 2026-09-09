import Lenis from "lenis";
import { useEffect } from "react";
import type { ReactNode } from "react";

/** Buttery smooth scrolling (Lenis), matching the reference site's feel.
 *  - Intercepts in-page anchor clicks so they glide instead of jump
 *  - Respects scroll-margin-top on targets so fixed navbars don't cover them
 *  - Disables itself entirely for users with prefers-reduced-motion */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      // Tighter glide — lerp 0.1 felt floaty/laggy; 0.15 reads as responsive and
      // crisp on high-refresh (120Hz) displays while still smoothing the scroll.
      lerp: 0.15,
      wheelMultiplier: 1,
      // Keep touch scrolling at ~native speed instead of the floaty 1.6x
      touchMultiplier: 1.2,
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      // Respect the target's scroll-margin (fixed navbar offset)
      const scrollMargin =
        parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      lenis.scrollTo(target as HTMLElement, {
        offset: -scrollMargin,
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return children;
}
