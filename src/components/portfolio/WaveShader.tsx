import { GrainGradient } from "@paper-design/shaders-react";

/**
 * Per-card shader header — GrainGradient with shape="wave" (one of the seven
 * GrainGradientShapes: wave | dots | truchet | corners | ripple | blob | sphere).
 * Palette rotates per card exactly like aarab.me's WorkCard GRADIENTS array
 * (github.com/aarabii/An → components/sections/work/_components/WorkCard.tsx),
 * except aarab.me uses "truchet" — we use "wave" as requested.
 * Slower speed, gentler distortion, scaled so the waves stay readable at card
 * header size. Rendered inside each WorkCard's folder header.
 */
const GRADIENTS: string[][] = [
  // Orange → Amber → Red
  ["#F97316", "#F59E0B", "#EF4444"],
  // Purple → Indigo → Violet
  ["#9333EA", "#6366F1", "#8B5CF6"],
  // Sky → Blue → Deep Indigo
  ["#38BDF8", "#2563EB", "#4F46E5"],
  // Emerald → Teal → Cyan
  ["#10B981", "#0D9488", "#06B6D4"],
];

export default function WaveShader({ index = 0 }: { index?: number }) {
  const colors = GRADIENTS[index % GRADIENTS.length] ?? GRADIENTS[0];

  return (
    <div className="absolute inset-0 h-full w-full">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(240, 15%, 4%)"
        softness={0.6}
        intensity={0.25}
        noise={0}
        shape="wave"
        offsetX={0}
        offsetY={0}
        scale={1.5}
        rotation={0}
        speed={0.5}
        colors={colors}
      />
    </div>
  );
}
