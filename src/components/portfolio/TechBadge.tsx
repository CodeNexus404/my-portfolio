import { cn } from "@/lib/utils";

interface TechBadgeProps {
  name: string;
  className?: string;
}

export default function TechBadge({ name, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        "card-static inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] text-muted-foreground transition-all duration-200 hover:border-accent/40 hover:bg-accent/10 hover:text-accent",
        className,
      )}
    >
      {name}
    </span>
  );
}