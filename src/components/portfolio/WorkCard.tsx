"use client";

import { Component, Suspense, lazy, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Project } from "@/data/portfolio";
import TechBadge from "./TechBadge";

// The genuine WebGL wave shader (same flowing gradient animation you liked).
// lazy() so the canvas code never blocks first paint.
const WaveShader = lazy(() => import("./WaveShader"));
interface WorkCardProps {
  project: Project;
  index: number;
  className?: string;
}

export default function WorkCard({ project, index, className }: WorkCardProps) {
  const number = String(index + 1).padStart(3, "0");
  const shaderRef = useRef<HTMLDivElement>(null);
  // Only mount the WebGL shader while the card header is on/near screen. Offscreen
  // cards show the static gradient fallback — so you keep the real flowing shader
  // animation without 4 always-on GPU contexts fighting for frames while scrolling.
  const shaderInView = useInView(shaderRef, { margin: "200px" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl transition-colors duration-300 hover:border-card-border-hover hover:shadow-accent/5",
        className,
      )}
    >
      {/* Shader header — the "folder contents" showing above the tab */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-44">
        <div ref={shaderRef} className="pointer-events-none absolute inset-0 overflow-hidden">
          {shaderInView ? (
            <ShaderErrorBoundary fallback={<WaveShaderFallback />}>
              <Suspense fallback={<WaveShaderFallback />}>
                <WaveShader index={index} />
              </Suspense>
            </ShaderErrorBoundary>
          ) : (
            <WaveShaderFallback />
          )}
        </div>
      </div>

      {/* Body pulled up under the folder-tab SVG so the notch overlaps the shader */}
      <div className="relative z-10 -mt-14 flex flex-1 flex-col sm:-mt-16">
        {/* Folder tab: same fill as the card body, so it reads as one die-cut shape */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <svg
            className="h-full w-full fill-card"
            viewBox="0 0 400 340"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M 0 32 C 0 14, 14 0, 32 0 L 175 0 C 190 0, 198 10, 205 22 C 212 34, 220 40, 235 40 L 368 40 C 386 40, 400 54, 400 72 L 400 340 L 0 340 Z"
              stroke="var(--card-border)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-6 pt-2">
          <div className="flex h-10 items-center pr-24 sm:h-11">
            <h3 className="truncate font-mono text-sm font-bold tracking-wider text-foreground uppercase sm:text-base">
              {project.name}
            </h3>
          </div>

          <div className="mt-4 flex flex-1 flex-col gap-4">
            <p className="text-left font-sans text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {project.description}
            </p>
            {project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {project.technologies.map((tech) => (
                  <TechBadge key={tech} name={tech} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col pt-2">
            <div className="mb-4 h-px w-full bg-linear-to-r from-border via-card-border-hover to-border" />
            <div className="flex items-end justify-between">
              <span className="font-display text-2xl font-extrabold tracking-tighter text-foreground sm:text-3xl">
                {number}
              </span>
              <div className="flex items-center gap-4">
                {project.links.live ? (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground hover:underline"
                  >
                    LIVE
                  </a>
                ) : null}
                {project.links.github ? (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground hover:underline"
                  >
                    GITHUB
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Crash-guard for the per-card WebGL canvas — falls back to a static
 *  gradient tile instead of taking down the section (mirrors AnimatedBackdrop). */
function ShaderErrorBoundary({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  return <ShaderBoundaryInner fallback={fallback}>{children}</ShaderBoundaryInner>;
}

class ShaderBoundaryInner extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function WaveShaderFallback() {
  return (
    <div
      className="h-full w-full"
      style={{
        background:
          "radial-gradient(120% 100% at 15% 0%, hsl(193 85% 66% / 0.35) 0%, transparent 55%), radial-gradient(100% 90% at 85% 10%, hsl(196 100% 83% / 0.25) 0%, transparent 50%), radial-gradient(140% 120% at 50% 100%, hsl(195 100% 50% / 0.3) 0%, transparent 60%), var(--card)",
      }}
      aria-hidden
    />
  );
}
