"use client";

import { Gauge, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const SHADER_SHAPES = [
  "wave",
  "dots",
  "truchet",
  "corners",
  "ripple",
  "blob",
  "sphere",
] as const;

export type ShaderShape = (typeof SHADER_SHAPES)[number];

export type ShaderParamsValue = {
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

export const DEFAULT_SHADER_PARAMS: ShaderParamsValue = {
  softness: 0.5,
  intensity: 0.25,
  noise: 0,
  speed: 0.5,
  scale: 1.5,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  shape: "wave",
};

type SliderRow = {
  key: keyof ShaderParamsValue;
  label: string;
  min: number;
  max: number;
  step: number;
};

const SLIDERS: SliderRow[] = [
  { key: "softness", label: "Softness", min: 0, max: 1, step: 0.01 },
  { key: "intensity", label: "Intensity", min: 0, max: 1, step: 0.01 },
  { key: "noise", label: "Noise", min: 0, max: 1, step: 0.01 },
  { key: "speed", label: "Speed", min: 0, max: 4, step: 0.01 },
  { key: "scale", label: "Scale", min: 0.01, max: 4, step: 0.01 },
  { key: "rotation", label: "Rotation", min: 0, max: 360, step: 1 },
  { key: "offsetX", label: "Offset X", min: -1, max: 1, step: 0.01 },
  { key: "offsetY", label: "Offset Y", min: -1, max: 1, step: 0.01 },
];

/**
 * Reusable editor for the GrainGradient shader: a color palette (3 swatches with
 * hex inputs) plus sliders for every numeric param and a shape dropdown.
 * Fully controlled — `value` / `onChange` are owned by the parent (Work card or
 * global background editor). `title` lets the parent label the section.
 */
export function ShaderControls({
  colors,
  onColorsChange,
  params,
  onParamsChange,
  title = "Shader",
}: {
  colors: string[];
  onColorsChange: (next: string[]) => void;
  params: ShaderParamsValue;
  onParamsChange: (next: ShaderParamsValue) => void;
  title?: string;
}) {
  const setParam = (key: keyof ShaderParamsValue, value: number | string) =>
    onParamsChange({ ...params, [key]: value });

  const setColor = (i: number, value: string) =>
    onColorsChange(colors.map((c, idx) => (idx === i ? value : c)));

  // Keep exactly 3 color slots in the editor.
  const slots = [0, 1, 2].map((i) => colors[i] ?? "#000000");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Palette className="size-3.5" />
        {title}
      </div>

      {/* Live gradient preview — shows exactly how the card header shader will
          look, with the three color hashes listed beneath for quick copy/edit. */}
      <div className="overflow-hidden rounded-lg border border-border/70">
        <div
          className="h-16 w-full"
          style={{
            background: `linear-gradient(120deg, ${slots.join(", ")})`,
          }}
          aria-hidden
        />
        <div className="flex flex-wrap gap-x-3 gap-y-1 bg-background/60 px-3 py-2">
          {slots.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
            >
              <span
                className="size-3 rounded-full border border-border/70"
                style={{ background: c }}
              />
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Palette */}
      <div className="flex flex-col gap-2">
        <Label className="text-[11px]">Gradient colors</Label>
        {slots.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={/^#?[0-9A-Fa-f]{3,8}$/.test(c) ? (c.startsWith("#") ? c : `#${c}`) : "#000000"}
              onChange={(e) => setColor(i, e.target.value)}
              aria-label={`Color ${i + 1}`}
              className="size-8 cursor-pointer rounded-md border border-border/70 bg-transparent p-0.5"
            />
            <Input
              value={c}
              onChange={(e) => setColor(i, e.target.value)}
              className="h-8 flex-1 font-mono text-[11px]"
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      {/* Sliders — two-column grid so the eight controls stay compact */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {SLIDERS.map((row) => (
          <div key={row.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-mono text-foreground/80">
                {Number(params[row.key]).toFixed(row.step < 1 ? 2 : 0)}
              </span>
            </div>
            <Slider
              value={[Number(params[row.key])]}
              min={row.min}
              max={row.max}
              step={row.step}
              onValueChange={(v) => setParam(row.key, v[0])}
              aria-label={row.label}
            />
          </div>
        ))}
      </div>

      {/* Shape */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Gauge className="size-3.5" />
          Shape
        </div>
        <Select value={params.shape} onValueChange={(v) => setParam("shape", v)}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Shape" />
          </SelectTrigger>
          <SelectContent>
            {SHADER_SHAPES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
