import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronDown,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MailOpen,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { LiveProvider, LivePreview, LiveError, LiveContext } from "react-live";
import { GrainGradient } from "@paper-design/shaders-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { profile as staticProfile, selectedWorks, experience as staticExperience, skills as staticSkills } from "@/data/portfolio";
import { brandFor, ICON_KEYS } from "@/components/portfolio/skillBrands";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSiteContent } from "@/hooks/use-site-content";
import { useScopedTheme, ThemeScopeProvider } from "@/theme/theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShaderControls, type ShaderShape } from "@/components/dashboard/ShaderControls";
import { WORK_CARD_GRADIENTS, DEFAULT_SHADER_PARAMS } from "@/components/portfolio/WaveShader";
import WorkCard from "@/components/portfolio/WorkCard";
import type { Project } from "@/data/portfolio";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Tab = "inbox" | "work" | "content" | "experience" | "skills" | "terminal" | "background" | "resume";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Inbox header with the bulk-select toolbar (select all / clear / delete selected). */
function InboxHeader({
  total,
  unreadCount,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onMarkRead,
  onMarkUnread,
  deleting,
  marking,
}: {
  total: number;
  unreadCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  deleting: boolean;
  marking: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Inbox className="size-4.5" />
      </div>
      <h2 className="text-base font-bold tracking-tight">Messages</h2>
      {unreadBadgeCount(unreadCount) > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
          {unreadBadgeCount(unreadCount)} new
        </span>
      ) : null}

      {total > 0 ? (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selectedCount > 0 ? (
            <>
              <span className="font-mono text-xs text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="cursor-pointer gap-1.5"
                onClick={onMarkUnread}
                disabled={marking || deleting}
              >
                {marking ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                Mark unread
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="cursor-pointer gap-1.5"
                onClick={onMarkRead}
                disabled={marking || deleting}
              >
                {marking ? <Loader2 className="size-3.5 animate-spin" /> : <MailOpen className="size-3.5" />}
                Mark read
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="cursor-pointer gap-1.5"
                onClick={onClearSelection}
                disabled={deleting || marking}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="cursor-pointer gap-1.5"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete ${selectedCount} selected message${selectedCount === 1 ? "" : "s"}?`,
                    )
                  ) {
                    onDeleteSelected();
                  }
                }}
                disabled={deleting || marking}
              >
                {deleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Delete selected
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="cursor-pointer gap-1.5 text-muted-foreground"
              onClick={onSelectAll}
            >
              <Plus className="size-3.5" />
              Select all
            </Button>
          )}
        </div>
      ) : (
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          latest 50 · live
        </span>
      )}
    </header>
  );
}

// Render the unread badge count, collapsing large numbers like the tab bar does.
function unreadBadgeCount(n: number) {
  return n > 99 ? 99 : n;
}

type EmailStatus = {
  configured: boolean;
  from: string;
  usingTestSender: boolean;
} | null;

/**
 * Live Resend health + domain-verification checklist for the owner. Reads the
 * emailStatus query (which reflects the deployment's RESEND_API_KEY / RESEND_FROM)
 * so the owner can see at a glance whether dashboard replies AND login OTPs will
 * actually be emailed out, and what's left to do for reliable delivery. Both the
 * reply feature and the email-OTP login share this same RESEND config.
 */
function ResendChecklist({ status }: { status: EmailStatus }) {
  if (status === undefined) {
    // Still loading — render nothing intrusive.
    return null;
  }
  const steps: { label: string; done: boolean }[] = [
    {
      label: "RESEND_API_KEY configured",
      done: status?.configured ?? false,
    },
    {
      label: "Verified sending domain (not the resend.dev test sender)",
      done: status ? !status.usingTestSender : false,
    },
    {
      label: "Applies to login OTPs too (same RESEND_FROM)",
      done: status ? !status.usingTestSender : false,
    },
  ];
  const allDone = steps.every((s) => s.done);

  return (
    <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Email (replies &amp; login OTPs)</h3>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
            status?.configured
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {status?.configured ? "Active" : "Not configured"}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                s.done
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {s.done ? "✓" : "!"}
            </span>
            <span className={s.done ? "text-muted-foreground" : "text-foreground"}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {status
          ? `Sending as: ${status.from}`
          : "Sending as: Sahil Shedge <onboarding@resend.dev>"}
      </p>

      {!allDone ? (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {!status?.configured ? (
              <>
                Set <span className="font-mono text-foreground">RESEND_API_KEY</span> in
                your Convex deployment to enable emailing replies. Replies are still
                saved in this inbox.
              </>
            ) : (
              <>
                You're on Resend's test sender, so replies and login OTPs may land in
                spam or be blocked. Verify a domain at{" "}
                <span className="font-mono text-foreground">resend.com/domains</span> and
                update <span className="font-mono text-foreground">RESEND_FROM</span> to a
                sender on that domain for reliable delivery. The same sender is used for
                both dashboard replies and the email-OTP login.
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-emerald-500">
          ✓ Fully configured — dashboard replies and login OTPs will be delivered.
        </p>
      )}
    </div>
  );
}

/** One expandable message thread with an inline reply composer. */
function MessageThread({
  msg,
  selected,
  onToggleSelect,
}: {
  msg: Doc<"contactMessages">;
  selected: boolean;
  onToggleSelect: (next: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const markAsRead = useMutation(api.messages.markAsRead);
  const replyToMessage = useAction(api.sendReply.replyToMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMessage({ id: msg._id });
      toast.success("Message deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !msg.read) {
      markAsRead({ id: msg._id }).catch(() => {});
    }
  };

  const handleSendReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const res = await replyToMessage({ messageId: msg._id, reply: trimmed });
      if (res.emailed) {
        toast.success("Reply saved & emailed.");
      } else if (res.emailError) {
        toast.warning("Reply saved.", { description: res.emailError });
      } else {
        toast.success("Reply saved.");
      }
      setReplyText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <li className="py-4">
      <div className="flex w-full items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          aria-label={`Select message from ${msg.name}`}
          className="mt-1 size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
        />

        {!open ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 text-left"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {!msg.read ? (
              <span className="size-2 shrink-0 rounded-full bg-primary" />
            ) : (
              <MailOpen className="size-3.5 shrink-0 text-muted-foreground/50" />
            )}
            <span
              className={cn(
                "shrink-0 text-sm tracking-tight",
                msg.read ? "text-foreground/80" : "font-semibold text-foreground",
              )}
            >
              {msg.name}
            </span>
            <span className="hidden truncate text-sm text-muted-foreground/70 sm:inline">
              — {msg.message.replace(/\s+/g, " ").trim().slice(0, 80)}
              {msg.message.length > 80 ? "…" : ""}
            </span>
            {msg.repliedAt ? (
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary">
                Replied
              </span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(msg._creationTime)}
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </span>
        </button>
      ) : (
        <div className="mt-0 flex w-full flex-col gap-4 border-l-2 border-border/60 pl-4 sm:pl-5">
          {/* Email-style header — From / address / date, like a mail client.
              Clicking the row collapses the thread again. */}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="flex w-full cursor-pointer flex-wrap items-end justify-between gap-2 text-left"
          >
            <div className="flex min-w-0 items-center gap-2">
              {!msg.read ? (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              ) : (
                <MailOpen className="size-3.5 shrink-0 text-muted-foreground/50" />
              )}
              <span className="truncate text-sm font-semibold text-foreground">
                {msg.name}
              </span>
              <a
                href={`mailto:${msg.email}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-xs text-primary hover:underline"
              >
                &lt;{msg.email}&gt;
              </a>
            </div>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDate(msg._creationTime)}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </span>
          </button>

          {/* The message body. */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {msg.message}
          </p>

          {msg.reply ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                You replied · {msg.repliedAt ? formatDate(msg.repliedAt) : ""}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {msg.reply}
              </p>
            </div>
          ) : null}

          {/* Reply composer — full-width, sits below the message like a reply box. */}
          <div className="flex flex-col gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${msg.name}…`}
              rows={6}
              className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 disabled:opacity-60"
              disabled={sending}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <a
                  href={`mailto:${msg.email}?subject=${encodeURIComponent(
                    "Re: your message",
                  )}&body=${encodeURIComponent(replyText)}`}
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  or open in your email app
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete this message from ${msg.name}?`)) {
                      void handleDelete();
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                className="cursor-pointer gap-2"
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Send reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>
    </li>
  );
}

// ── Work tab ────────────────────────────────────────────────────────────────────

type ProjectEditor = {
  id?: string;
  name: string;
  description: string;
  technologies: string;
  liveUrl: string;
  githubUrl: string;
  shaderMode: "shader" | "image" | "custom";
  customType: "html" | "react";
  shaderColors: string[];
  shaderParams: {
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
  customCss: string;
};

/**
 * WYSIWYG preview of a work card using the real public-site WorkCard so the owner
 * sees exactly how the card will look after saving. Built from the current (unsaved)
 * editor state — shader colors/params/mode/image/custom source all reflect live.
 */
function WorkCardPreview({ editor, index }: { editor: ProjectEditor; index: number }) {
  const preview: Project = {
    id: editor.id ?? `preview-${index}`,
    name: editor.name || "Project Name",
    description: editor.description || "A short description of what this project does and the impact it had.",
    technologies: (() => {
      const t = editor.technologies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);
      return t.length ? t : ["React", "TypeScript"];
    })(),
    links: {
      live: editor.liveUrl || undefined,
      github: editor.githubUrl || undefined,
    },
    shaderColors: editor.shaderColors.length ? editor.shaderColors : undefined,
    shaderParams: editor.shaderParams,
    shaderMode: editor.shaderMode,
    customType: editor.customType,
    customCss: editor.customCss,
    headerImageUrl: null,
  };
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70">
      <WorkCard project={preview} index={index} />
    </div>
  );
}

function WorkTab() {
  const data = useQuery(api.content.getEditable);
  const upsertProject = useMutation(api.content.upsertProject);
  const deleteProject = useMutation(api.content.deleteProject);
  const reorderProject = useMutation(api.content.reorderProject);
  const createUploadUrl = useMutation(api.content.createUploadUrl);
  const setProjectImage = useMutation(api.content.setProjectImage);
  const clearProjectImage = useMutation(api.content.clearProjectImage);

  // Defaults used when a card has no saved colors / params yet.
  const DEFAULT_PALETTE = ["#F97316", "#F59E0B", "#EF4444"];
  const DEFAULT_PARAMS = {
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

  // Local editable list. Seed from live data (or static fallback). `technologies`
  // is kept as a comma-separated string for easy editing.
  const seed = useMemo<ProjectEditor[]>(() => {
    const list =
      data?.projects ??
      selectedWorks.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        technologies: p.technologies.join(", "),
        liveUrl: p.links.live ?? "",
        githubUrl: p.links.github ?? "",
        shaderMode: p.shaderMode ?? "shader",
        customType: p.customType ?? "html",
        shaderColors: p.shaderColors ?? [],
        shaderParams: p.shaderParams ?? DEFAULT_PARAMS,
        customCss: p.customCss ?? "",
      }));
    return list.map((p) => ({
      ...p,
      technologies: Array.isArray(p.technologies)
        ? (p.technologies as string[]).join(", ")
        : (p.technologies as string),
      liveUrl: p.liveUrl ?? "",
      githubUrl: p.githubUrl ?? "",
      shaderMode: (p.shaderMode as ProjectEditor["shaderMode"]) ?? "shader",
      customType: (p.customType as ProjectEditor["customType"]) ?? "html",
      shaderColors: (p.shaderColors as string[] | undefined) ?? [],
      shaderParams: (p.shaderParams as ProjectEditor["shaderParams"] | undefined) ?? DEFAULT_PARAMS,
      customCss: (p.customCss as string | undefined) ?? "",
    }));
  }, [data]);

  const [items, setItems] = useState<ProjectEditor[]>(seed);
  const [reloadKey, setReloadKey] = useState(0);

  // Re-sync when the underlying data changes (after save / reorder).
  useEffect(() => {
    setItems(seed.map((p) => ({ ...p })));
  }, [seed, reloadKey]);

  const update = (i: number, patch: Partial<ProjectEditor>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        technologies: "",
        liveUrl: "",
        githubUrl: "",
        shaderMode: "shader",
        customType: "html",
        shaderColors: [],
        shaderParams: { ...DEFAULT_PARAMS },
        customCss: "",
      },
    ]);

  const removeRow = async (i: number) => {
    const it = items[i];
    if (it.id) {
      try {
        await deleteProject({ id: it.id as Doc<"projects">["_id"] });
        toast.success("Project deleted.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed.");
        return;
      }
    }
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const move = async (i: number, dir: "up" | "down") => {
    const it = items[i];
    if (it.id) {
      try {
        await reorderProject({ id: it.id as Doc<"projects">["_id"], direction: dir });
        setReloadKey((k) => k + 1);
        toast.success(dir === "up" ? "Moved up." : "Moved down.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Reorder failed.");
      }
    } else {
      // Unsaved local row — just swap locally.
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= items.length) return;
      setItems((prev) => {
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    }
  };

  const save = async (it: ProjectEditor, i: number) => {
    try {
      await upsertProject({
        id: it.id ? (it.id as Doc<"projects">["_id"]) : undefined,
        name: it.name,
        description: it.description,
        technologies: it.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        liveUrl: it.liveUrl || undefined,
        githubUrl: it.githubUrl || undefined,
        shaderColors:
          it.shaderColors.length === 3 ? it.shaderColors : undefined,
        shaderParams: {
          ...it.shaderParams,
          shape: it.shaderParams.shape as ShaderShape,
        },
        shaderMode: it.shaderMode,
        customType: it.customType,
        customCss: it.customCss,
      });
      toast.success("Project saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  const resetCardToDefault = (i: number) => {
    const defaultColors = WORK_CARD_GRADIENTS[i % WORK_CARD_GRADIENTS.length];
    update(i, {
      shaderMode: "shader",
      shaderColors: [...defaultColors],
      shaderParams: { ...DEFAULT_SHADER_PARAMS },
      customType: "html",
      customCss: "",
    });
    toast.info(`Card ${i + 1} reset to default shader — press Save to apply.`);
  };

  const onCardImage = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const it = items[i];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is larger than 8 MB.");
      return;
    }
    if (!it.id) {
      toast.error("Save the card first, then upload its image.");
      return;
    }
    try {
      const uploadUrl = await createUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      const { storageId } = (await res.json()) as { storageId: string };
      await setProjectImage({ id: it.id as Doc<"projects">["_id"], storageId: storageId as Id<"_storage"> });
      toast.success("Header image set.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const onClearCardImage = async (i: number) => {
    const it = items[i];
    if (!it.id) return;
    try {
      await clearProjectImage({ id: it.id as Doc<"projects">["_id"] });
      toast.success("Header image cleared — reverted to shader.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear image.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} project{items.length === 1 ? "" : "s"} · order top→bottom · changes apply to the live site only after you save each card
        </p>
        <Button type="button" size="sm" variant="outline" className="cursor-pointer gap-2" onClick={addRow}>
          <Plus className="size-4" /> Add project
        </Button>
      </div>

      {items.map((it, i) => (
        <div key={it.id ?? `new-${i}`} className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              #{String(i + 1).padStart(3, "0")}
            </span>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === 0} onClick={() => move(i, "up")} aria-label="Move up">
                <ArrowUp className="size-4" />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === items.length - 1} onClick={() => move(i, "down")} aria-label="Move down">
                <ArrowDown className="size-4" />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => removeRow(i)} aria-label="Delete">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Basic info — full width, above the header-style split */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Name</Label>
              <Input value={it.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Project name" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea value={it.description} onChange={(e) => update(i, { description: e.target.value })} rows={3} placeholder="Short description" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Technologies (comma-separated)</Label>
              <Input value={it.technologies} onChange={(e) => update(i, { technologies: e.target.value })} placeholder="React.js, Prisma, n8n automation" />
            </div>
            <div>
              <Label className="text-xs">Live URL</Label>
              <Input value={it.liveUrl} onChange={(e) => update(i, { liveUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <Label className="text-xs">GitHub URL</Label>
              <Input value={it.githubUrl} onChange={(e) => update(i, { githubUrl: e.target.value })} placeholder="https://github.com/…" />
            </div>
          </div>

          {/* Header style — split: controls on the left, live preview on the right */}
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  #{String(i + 1).padStart(3, "0")} · Header style
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 cursor-pointer gap-1 text-[11px] text-muted-foreground"
                  onClick={() => resetCardToDefault(i)}
                  aria-label="Reset to default shader"
                >
                  <RotateCcw className="size-3.5" /> Default
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["shader", "image", "custom"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={it.shaderMode === mode ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => update(i, { shaderMode: mode })}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Choose how this card's header renders.
              </p>

              {it.shaderMode === "image" ? (
                <div className="mt-4 flex flex-col gap-3">
                  <Label className="text-xs">Header image</Label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:border-primary/40">
                    <Upload className="size-4" />
                    Choose image (max 8 MB)
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onCardImage(i, e)} />
                  </label>
                  <Button type="button" size="sm" variant="ghost" className="cursor-pointer self-start text-destructive hover:text-destructive" onClick={() => onClearCardImage(i)}>
                    Clear image
                  </Button>
                </div>
              ) : it.shaderMode === "custom" ? (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs">Custom source</Label>
                    <div className="flex gap-1.5">
                      {(["html", "react"] as const).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          size="sm"
                          variant={it.customType === t ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => update(i, { customType: t })}
                        >
                          {t === "html" ? "HTML / CSS" : "React (JSX)"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={it.customCss}
                    onChange={(e) => update(i, { customCss: e.target.value })}
                    rows={6}
                    placeholder={
                      it.customType === "react"
                        ? "<div style={{height:'100%',display:'grid',placeItems:'center',color:'white'}}>Hello 👋</div>"
                        : "<div style='height:100%;background:linear-gradient(120deg,#f97316,#ef4444);'></div>"
                    }
                    className="font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {it.customType === "react"
                      ? "Compiled live in-browser via react-live. Imports aren't supported — write a single expression/component using the global React."
                      : "Rendered inside a sandboxed iframe. Use inline styles / a <style> tag."}
                  </p>

                  {/* Live preview + success / failure status */}
                  <CustomPreview source={it.customCss} type={it.customType} />
                </div>
              ) : (
                <div className="mt-4">
                  <ShaderControls
                    title={`Shader · card ${i + 1}`}
                    colors={it.shaderColors.length ? it.shaderColors : WORK_CARD_GRADIENTS[i % WORK_CARD_GRADIENTS.length]}
                    onColorsChange={(next) => update(i, { shaderColors: next })}
                    params={it.shaderParams}
                    onParamsChange={(next) => update(i, { shaderParams: next })}
                  />
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Colors + shape/speed/etc. apply live to this card's header shader.
                  </p>
                </div>
              )}
            </div>

            {/* Live preview — beside the header-style controls */}
            <div className="lg:sticky lg:top-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Live preview
              </p>
              <WorkCardPreview editor={it} index={i} />
            </div>
          </div>

        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={() => save(it, i)}>
            <Send className="size-3.5" /> Save
          </Button>
        </div>
        </div>
      ))}
    </div>
  );
}

// ── Content tab ──────────────────────────────────────────────────────────────────

function ContentTab() {
  const data = useQuery(api.content.getEditable);
  const updateHero = useMutation(api.content.updateHero);
  const updateAvailability = useMutation(api.content.updateAvailability);
  const updateAboutObjective = useMutation(api.content.updateAboutObjective);
  const updateSocials = useMutation(api.content.updateSocials);

  const hero = data?.content.hero ?? staticProfile.hero;
  const availability = data?.content.availability ?? staticProfile.availability;
  const about = data?.content.about ?? staticProfile.about;
  const objective = data?.content.objective ?? staticProfile.objective;
  const socials = data?.content.socials ?? staticProfile.socials;

  const [constant, setConstant] = useState(hero.constant);
  const [rotating, setRotating] = useState(hero.rotating.join("\n"));
  const [availabilityVal, setAvailabilityVal] = useState(availability);
  const [aboutVal, setAboutVal] = useState(about.join("\n"));
  const [objectiveVal, setObjectiveVal] = useState(objective);
  const [socialsVal, setSocialsVal] = useState(
    socials.map((s) => ({ ...s })),
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setConstant(hero.constant);
    setRotating(hero.rotating.join("\n"));
    setAvailabilityVal(availability);
    setAboutVal(about.join("\n"));
    setObjectiveVal(objective);
    setSocialsVal(socials.map((s) => ({ ...s })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reloadKey]);

  const updateSocial = (i: number, patch: { label?: string; href?: string }) =>
    setSocialsVal((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const moveSocial = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= socialsVal.length) return;
    setSocialsVal((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const addSocial = () => setSocialsVal((prev) => [...prev, { label: "", href: "" }]);
  const removeSocial = (i: number) =>
    setSocialsVal((prev) => prev.filter((_, idx) => idx !== i));

  const saveHero = async () => {
    try {
      await updateHero({
        constant,
        rotating: rotating.split("\n").map((w) => w.trim()).filter(Boolean),
      });
      await updateAvailability({ availability: availabilityVal });
      toast.success("Hero & availability saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  const saveAbout = async () => {
    try {
      await updateAboutObjective({
        about: aboutVal.split("\n").map((p) => p.trim()).filter(Boolean),
        objective: objectiveVal,
      });
      toast.success("About & objective saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  const saveSocials = async () => {
    try {
      await updateSocials({
        socials: socialsVal
          .map((s) => ({ label: s.label.trim(), href: s.href.trim() }))
          .filter((s) => s.label && s.href),
      });
      toast.success("Social links saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="Hero">
        <Label className="text-xs">Constant word (before the rotating list)</Label>
        <Input value={constant} onChange={(e) => setConstant(e.target.value)} placeholder="Stay" />
        <Label className="mt-3 text-xs">Rotating words (one per line)</Label>
        <Textarea value={rotating} onChange={(e) => setRotating(e.target.value)} rows={5} placeholder="Consistent&#10;Curious" />
        <Label className="mt-3 text-xs">Availability badge</Label>
        <Input value={availabilityVal} onChange={(e) => setAvailabilityVal(e.target.value)} placeholder="Open to internships & full-time roles" />
        <div className="mt-3 flex flex-col items-end gap-1.5">
          <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={saveHero}>
            <Send className="size-3.5" /> Save hero
          </Button>
          <p className="text-[11px] text-muted-foreground">Changes apply to the live site only after you save.</p>
        </div>
      </Card>

      <Card title="About & Objective">
        <Label className="text-xs">About paragraphs (one per line)</Label>
        <Textarea value={aboutVal} onChange={(e) => setAboutVal(e.target.value)} rows={4} />
        <Label className="mt-3 text-xs">Objective</Label>
        <Textarea value={objectiveVal} onChange={(e) => setObjectiveVal(e.target.value)} rows={4} />
        <div className="mt-3 flex flex-col items-end gap-1.5">
          <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={saveAbout}>
            <Send className="size-3.5" /> Save about
          </Button>
          <p className="text-[11px] text-muted-foreground">Changes apply to the live site only after you save.</p>
        </div>
      </Card>

      <Card title="Social links">
        <div className="flex flex-col gap-2">
          {socialsVal.map((s, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[11px]">Label</Label>
                <Input value={s.label} onChange={(e) => updateSocial(i, { label: e.target.value })} placeholder="GitHub" />
              </div>
              <div className="flex-1">
                <Label className="text-[11px]">URL</Label>
                <Input value={s.href} onChange={(e) => updateSocial(i, { href: e.target.value })} placeholder="https://…" />
              </div>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === 0} onClick={() => moveSocial(i, "up")} aria-label="Move up"><ArrowUp className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === socialsVal.length - 1} onClick={() => moveSocial(i, "down")} aria-label="Move down"><ArrowDown className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => removeSocial(i)} aria-label="Remove"><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">Changes apply to the live site only after you save.</p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="cursor-pointer gap-2" onClick={addSocial}><Plus className="size-4" /> Add link</Button>
            <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={saveSocials}><Send className="size-3.5" /> Save socials</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Experience tab ──────────────────────────────────────────────────────────────

type ExperienceEditor = {
  id?: string;
  role: string;
  company: string;
  companySite: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  technologies: string;
};

function ExperienceTab() {
  const data = useQuery(api.content.getEditable);
  const upsertExperience = useMutation(api.content.upsertExperience);
  const deleteExperience = useMutation(api.content.deleteExperience);
  const reorderExperience = useMutation(api.content.reorderExperience);

  // When the owner hasn't saved any experience rows yet, show the static cards
  // that are already on the site so they can be edited/deleted/added to.
  const liveExperiences = data?.experiences ?? [];
  const seedSource =
    liveExperiences.length > 0
      ? liveExperiences
      : staticExperience.map((e, i) => ({
          id: `static-${i}`,
          role: e.role,
          company: e.company,
          companySite: e.companySite ?? "",
          startDate: e.startDate,
          endDate: e.endDate ?? "",
          current: e.current ?? false,
          description: e.description,
          technologies: e.technologies,
        }));

  const seed: ExperienceEditor[] = seedSource.map((e) => ({
    id: e.id,
    role: e.role,
    company: e.company,
    companySite: e.companySite ?? "",
    startDate: e.startDate,
    endDate: e.endDate ?? "",
    current: e.current ?? false,
    description: e.description.join("\n"),
    technologies: e.technologies.join(", "),
  }));

  const [items, setItems] = useState<ExperienceEditor[]>(seed);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setItems(seed.map((e) => ({ ...e })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reloadKey]);

  const update = (i: number, patch: Partial<ExperienceEditor>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        role: "",
        company: "",
        companySite: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        technologies: "",
      },
    ]);

  const removeRow = async (i: number) => {
    const it = items[i];
    if (it.id) {
      try {
        await deleteExperience({ id: it.id as Doc<"experiences">["_id"] });
        toast.success("Experience deleted.");
        setReloadKey((k) => k + 1);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed.");
      }
    } else {
      setItems((prev) => prev.filter((_, idx) => idx !== i));
    }
  };

  const move = async (i: number, dir: "up" | "down") => {
    const it = items[i];
    if (!it.id) {
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= items.length) return;
      setItems((prev) => {
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
      return;
    }
    try {
      await reorderExperience({ id: it.id as Doc<"experiences">["_id"], direction: dir });
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed.");
    }
  };

  const save = async (it: ExperienceEditor, i: number) => {
    try {
      await upsertExperience({
        id: it.id ? (it.id as Doc<"experiences">["_id"]) : undefined,
        role: it.role,
        company: it.company,
        companySite: it.companySite || undefined,
        startDate: it.startDate,
        endDate: it.current ? undefined : it.endDate || undefined,
        current: it.current,
        description: it.description.split("\n").map((d) => d.trim()).filter(Boolean),
        technologies: it.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Experience saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} entr{items.length === 1 ? "y" : "ies"} · order top→bottom · changes apply to the live site only after you save each entry
        </p>
        <Button type="button" size="sm" variant="outline" className="cursor-pointer gap-2" onClick={addRow}>
          <Plus className="size-4" /> Add entry
        </Button>
      </div>

      {items.map((it, i) => (
        <div key={it.id ?? `new-${i}`} className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">#{String(i + 1).padStart(3, "0")}</span>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === 0} onClick={() => move(i, "up")} aria-label="Move up"><ArrowUp className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === items.length - 1} onClick={() => move(i, "down")} aria-label="Move down"><ArrowDown className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => removeRow(i)} aria-label="Delete"><Trash2 className="size-4" /></Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Role</Label>
              <Input value={it.role} onChange={(e) => update(i, { role: e.target.value })} placeholder="Full-Stack Developer" />
            </div>
            <div>
              <Label className="text-xs">Company</Label>
              <Input value={it.company} onChange={(e) => update(i, { company: e.target.value })} placeholder="Independent Projects" />
            </div>
            <div>
              <Label className="text-xs">Company URL</Label>
              <Input value={it.companySite} onChange={(e) => update(i, { companySite: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <Label className="text-xs">Start date</Label>
              <Input value={it.startDate} onChange={(e) => update(i, { startDate: e.target.value })} placeholder="2023" />
            </div>
            <div>
              <Label className="text-xs">End date</Label>
              <Input value={it.endDate} onChange={(e) => update(i, { endDate: e.target.value })} placeholder="2025 (blank if current)" disabled={it.current} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id={`current-${i}`}
                checked={it.current}
                onChange={(e) => update(i, { current: e.target.checked })}
                className="size-4 rounded border-border"
              />
              <Label htmlFor={`current-${i}`} className="text-xs">Ongoing / current role</Label>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Description (one bullet per line)</Label>
              <Textarea value={it.description} onChange={(e) => update(i, { description: e.target.value })} rows={4} placeholder={"Did X…\nBuilt Y…"} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Technologies (comma-separated)</Label>
              <Input value={it.technologies} onChange={(e) => update(i, { technologies: e.target.value })} placeholder="React.js, Node.js, Python" />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={() => save(it, i)}>
              <Send className="size-3.5" /> Save
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skills tab ───────────────────────────────────────────────────────────────────

type SkillItem = { name: string; icon?: string };
type SkillGroup = { label: string; items: SkillItem[] };

/**
 * A single skill chip — mirrors the brand-logged chips on the public site (uses the
 * same `brandFor` lookup so icons/colors match exactly). `key` is the brand-lookup
 * key (the chosen icon if set, else the skill name), so the preview reflects the
 * owner's selection. Falls back to a plain monochrome chip when no logo is mapped.
 */
function SkillChip({ name, iconKey }: { name: string; iconKey: string }) {
  const brand = brandFor(iconKey);
  // Deterministic, id-safe suffix derived from the key so re-renders don't churn the
  // unique mask id (the public Skills component does the same per index).
  const maskId = `vscode-dash-${iconKey.replace(/[^a-zA-Z0-9]/g, "")}`;
  const rawSvg =
    brand?.type === "raw" ? brand.svg.replace("vscode-mask", maskId) : undefined;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground/90 transition-colors hover:border-primary/40">
      {brand?.type === "svg" ? (
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" style={{ color: `#${brand.hex}` }} fill="currentColor" aria-hidden>
          <path d={brand.path} />
        </svg>
      ) : brand?.type === "fa" ? (
        <FontAwesomeIcon icon={brand.icon} className="size-4 shrink-0" style={{ color: `#${brand.hex}` }} aria-hidden />
      ) : brand?.type === "lucide" ? (
        <brand.Icon className="size-4 shrink-0" style={{ color: `#${brand.hex}` }} aria-hidden />
      ) : rawSvg ? (
        <span className="size-4 shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: rawSvg }} />
      ) : (
        <span className="size-1.5 shrink-0 rounded-full bg-foreground/30" aria-hidden />
      )}
      {name}
    </span>
  );
}

