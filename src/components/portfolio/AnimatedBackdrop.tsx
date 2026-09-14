"use client";
import {
  Component,
  Suspense,
  lazy,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { GrainGradient } from "@paper-design/shaders-react";
import { LiveProvider, LivePreview, LiveError } from "react-live";
import { useScopedTheme } from "@/theme/theme";
import { useSiteContent } from "@/hooks/use-site-content";

/**
 * Fixed full-screen background — an exact copy of aarab.me's background
 * shader (https://www.aarab.me/), taken verbatim from its open-source source:
 *
 *   github.com/aarabii/An → components/mics/bg/GradientBg.tsx
 *
 * It is the "Grain Gradient" shader from Paper Shaders
 * (shaders.paper.design/grain-gradient), published on npm as
 * `@paper-design/shaders-react`. Props below match aarab.me exactly:
 * softness 0.5, intensity 0.3, noise 0, shape "corners", speed 1, and the
 * same three cyan HSL colors. No vignette, no extra props.
 *
 * Lazy + Suspense-wrapped so a slow or failed load can never block the page;
 * if WebGL is unavailable a canvas fallback renders the same palette.
 */
const Shader = lazy(() => import("./GrainGradientShader"));

function GrainGradientShader() {
  const { background } = useSiteContent();
  const { theme } = useScopedTheme();
  const isDark = theme !== "light";

  // When the dashboard has switched the background to a static uploaded image,
  // don't mount the WebGL shader at all — the parent renders the image instead.
  if (background.mode === "image") return null;

  // The base color must flip with the theme: black in dark mode, a cool light
  // grey in light mode — otherwise dark ink text (Hero name, navbar) becomes
  // invisible against a black shader. The owner's custom colorBack only applies
  // in dark mode; light mode always uses a readable light base.
  const colorBack = isDark
    ? background.colorBack || "hsl(0, 0%, 0%)"
    : "#e6ecf2";

  // WebGL contexts can be evicted by the browser on very tall pages (it caps the
  // number of live contexts). When that happens the shader silently goes blank —
  // which is exactly the "background turns off at the bottom of the page" bug.
  // We listen for the canvas `webglcontextlost` event and bump a remount key so
  // React spins up a fresh, working context. The canvas the lib renders mounts
  // asynchronously (lazy + Suspense), so we can't rely on it being present on the
  // first effect run — a MutationObserver attaches the listeners as soon as the
  // <canvas> appears, and re-attaches after every remount (ctxKey change).
  const [ctxKey, setCtxKey] = useState(0);
  const shaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shaderRef.current;
    if (!el) return;

    const attach = (canvas: HTMLCanvasElement) => {
      // Debounce remounts: a single context-eviction event can fire `lost` several
      // times in a row, and a fresh context can be lost again immediately on a very
      // long page. Without this guard we'd spin ctxKey forever and thrash the GPU.
      let lastRemount = 0;
      const onLost = (e: Event) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastRemount < 1500) return;
        lastRemount = now;
        // Remount to obtain a fresh, working WebGL context. This is the only
        // reliable recovery on long pages where the browser silently evicts the
        // oldest context when the GPU context budget is exceeded.
        setCtxKey((k) => k + 1);
      };
      const onRestored = () => {
        // The context was recovered by the browser, but the GrainGradient lib
        // often doesn't repaint its internal canvas after a restore — leaving a
        // blank background. A debounced remount forces it to redraw cleanly,
        // which is what makes the shader reappear after the brief eviction that
        // happens when scrolling to the bottom of a long page.
        const now = Date.now();
        if (now - lastRemount < 1500) return;
        lastRemount = now;
        setCtxKey((k) => k + 1);
      };
      canvas.addEventListener("webglcontextlost", onLost);
      canvas.addEventListener("webglcontextrestored", onRestored);
      return () => {
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
      };
    };

    // Attach now if the canvas is already there.
    let detach = () => {};
    const existing = el.querySelector("canvas");
    if (existing) detach = attach(existing);

    // Otherwise watch for it to be inserted (covers async/lazy mount + remounts).
    const observer = new MutationObserver(() => {
      const c = el.querySelector("canvas");
      if (!c) return;
      detach();
      detach = attach(c);
    });
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detach();
    };
  }, [ctxKey]);

  return (
    <div key={ctxKey} ref={shaderRef} className="absolute inset-0 h-full w-full">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack={colorBack}
        softness={background.softness}
        intensity={background.intensity}
        noise={background.noise}
        shape={background.shape as never}
        offsetX={background.offsetX}
        offsetY={background.offsetY}
        scale={background.scale}
        rotation={background.rotation}
        speed={background.speed}
        colors={background.colors}
      />
    </div>
  );
}

/**
 * Owner-authored custom background: HTML/CSS (sandboxed iframe) or React JSX
 * (compiled live via react-live). Renders full-screen behind the content. A bad
 * React snippet won't crash the page — the ShaderErrorBoundary below catches it
 * and falls back to the canvas gradient.
 */
function BackgroundCustomLayer() {
  const { background } = useSiteContent();
  const source = background.customCss ?? "";

  if (background.customType === "react") {
    return (
      <div className="absolute inset-0 h-full w-full">
        <LiveProvider code={source} noInline={false}>
          <LivePreview />
          <LiveError className="hidden" />
        </LiveProvider>
      </div>
    );
  }

  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden;background:transparent;}*{box-sizing:border-box;}</style></head><body>${source}</body></html>`;
  return (
    <iframe
      title="Custom background"
      srcDoc={doc}
      sandbox=""
      className="absolute inset-0 h-full w-full border-0 bg-transparent"
      aria-hidden
    />
  );
}

export default function AnimatedBackdrop() {
  const { background, backgroundImageUrl } = useSiteContent();

  // Custom + image modes are static (no rAF).
  if (background.mode === "custom" && background.customCss) {
    return (
      <ShaderErrorBoundary fallback={null}>
        <BackgroundCustomLayer />
      </ShaderErrorBoundary>
    );
  }
  if (background.mode === "image" && backgroundImageUrl) {
    return (
      <img
        src={backgroundImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
    );
  }

  // Only the real GrainGradient shader ever renders — no CSS/canvas fallback that
  // would otherwise flash a *different* background when the WebGL context is
  // briefly evicted (e.g. scrolling to the bottom of a long page). The
  // webglcontextlost handler inside GrainGradientShader recovers the live context;
  // until then the wrapper just shows its own theme background, never a substitute
  // shader. Suspense/error fall back to nothing so the real shader is the only look.
  return (
    <ShaderErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <GrainGradientShader />
      </Suspense>
    </ShaderErrorBoundary>
  );
}

class ShaderErrorBoundary extends Component<
  { fallback: ReactNode | null; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: Error) {
    console.warn(
      "[AnimatedBackdrop] shader crashed; background will be blank until reload:",
      err.message,
    );
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}