import { cn } from "@/lib/utils";

interface TechBadgeProps {
  name: string;
  className?: string;
}

export default function TechBadge({ name, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/[0.06] bg-black/40 px-3 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur-xl transition-all duration-200 hover:border-accent/40 hover:bg-accent/10 hover:text-accent",
        className,
      )}
    >
      {name}
    </span>
  );
}