/**
 * Faithful read-only rendering of how the Skills & Stack section looks on the live
 * portfolio site — grouped chips with brand logos, plus the footer note. This is
 * exactly the data the public `Skills` component consumes (live Convex row →
 * fallback to static src/data/portfolio.ts), so the owner sees the real fetched
 * content instead of raw editor inputs.
 */
function SkillsPreview({ groups, note }: { groups: SkillGroup[]; note: string }) {
  if (groups.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No skills saved yet — saving the editor below will populate this view.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              {g.label}
            </span>
            <span className="h-px flex-1 bg-border/60" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {g.items.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {g.items.map((item, j) => (
              <SkillChip
                key={`${g.label}-${j}`}
                name={item.name}
                iconKey={item.icon?.trim() || item.name}
              />
            ))}
          </div>
        </div>
      ))}
      {note ? (
        <p className="border-t border-border/50 pt-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {"// "}
          {note}
        </p>
      ) : null}
    </div>
  );
}

function SkillsTab() {
  const data = useQuery(api.content.getEditable);
  const updateSkills = useMutation(api.content.updateSkills);

  // Resolve the skills exactly like the public site + use-site-content hook:
  // live Convex row when it has groups, otherwise the static skills shipped in
  // src/data/portfolio.ts. This is the "details fetched from the portfolio site".
  const liveGroups = data?.skills?.groups ?? [];
  const liveNote = data?.skills?.note ?? "";
  const liveIntro = data?.skills?.intro ?? null;
  const sourceGroups: SkillGroup[] =
    liveGroups.length > 0
      ? liveGroups.map((g) => ({
          label: g.label,
          items: g.items.map((it) => ({ name: it.name, icon: it.icon })),
        }))
      : staticSkills.groups.map((g) => ({
          label: g.label,
          items: g.items.map((it) => ({ name: it.name, icon: it.icon })),
        }));
  const sourceNote = liveNote || staticSkills.note;

  // Editable copy — seeded from the same source so the owner edits what they
  // actually see, not a blank slate.
  const [groups, setGroups] = useState<SkillGroup[]>(sourceGroups);
  const [note, setNote] = useState(sourceNote);
  const [intro, setIntro] = useState(liveIntro ?? "");
  // Marquee layout (rows / speed / direction). null = use public-site defaults.
  const DEFAULT_MARQUEE = { rows: 2, baseSpeed: 70, alternateDirection: true };
  const liveMarquee = data?.skills?.marquee ?? null;
  const [marquee, setMarquee] = useState<{
    rows: number;
    baseSpeed: number;
    alternateDirection: boolean;
  } | null>(liveMarquee ?? DEFAULT_MARQUEE);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const live = data?.skills?.groups ?? [];
    setGroups(
      live.length > 0
        ? live.map((g) => ({
            label: g.label,
            items: g.items.map((it) => ({ name: it.name, icon: it.icon })),
          }))
        : staticSkills.groups.map((g) => ({
            label: g.label,
            items: g.items.map((it) => ({ name: it.name, icon: it.icon })),
          })),
    );
    setNote(data?.skills?.note || staticSkills.note);
    setIntro(data?.skills?.intro ?? "");
    setMarquee(data?.skills?.marquee ?? DEFAULT_MARQUEE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reloadKey]);

  const updateGroup = (i: number, patch: Partial<SkillGroup>) =>
    setGroups((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  const updateItem = (gi: number, ii: number, patch: Partial<SkillItem>) =>
    setGroups((prev) =>
      prev.map((g, idx) =>
        idx === gi
          ? { ...g, items: g.items.map((it, jdx) => (jdx === ii ? { ...it, ...patch } : it)) }
          : g,
      ),
    );

  const addItem = (i: number) =>
    setGroups((prev) =>
      prev.map((g, idx) => (idx === i ? { ...g, items: [...g.items, { name: "" }] } : g)),
    );
  const removeItem = (gi: number, ii: number) =>
    setGroups((prev) =>
      prev.map((g, idx) =>
        idx === gi ? { ...g, items: g.items.filter((_, jdx) => jdx !== ii) } : g,
      ),
    );

  const addGroup = () => setGroups((prev) => [...prev, { label: "", items: [] }]);
  const removeGroup = (i: number) => setGroups((prev) => prev.filter((_, idx) => idx !== i));

  // Reorder a group within the list (order = array position on save).
  const moveGroup = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= groups.length) return;
    setGroups((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // Reorder a skill within its group (order = array position on save).
  const moveItem = (gi: number, ii: number, dir: "up" | "down") => {
    const j = dir === "up" ? ii - 1 : ii + 1;
    if (j < 0 || j >= groups[gi].items.length) return;
    setGroups((prev) =>
      prev.map((g, idx) => {
        if (idx !== gi) return g;
        const items = [...g.items];
        [items[ii], items[j]] = [items[j], items[ii]];
        return { ...g, items };
      }),
    );
  };

  const save = async () => {
    try {
      await updateSkills({
        groups: groups.map((g) => ({
          label: g.label,
          items: g.items.map((it) => ({ name: it.name, icon: it.icon })),
        })),
        note,
        intro: intro || undefined,
        marquee: marquee
          ? {
              rows: marquee.rows,
              baseSpeed: marquee.baseSpeed,
              alternateDirection: marquee.alternateDirection,
            }
          : undefined,
      });
      toast.success("Skills saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  const totalSkills = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Live-fetched view — exactly what the portfolio site renders */}
      <Card title="Skills & Stack — live view">
        <p className="mb-4 text-[11px] text-muted-foreground">
          Fetched from the same source your public site uses. {totalSkills} skill
          {totalSkills === 1 ? "" : "s"} across {groups.length} group
          {groups.length === 1 ? "" : "s"}.
        </p>
        <SkillsPreview groups={groups} note={note} />
      </Card>

      {/* Intro subtitle — editable, shown under the section header */}
      <Card title="Intro line">
        <p className="mb-3 text-[11px] text-muted-foreground">
          The mono subtitle under the "Skills &amp; Stack" heading. Leave blank to use the
          default copy shown on the live site.
        </p>
        <Label className="text-xs">Intro subtitle</Label>
        <Textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={2}
          placeholder="// Languages, frameworks, databases and tooling I reach for when building."
          className="mt-1 font-mono text-[11px]"
        />
      </Card>

      {/* Editor — same data, editable as labelled groups of chips */}
      <Card title="Edit groups">
        <p className="mb-3 text-[11px] text-muted-foreground">
          Each group becomes one labelled block of chips in the scrolling marquee. Add a
          skill per row and pick its logo from the dropdown (or leave it blank for a plain chip).
        </p>
        <div className="flex flex-col gap-3">
          {groups.map((g, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-[11px]">Group label</Label>
                  <Input value={g.label} onChange={(e) => updateGroup(i, { label: e.target.value })} placeholder="Programming Languages" />
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === 0} onClick={() => moveGroup(i, "up")} aria-label="Move group up"><ArrowUp className="size-4" /></Button>
                  <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === groups.length - 1} onClick={() => moveGroup(i, "down")} aria-label="Move group down"><ArrowDown className="size-4" /></Button>
                  <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => removeGroup(i)} aria-label="Remove group"><Trash2 className="size-4" /></Button>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Label className="text-[11px]">Skills (name + logo)</Label>
                {g.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, j, { name: e.target.value })}
                      placeholder="Skill name (e.g. Docker)"
                      className="flex-1"
                    />
                    <select
                      value={item.icon ?? "none"}
                      onChange={(e) => updateItem(i, j, { icon: e.target.value === "none" ? undefined : e.target.value })}
                      className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-primary/40"
                      aria-label={`Logo for ${item.name || "skill"}`}
                    >
                      <option value="none">No logo</option>
                      {ICON_KEYS.map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={j === 0} onClick={() => moveItem(i, j, "up")} aria-label="Move skill up"><ArrowUp className="size-4" /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={j === g.items.length - 1} onClick={() => moveItem(i, j, "down")} aria-label="Move skill down"><ArrowDown className="size-4" /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => removeItem(i, j)} aria-label="Remove skill"><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" className="mt-1 w-fit cursor-pointer gap-1.5 text-[11px]" onClick={() => addItem(i)}><Plus className="size-3.5" /> Add skill</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button type="button" size="sm" variant="outline" className="cursor-pointer gap-2" onClick={addGroup}><Plus className="size-4" /> Add group</Button>
        </div>
      </Card>

      <Card title="Marquee layout">
        <p className="mb-3 text-[11px] text-muted-foreground">
          Control how the scrolling Skills &amp; Stack rows look on the public site.
          Rows are filled round-robin from your skills, each row scrolls at its own
          speed, and odd rows reverse when "alternate direction" is on.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-[11px]">Rows ({marquee?.rows ?? 2})</Label>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={marquee?.rows ?? 2}
              onChange={(e) => setMarquee((m) => ({ ...(m ?? DEFAULT_MARQUEE), rows: Number(e.target.value) }))}
              className="mt-2 w-full accent-primary"
              aria-label="Number of marquee rows"
            />
          </div>
          <div>
            <Label className="text-[11px]">Speed ({marquee?.baseSpeed ?? 70}s / loop)</Label>
            <input
              type="range"
              min={10}
              max={240}
              step={5}
              value={marquee?.baseSpeed ?? 70}
              onChange={(e) => setMarquee((m) => ({ ...(m ?? DEFAULT_MARQUEE), baseSpeed: Number(e.target.value) }))}
              className="mt-2 w-full accent-primary"
              aria-label="Marquee loop speed"
            />
          </div>
          <div className="flex flex-col justify-center gap-2">
            <Label className="text-[11px]">Direction</Label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={marquee?.alternateDirection ?? true}
                onChange={(e) => setMarquee((m) => ({ ...(m ?? DEFAULT_MARQUEE), alternateDirection: e.target.checked }))}
                className="size-4 rounded border-border accent-primary"
              />
              Alternate direction per row
            </label>
          </div>
        </div>
      </Card>

      <Card title="Footer note">
        <Label className="text-xs">Note shown under the marquee</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Currently exploring realtime apps, AI tooling and computer vision." />
      </Card>

      <div className="flex flex-col items-end gap-1.5">
        <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={save}>
          <Send className="size-3.5" /> Save skills
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Changes apply to the live site only after you save.
        </p>
      </div>
    </div>
  );
}

// ── Terminal tab ──────────────────────────────────────────────────────────────

const BOOT_LINE_TYPES = [
  "system",
  "output",
  "accent",
  "loading",
  "header",
  "input",
  "error",
  "link",
] as const;

type BootLineEditor = { type: string; text: string };

/** Default boot sequence, restored by the "Reset to default" button. */
const DEFAULT_BOOT_LINES: BootLineEditor[] = [
  { type: "system", text: "sahil@portfolio:~$ whoami" },
  { type: "accent", text: "Sahil Shedge — Full-Stack Developer" },
  { type: "system", text: "loading shell environment…" },
  { type: "loading", text: "▚ mounting ~/projects          [ok]" },
  { type: "loading", text: "▚ mounting ~/skills            [ok]" },
  { type: "loading", text: "▚ mounting ~/experience        [ok]" },
  { type: "loading", text: "▚ connecting shader engine     [ok]" },
  { type: "system", text: "ready. type 'help' to explore." },
  { type: "system", text: "tip: try 'ls projects', 'man about' or 'open github'." },
  { type: "output", text: "" },
];

const DEFAULT_PROMPT = "sahil@portfolio:~$";
const DEFAULT_CHIPS = "help, whoami, projects, skills, socials, clear";

/**
 * Default blurb shown for each quick-action chip before its command runs.
 * Used to pre-fill the dashboard editor when nothing has been saved yet, so the
 * owner can edit the description that appears when a visitor types/clicks a chip.
 */
const DEFAULT_COMMAND_DESCRIPTIONS: Record<string, string> = {
  help: "Lists every available command in the portfolio shell.",
  whoami: "Prints who is running this shell — name, handle and role.",
  projects: "Shows the featured projects with links and tech stacks.",
  skills: "Lists the technical skills, grouped by category.",
  socials: "Opens every social link — all clickable.",
  clear: "Clears the terminal output.",
};

/**
 * Live preview of the global background using the real GrainGradient shader (same
 * component the public site uses), so the owner sees exactly how the backdrop will
 * look after saving. Reflects the current (unsaved) colorBack / colors / params,
 * or the uploaded image when in image mode.
 */
function BackgroundPreview({
  mode,
  colorBack,
  colors,
  params,
  imageUrl,
  customType,
  customCss,
}: {
  mode: "shader" | "image" | "custom";
  colorBack: string;
  colors: string[];
  params: {
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
  imageUrl: string | null;
  customType?: "html" | "react";
  customCss?: string;
}) {
  const renderCustom = () => {
    if (!customCss) {
      return (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-muted-foreground">
          (empty — nothing to preview)
        </div>
      );
    }
    if (customType === "react") {
      return (
        <div className="absolute inset-0 h-full w-full">
          <LiveProvider code={customCss} noInline={false}>
            <LivePreview />
            <LiveError className="absolute left-2 right-2 top-2 z-10 rounded bg-destructive px-2 py-1 font-mono text-[10px] text-white" />
          </LiveProvider>
        </div>
      );
    }
    const doc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden;background:transparent;}*{box-sizing:border-box;}</style></head><body>${customCss}</body></html>`;
    return (
      <iframe
        title="Custom background preview"
        srcDoc={doc}
        sandbox=""
        className="absolute inset-0 h-full w-full border-0 bg-transparent"
        aria-hidden
      />
    );
  };

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-border/70 bg-background">
      {mode === "custom" ? (
        renderCustom()
      ) : mode === "image" && imageUrl ? (
        <img
          src={imageUrl}
          alt="Background preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <GrainGradient
          style={{ height: "100%", width: "100%" }}
          colorBack={colorBack || "#000000"}
          softness={params.softness}
          intensity={params.intensity}
          noise={params.noise}
          shape={params.shape as never}
          offsetX={params.offsetX}
          offsetY={params.offsetY}
          scale={params.scale}
          rotation={params.rotation}
          speed={params.speed}
          colors={colors}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3">
        <span className="font-mono text-[11px] text-white/80">
          Live preview · how the backdrop renders on the site
        </span>
      </div>
    </div>
  );
}

// ── Background tab ────────────────────────────────────────────────────────────

function BackgroundTab() {
  const { background, backgroundImageUrl } = useSiteContent();
  const updateBackground = useMutation(api.content.updateBackground);
  const createUploadUrl = useMutation(api.content.createUploadUrl);
  const setBackgroundImage = useMutation(api.content.setBackgroundImage);

  const [mode, setMode] = useState<"shader" | "image" | "custom">(background.mode);
  const [colorBack, setColorBack] = useState(background.colorBack);
  const [colors, setColors] = useState<string[]>(background.colors);
  const [customType, setCustomType] = useState<"html" | "react">(background.customType ?? "html");
  const [customCss, setCustomCss] = useState(background.customCss ?? "");
  const [params, setParams] = useState({
    softness: background.softness,
    intensity: background.intensity,
    noise: background.noise,
    speed: background.speed,
    scale: background.scale,
    rotation: background.rotation,
    offsetX: background.offsetX,
    offsetY: background.offsetY,
    shape: background.shape,
  });
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Re-sync when the underlying data changes (after save).
  useEffect(() => {
    setMode(background.mode);
    setColorBack(background.colorBack);
    setColors(background.colors);
    setCustomType(background.customType ?? "html");
    setCustomCss(background.customCss ?? "");
    setParams({
      softness: background.softness,
      intensity: background.intensity,
      noise: background.noise,
      speed: background.speed,
      scale: background.scale,
      rotation: background.rotation,
      offsetX: background.offsetX,
      offsetY: background.offsetY,
      shape: background.shape,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [background, reloadKey]);

  const saveShader = async () => {
    try {
      await updateBackground({
        background: {
          mode,
          colorBack,
          colors,
          ...params,
          shape: params.shape as ShaderShape,
          ...(mode === "custom"
            ? { customType, customCss }
            : { customType: "html", customCss: "" }),
        },
      });
      toast.success("Background saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  const resetBackgroundToDefault = () => {
    setMode("shader");
    setColorBack("hsl(0, 0%, 0%)");
    setColors(["hsl(193, 85%, 66%)", "hsl(196, 100%, 83%)", "hsl(195, 100%, 50%)"]);
    setParams({
      softness: 0.5,
      intensity: 0.3,
      noise: 0,
      speed: 1,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      shape: "corners",
    });
    setCustomType("html");
    setCustomCss("");
    toast.info("Reset to current default shader — press Save to apply.");
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is larger than 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await createUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      const { storageId } = (await res.json()) as { storageId: string };
      await setBackgroundImage({ storageId: storageId as Id<"_storage"> & string });
      toast.success("Background image set.");
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[11px] text-muted-foreground">
        Changes apply to the live site only after you press Save on a card.
      </p>
      {/* Background mode + live preview side-by-side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Background mode">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "shader" ? "default" : "outline"}
                className="cursor-pointer gap-2"
                onClick={() => setMode("shader")}
              >
                Animated shader
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "image" ? "default" : "outline"}
                className="cursor-pointer gap-2"
                onClick={() => setMode("image")}
              >
                Static image
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "custom" ? "default" : "outline"}
                className="cursor-pointer gap-2"
                onClick={() => setMode("custom")}
              >
                Custom
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 cursor-pointer gap-1.5 text-[11px]"
              onClick={resetBackgroundToDefault}
            >
              <RotateCcw className="size-3.5" /> Default
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use the live shader for the signature animated backdrop, swap in a
            custom image, or write your own HTML/CSS/React background. The Default
            button restores the current default shader.
          </p>
        </Card>

        <div className="lg:sticky lg:top-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Live preview
          </p>
          <BackgroundPreview
            mode={mode}
            colorBack={colorBack}
            colors={colors}
            params={params}
            imageUrl={backgroundImageUrl}
            customType={customType}
            customCss={customCss}
          />
        </div>
      </div>

      {mode === "image" ? (
        <Card title="Background image">
          {backgroundImageUrl ? (
            <img
              src={backgroundImageUrl}
              alt="Current background"
              className="mb-3 h-40 w-full rounded-lg border border-border/70 object-cover"
            />
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">
              No image uploaded yet — the shader is currently showing.
            </p>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm transition-colors hover:border-primary/40">
            <Upload className="size-4" />
            {uploading ? "Uploading…" : "Choose image (max 8 MB)"}
            <input type="file" accept="image/*" className="hidden" onChange={onImage} disabled={uploading} />
          </label>
        </Card>
      ) : mode === "custom" ? (
        <Card title="Custom background">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs">Custom source</Label>
            <div className="flex gap-1.5">
              {(["html", "react"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={customType === t ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setCustomType(t)}
                >
                  {t === "html" ? "HTML / CSS" : "React (JSX)"}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            rows={6}
            placeholder={
              customType === "react"
                ? "<div style={{height:'100%',display:'grid',placeItems:'center',color:'white',fontFamily:'sans-serif'}}>Custom background 👋</div>"
                : "<div style='height:100%;background:radial-gradient(circle at 30% 20%, #0ea5e9, #1e1b4b);'></div>"
            }
            className="mt-3 font-mono text-[11px]"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {customType === "react"
              ? "Compiled live in-browser via react-live. Imports aren't supported — write a single expression/component using the global React."
              : "Rendered inside a sandboxed iframe. Use inline styles / a <style> tag."}
          </p>
          <div className="mt-4 flex justify-end">
            <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={saveShader}>
              <Send className="size-3.5" /> Save background
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Shader base">
            <Label className="text-xs">Background color (colorBack)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#?[0-9A-Fa-f]{3,8}$/.test(colorBack) ? (colorBack.startsWith("#") ? colorBack : `#${colorBack}`) : "#000000"}
                onChange={(e) => setColorBack(e.target.value)}
                aria-label="Background color"
                className="size-9 cursor-pointer rounded-md border border-border/70 bg-transparent p-0.5"
              />
              <Input value={colorBack} onChange={(e) => setColorBack(e.target.value)} className="h-9 flex-1 font-mono text-[11px]" spellCheck={false} />
            </div>
          </Card>

          <Card title="Shader parameters">
            <ShaderControls
              title="Grain Gradient shader"
              colors={colors}
              onColorsChange={setColors}
              params={params}
              onParamsChange={setParams}
            />
            <div className="mt-4 flex justify-end">
              <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={saveShader}>
                <Send className="size-3.5" /> Save background
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function TerminalTab() {
  const { terminal } = useSiteContent();
  const updateTerminal = useMutation(api.content.updateTerminal);

  // Seed from the live (saved) terminal, but fall back to the content already
  // shown on the site when nothing has been saved yet — so the dashboard reflects
  // what visitors currently see and can be edited from there.
  const [prompt, setPrompt] = useState(terminal.prompt || DEFAULT_PROMPT);
  const [bootLines, setBootLines] = useState<BootLineEditor[]>(
    terminal.bootLines.length ? terminal.bootLines : DEFAULT_BOOT_LINES.map((l) => ({ ...l })),
  );
  const [commands, setCommands] = useState(
    terminal.defaultCommands.length ? terminal.defaultCommands.join(", ") : DEFAULT_CHIPS,
  );
  // Per-chip description map (chip → text shown when run). Falls back to the
  // default blurbs for any chip not yet customized.
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    terminal.commandDescriptions ?? {},
  );
  // Custom command → output lines[]. When a command has an entry here, the public
  // terminal shows these lines instead of its built-in logic.
  const [responses, setResponses] = useState<Record<string, string[]>>(
    terminal.commandResponses ?? {},
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setPrompt(terminal.prompt || DEFAULT_PROMPT);
    setBootLines(terminal.bootLines.length ? terminal.bootLines : DEFAULT_BOOT_LINES.map((l) => ({ ...l })));
    setCommands(terminal.defaultCommands.length ? terminal.defaultCommands.join(", ") : DEFAULT_CHIPS);
    setDescriptions(terminal.commandDescriptions ?? {});
    setResponses(terminal.commandResponses ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminal, reloadKey]);

  // The chips the editor shows — derived from the comma-separated text, each
  // pre-filled with its description (default when not yet customized).
  const chipList = (commands ? commands.split(",").map((c) => c.trim()).filter(Boolean) : []);
  const descFor = (chip: string) =>
    descriptions[chip] ?? DEFAULT_COMMAND_DESCRIPTIONS[chip] ?? "";
  const setDescFor = (chip: string, text: string) =>
    setDescriptions((prev) => ({ ...prev, [chip]: text }));

  // Custom command → output lines. Each command (from the chip list) can have its
  // own answer; when set, the public terminal shows these lines instead of its
  // built-in logic. Only commands with non-empty entries are kept on save.
  const respFor = (cmd: string): string =>
    (responses[cmd] ?? []).join("\n");
  const setRespFor = (cmd: string, text: string) =>
    setResponses((prev) => {
      const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
      if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
        const { [cmd]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cmd]: lines };
    });

  const updateLine = (i: number, patch: Partial<BootLineEditor>) =>
    setBootLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setBootLines((prev) => [...prev, { type: "output", text: "" }]);
  const removeLine = (i: number) =>
    setBootLines((prev) => prev.filter((_, idx) => idx !== i));
  const moveLine = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= bootLines.length) return;
    setBootLines((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    try {
      await updateTerminal({
        prompt,
        bootLines: bootLines
          .map((l) => ({ type: l.type, text: l.text }))
          .filter((l) => l.text.trim().length > 0 || l.type === "output"),
        defaultCommands: commands
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        commandDescriptions: descriptions,
        commandResponses: responses,
      });
      toast.success("Terminal content saved.");
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="Terminal settings">
        <Label className="text-xs">Prompt label</Label>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="sahil@portfolio:~$" />
        <Label className="mt-3 text-xs">Quick-action chips (comma-separated)</Label>
        <Input value={commands} onChange={(e) => setCommands(e.target.value)} placeholder="help, whoami, projects, skills, socials, clear" />
        <p className="text-[11px] text-muted-foreground">
          These are the clickable shortcut buttons shown under the terminal input.
          Edit each chip's description below — it shows when that chip is typed or clicked.
        </p>
      </Card>

      <Card title="Chip descriptions">
        <div className="flex flex-col gap-3">
          {chipList.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Add chips above (comma-separated) to set a description for each.
            </p>
          ) : (
            chipList.map((chip) => (
              <div key={chip} className="flex flex-col gap-1.5">
                <Label className="text-[11px]">
                  <span className="font-mono text-foreground">{chip}</span>
                </Label>
                <Textarea
                  value={descFor(chip)}
                  onChange={(e) => setDescFor(chip, e.target.value)}
                  rows={2}
                  placeholder="Description shown when this chip runs…"
                  className="font-mono text-[11px]"
                />
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Custom command responses (optional override)">
        <p className="mb-3 text-[11px] text-muted-foreground">
          Set a custom answer for any command. When a command has an entry here, the
          terminal shows these exact lines <span className="font-mono">instead of</span> its
          built-in output — so you can fully rewrite <span className="font-mono">whoami</span>,
          <span className="font-mono">projects</span>, <span className="font-mono">skills</span>, etc.
          Leave a command blank to keep its live, data-driven default. One line per row.
        </p>
        <div className="flex flex-col gap-3">
          {chipList.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Add chips above (comma-separated) to set a custom response for each.
            </p>
          ) : (
            chipList.map((chip) => (
              <div key={chip} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <Label className="text-[11px]">
                  <span className="font-mono text-foreground">{chip}</span>
                </Label>
                <Textarea
                  value={respFor(chip)}
                  onChange={(e) => setRespFor(chip, e.target.value)}
                  rows={3}
                  placeholder={`Custom lines for '${chip}' — one per row. Blank = use built-in output.`}
                  className="mt-1 font-mono text-[11px]"
                />
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Boot text (shown while the terminal wakes up)">
        <p className="mb-2 text-[11px] text-muted-foreground">
          Each line has a <span className="font-mono">type</span> that controls its color (system / output / accent / loading / header / input / error / link).
        </p>
        <div className="flex flex-col gap-2">
          {bootLines.map((line, i) => (
            <div key={i} className="flex items-end gap-2">
              <select
                value={line.type}
                onChange={(e) => updateLine(i, { type: e.target.value })}
                className="h-9 rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-primary/40"
              >
                {BOOT_LINE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="flex-1">
                <Input
                  value={line.text}
                  onChange={(e) => updateLine(i, { text: e.target.value })}
                  placeholder="Boot line text"
                />
              </div>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === 0} onClick={() => moveLine(i, "up")} aria-label="Move up"><ArrowUp className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" disabled={i === bootLines.length - 1} onClick={() => moveLine(i, "down")} aria-label="Move down"><ArrowDown className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => removeLine(i)} aria-label="Remove"><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">Changes apply to the live site only after you save.</p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="cursor-pointer gap-2" onClick={addLine}><Plus className="size-4" /> Add line</Button>
            <Button type="button" size="sm" variant="ghost" className="cursor-pointer gap-2" onClick={() => { setPrompt(DEFAULT_PROMPT); setBootLines(DEFAULT_BOOT_LINES.map((l) => ({ ...l }))); setCommands(DEFAULT_CHIPS); setDescriptions({}); setResponses({}); toast.info("Reset to defaults — press Save to apply."); }}><RotateCcw className="size-3.5" /> Reset</Button>
            <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={save}><Send className="size-3.5" /> Save terminal</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="mb-3 text-base font-bold tracking-tight">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/**
 * Live preview of a card's custom header source, shown inline in the dashboard so
 * the owner gets instant pass/fail feedback before saving. For React snippets we
 * compile with react-live and surface its error (or a success note); for HTML/CSS
 * we render inside a sandboxed iframe. Empty source shows a neutral hint.
 */
function CustomPreview({ source, type }: { source: string; type: "html" | "react" }) {
  if (!source.trim()) {
    return (
      <p className="text-[11px] text-muted-foreground/70">
        Start typing above to preview your custom header.
      </p>
    );
  }

  if (type === "react") {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-24 overflow-hidden rounded-lg border border-border/70 bg-card">
          <LiveProvider code={source} noInline={false}>
            <LivePreview />
            <LiveError className="hidden" />
          </LiveProvider>
        </div>
        <StatusBanner source={source} type={type} />
      </div>
    );
  }

  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden;font-family:inherit;}*{box-sizing:border-box;}</style></head><body>${source}</body></html>`;
  return (
    <div className="flex flex-col gap-2">
      <iframe
        title="Custom header preview"
        srcDoc={doc}
        sandbox=""
        className="h-24 w-full rounded-lg border border-border/70 bg-card"
      />
      <StatusBanner source={source} type={type} />
    </div>
  );
}

/**
 * Compiles the snippet with react-live purely to detect an error, then renders a
 * success/failure banner. `LiveError` only renders its children when there's a
 * compile/runtime error, so we co-opt it to flip the status.
 */
function StatusBanner({ source, type }: { source: string; type: "html" | "react" }) {
  if (type === "html") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-500">
        ✓ Applied successfully
      </span>
    );
  }
  return (
    <LiveProvider code={source} noInline={false}>
      <LivePreview className="hidden" />
      <LiveError className="text-[11px] font-mono text-destructive" />
      <LiveSuccess />
    </LiveProvider>
  );
}

/** Shows the success line only when <LiveError> has nothing to show. */
function LiveSuccess() {
  const ctx = useContext(LiveContext);
  const error = (ctx as { error?: string | null } | null)?.error;
  if (error) {
    return (
      <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[11px] text-destructive">
        ✗ Failed: {error}
      </span>
    );
  }
  return (
    <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-500">
      ✓ Applied successfully
    </span>
  );
}

// ── Resume tab ───────────────────────────────────────────────────────────────────

function ResumeTab() {
  const data = useQuery(api.content.getEditable);
  const createUploadUrl = useMutation(api.content.createUploadUrl);
  const setResume = useMutation(api.content.setResume);
  const resetResume = useMutation(api.content.resetResume);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Metadata for the most recently uploaded file (name + size), shown until the
  // query refreshes. Cleared on reset.
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [resetting, setResetting] = useState(false);

  const resumeUrl = data?.content.resumeUrl ?? staticProfile.resumeHref;
  const hasCustom = Boolean(data?.content.resumeUrl);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const upload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF resumes are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is larger than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await createUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      const { storageId } = (await res.json()) as { storageId: string };
      await setResume({ storageId: storageId as Doc<"siteContent">["resumeStorageId"] & string });
      setMeta({ name: file.name, size: file.size });
      toast.success("Resume updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await upload(file);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetResume();
      setMeta(null);
      toast.success("Reset to default /public/resume.pdf.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight">Resume</h3>
        <span className="rounded-full border border-border/70 bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {hasCustom ? "custom upload" : "default /public/resume.pdf"}
        </span>
      </div>

      {/* Upload controls (left) + scrollable preview (right) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) upload(file);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center text-sm transition-colors",
              dragOver
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40",
            )}
          >
            <Upload className="size-5" />
            {uploading ? "Uploading…" : "Click to choose a PDF, or drop it here"}
            <input type="file" accept="application/pdf" className="hidden" onChange={onFile} disabled={uploading} />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Open full size ↗
            </a>
            {meta ? (
              <span className="text-xs text-muted-foreground">
                {meta.name} · {formatSize(meta.size)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                PDF · max 5 MB · replaces the file linked in the navbar &amp; hero
              </span>
            )}
          </div>

          {hasCustom ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2 self-start"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Reset to default resume
            </Button>
          ) : null}
        </div>

        {/* Live preview — tall, independently scrollable so the PDF reads naturally */}
        <div className="overflow-hidden rounded-lg border border-border/70 bg-background">
          <iframe
            src={`${resumeUrl}#toolbar=0&view=FitH`}
            title="Resume preview"
            className="h-80 w-full lg:h-[36rem]"
          />
        </div>
      </div>
    </div>
  );
}

// ── Shell ───────────────────────────────────────────────────────────────────────

function DashboardShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme: dashTheme, toggle: toggleDashTheme } = useScopedTheme();
  // Remember the active tab across hard reloads so refreshing the dashboard
  // doesn't bounce the owner back to the Inbox. Falls back to "inbox" if the
  // stored value isn't a known tab.
  const [tab, setTab] = useState<Tab>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("dashboard-tab") : null;
    const valid: Tab[] = ["inbox", "work", "content", "experience", "skills", "terminal", "background", "resume"];
    return saved && valid.includes(saved as Tab) ? (saved as Tab) : "inbox";
  });
  const selectTab = (t: Tab) => {
    setTab(t);
    if (typeof window !== "undefined") window.localStorage.setItem("dashboard-tab", t);
  };
  const messages = useQuery(api.messages.listMessages);
  const deleteMessages = useMutation(api.messages.deleteMessages);
  const markMessages = useMutation(api.messages.markMessages);
  const emailStatus = useQuery(api.messages.emailStatus);
  // Bulk-select state for the inbox (checkboxes + bulk actions).
  const [selectedIds, setSelectedIds] = useState<Set<Id<"contactMessages">>>(
    new Set(),
  );
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeletingSelected(true);
    try {
      const count = await deleteMessages({
        ids: Array.from(selectedIds),
      });
      setSelectedIds(new Set());
      toast.success(
        count === 1 ? "1 message deleted." : `${count} messages deleted.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeletingSelected(false);
    }
  };

  const handleMarkSelected = async (read: boolean) => {
    if (selectedIds.size === 0) return;
    setMarking(true);
    try {
      const count = await markMessages({ ids: Array.from(selectedIds), read });
      setSelectedIds(new Set());
      toast.success(
        read
          ? count === 1 ? "1 message marked read." : `${count} messages marked read.`
          : count === 1 ? "1 message marked unread." : `${count} messages marked unread.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setMarking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const unreadCount =
    messages === null || messages === undefined
      ? 0
      : messages.filter((m) => !m.read).length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "inbox", label: "Inbox" },
    { id: "work", label: "Work" },
    { id: "content", label: "Content" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "terminal", label: "Terminal" },
    { id: "background", label: "Background" },
    { id: "resume", label: "Resume" },
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Owner workspace — only you can see this
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            {user?.email ? (
              <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 self-start">
            <Button type="button" variant="outline" size="icon-sm" className="cursor-pointer" aria-label={dashTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleDashTheme}>
              {dashTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button type="button" variant="outline" className="cursor-pointer gap-2" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Tab bar — wraps on small screens; buttons never shrink so labels stay readable */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full px-4 py-2 font-mono text-xs transition-all duration-200",
                tab === t.id
                  ? "border border-primary/30 bg-primary/10 text-primary"
                  : "border border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.id === "inbox" && unreadCount > 0 ? (
                <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{unreadCount}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Not the owner (guest / signed out / wrong email) */}
        {messages === null ? (
          <div className="rounded-xl border border-border/70 bg-card p-6 text-sm leading-relaxed text-muted-foreground">
            This workspace is locked. Sign in with the owner email (choose the
            <span className="text-foreground"> email code </span> option on the auth page — guest accounts can&apos;t read messages).
          </div>
        ) : (
          <section className="rounded-xl border border-border/70 bg-card shadow-none p-5">
            {tab === "inbox" ? (
              <>
                <InboxHeader
                  total={messages?.length ?? 0}
                  unreadCount={unreadCount}
                  selectedCount={selectedIds.size}
                  onSelectAll={() => setSelectedIds(new Set(messages!.map((m) => m._id)))}
                  onClearSelection={() => setSelectedIds(new Set())}
                  onDeleteSelected={handleDeleteSelected}
                  onMarkRead={() => handleMarkSelected(true)}
                  onMarkUnread={() => handleMarkSelected(false)}
                  deleting={deletingSelected}
                  marking={marking}
                />
                <ResendChecklist status={emailStatus} />
                <div className="pt-2">
                  {messages === undefined ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-6 text-sm text-muted-foreground">No messages yet — share your portfolio and this inbox will fill up in real time.</p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {messages.map((msg) => (
                        <MessageThread
                          key={msg._id}
                          msg={msg}
                          selected={selectedIds.has(msg._id)}
                          onToggleSelect={(next) =>
                            setSelectedIds((prev) => {
                              const copy = new Set(prev);
                              if (next) copy.add(msg._id);
                              else copy.delete(msg._id);
                              return copy;
                            })
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : tab === "work" ? (
              <WorkTab />
            ) : tab === "content" ? (
              <ContentTab />
            ) : tab === "experience" ? (
              <ExperienceTab />
            ) : tab === "skills" ? (
              <SkillsTab />
            ) : tab === "terminal" ? (
              <TerminalTab />
            ) : tab === "background" ? (
              <BackgroundTab />
            ) : (
              <ResumeTab />
            )}
          </section>
        )}
      </div>
      </main>
  );
}

export default function Dashboard() {
  return (
    <ThemeScopeProvider storageKey="portfolio-dashboard-theme" defaultTheme="dark">
      <DashboardShell />
      <Toaster />
    </ThemeScopeProvider>
  );
}
