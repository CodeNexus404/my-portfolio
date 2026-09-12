import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useScopedTheme } from "@/theme/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  // Read the *scoped* theme (public site + dashboard each keep their own), so the
  // toast flips correctly in light/dark instead of being stuck on the root default.
  let theme: ToasterProps["theme"] = "dark"
  try {
    theme = useScopedTheme().theme === "dark" ? "dark" : "light"
  } catch {
    theme = "dark"
  }

  return (
    <Sonner
      theme={theme}
      position="top-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      // Solid, theme-token-driven surface so the text is clearly legible in BOTH
      // light and dark mode (no more dark-on-dark or light-on-light).
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--card-border)",
          "--border-radius": "0.9rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] group-[.toaster]:text-foreground group-[.toaster]:bg-card",
          title: "text-[13px] font-semibold tracking-tight",
          description: "text-[12px] text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          icon: "text-foreground",
          success: "[&_[data-icon]]:text-emerald-400",
          error: "[&_[data-icon]]:text-red-400",
          warning: "[&_[data-icon]]:text-amber-400",
          info: "[&_[data-icon]]:text-sky-400",
          loading: "[&_[data-icon]]:text-sky-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
