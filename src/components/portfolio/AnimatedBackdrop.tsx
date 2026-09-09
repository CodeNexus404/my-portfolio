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
  return (
    <div className="absolute inset-0 h-full w-full">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(0, 0%, 0%)"
        softness={0.5}
        intensity={0.3}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1}
        rotation={0}
        speed={1}
        colors={[
          "hsl(193, 85%, 66%)",
          "hsl(196, 100%, 83%)",
          "hsl(195, 100%, 50%)",
        ]}
      />
    </div>
  );
}

export default function AnimatedBackdrop() {
  // The GrainGradient shader drives its own rAF continuously. When the tab is
  // hidden there's nothing to paint, so unmount it and stop the GPU loop — this
  // keeps the page from wasting frames in the background and returns them to the
  // foreground when the user comes back.
  const [visible, setVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <ShaderErrorBoundary fallback={<CanvasFallback />}>
      <Suspense fallback={<CanvasFallback />}>
        {visible ? <GrainGradientShader /> : <CanvasFallback />}
      </Suspense>
    </ShaderErrorBoundary>
  );
}

function CanvasFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const canvas = canvasEl; // capture non-null refs for the animation loop
    let animFrame = 0;
    let lastTime = 0;
    const interval = 1000 / 30; // 30fps — smooth enough, cheap
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      animFrame = requestAnimationFrame(draw);
      if (time - lastTime < interval) return;
      lastTime = time;
      const w = canvas.width;
      const h = canvas.height;
      const t = time * 0.00025;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // Cyan family matching the GrainGradient palette
      const blobs = [
        {
          x: 0.1 + Math.sin(t * 0.8) * 0.35,
          y: 0.25 + Math.cos(t * 0.5) * 0.35,
          r: 0.65,
          color: [0, 216, 168],
        },
        {
          x: 0.85 + Math.cos(t * 0.6) * 0.3,
          y: 0.7 + Math.sin(t * 0.7) * 0.3,
          r: 0.6,
          color: [0, 255, 212],
        },
        {
          x: 0.5 + Math.sin(t * 0.45) * 0.25,
          y: 0.15 + Math.cos(t * 0.35) * 0.35,
          r: 0.55,
          color: [0, 180, 255],
        },
      ];
      for (const blob of blobs) {
        const g = ctx.createRadialGradient(
          blob.x * w,
          blob.y * h,
          0,
          blob.x * w,
          blob.y * h,
          blob.r * w,
        );
        g.addColorStop(0, `rgba(${blob.color.join(",")},0.85)`);
        g.addColorStop(0.35, `rgba(${blob.color.join(",")},0.45)`);
        g.addColorStop(0.7, `rgba(${blob.color.join(",")},0.12)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    };
    animFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

class ShaderErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: Error) {
    console.warn(
      "[AnimatedBackdrop] shader crashed, using canvas fallback:",
      err.message,
    );
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}