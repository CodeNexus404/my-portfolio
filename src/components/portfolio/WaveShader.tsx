import { GrainGradient } from "@paper-design/shaders-react";

export type ShaderParams = {
  softness: number;
  intensity: number;
  noise: number;
  speed: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  shape: string;
};

/** Per-card shader defaults — the original aarab.me wave look. */
export const DEFAULT_SHADER_PARAMS: ShaderParams = {
  softness: 0.6,
  intensity: 0.25,
  noise: 0,
  speed: 0.5,
  scale: 1.5,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  shape: "wave",
};

const SHAPE_MAP: Record<string, "wave" | "dots" | "truchet" | "corners" | "ripple" | "blob" | "sphere"> = {
  wave: "wave",
  dots: "dots",
  truchet: "truchet",
  corners: "corners",
  ripple: "ripple",
  blob: "blob",
  sphere: "sphere",
};

// Graceful fallback used if a stored shape string is unknown.
const FALLBACK_SHAPE = "wave";

// The four rotating gradient palettes (editable per card from the dashboard).
export const WORK_CARD_GRADIENTS: string[][] = [
  // Orange → Amber → Red
  ["#F97316", "#F59E0B", "#EF4444"],
  // Purple → Indigo → Violet
  ["#9333EA", "#6366F1", "#8B5CF6"],
  // Sky → Blue → Deep Indigo
  ["#38BDF8", "#2563EB", "#4F46E5"],
  // Emerald → Teal → Cyan
  ["#10B981", "#0D9488", "#06B6D4"],
];

/**
 * Per-card shader header — GrainGradient with shape="wave" (one of the seven
 * GrainGradientShapes: wave | dots | truchet | corners | ripple | blob | sphere).
 * Palette rotates per card exactly like aarab.me's WorkCard GRADIENTS array
 * (github.com/aarabii/An → components/sections/work/_components/WorkCard.tsx),
 * except aarab.me uses "truchet" — we use "wave" as requested. Numeric params
 * (softness / intensity / noise / speed / scale / rotation / offsetX / offsetY)
 * are editable per card from the dashboard.
 *
 * Slower speed, gentler distortion, scaled so the waves stay readable at card
 * header size. Rendered inside each WorkCard's folder header.
 */
export default function WaveShader({
  index = 0,
  colors: override,
  params,
  isDark = true,
}: {
  index?: number;
  colors?: string[];
  params?: Partial<ShaderParams>;
  isDark?: boolean;
}) {
  const colors = (override && override.length ? override : WORK_CARD_GRADIENTS[index % WORK_CARD_GRADIENTS.length]) ?? WORK_CARD_GRADIENTS[0];
  const p = { ...DEFAULT_SHADER_PARAMS, ...(params ?? {}) };

  // Near-black base in dark mode; a cool light grey in light mode so the card
  // body reads as a bright surface and the ink text stays visible.
  const colorBack = isDark ? "hsl(240, 15%, 4%)" : "#eef2f7";

  return (
    <div className="absolute inset-0 h-full w-full">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack={colorBack}
        softness={p.softness}
        intensity={p.intensity}
        noise={p.noise}
        shape={SHAPE_MAP[p.shape] ?? FALLBACK_SHAPE}
        offsetX={p.offsetX}
        offsetY={p.offsetY}
        scale={p.scale}
        rotation={p.rotation}
        speed={p.speed}
        colors={colors}
      />
    </div>
  );
}
