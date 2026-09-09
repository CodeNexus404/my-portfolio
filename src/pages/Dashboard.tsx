import { useAction, useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MailOpen,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** One expandable message thread with an inline reply composer. */
function MessageThread({ msg }: { msg: Doc<"contactMessages"> }) {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const markAsRead = useMutation(api.messages.markAsRead);
  const replyToMessage = useAction(api.sendReply.replyToMessage);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Opening an unread message clears it server-side (owner-only mutation).
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
      {/* Row header — always visible */}
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
              "truncate text-sm tracking-tight",
              msg.read
                ? "text-foreground/80"
                : "font-semibold text-foreground",
            )}
          >
            {msg.name}
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

      {open ? (
        <div className="mt-3 flex flex-col gap-4 border-l-2 border-border/60 pl-4 sm:pl-5">
          {/* Visitor email */}
          <a
            href={`mailto:${msg.email}`}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Mail className="size-3" />
            {msg.email}
          </a>

          {/* Their message */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {msg.message}
          </p>

          {/* Previous reply */}
          {msg.reply ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                You replied ·{" "}
                {msg.repliedAt ? formatDate(msg.repliedAt) : ""}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {msg.reply}
              </p>
            </div>
          ) : null}

          {/* Reply composer */}
          <div className="flex flex-col gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${msg.name}…`}
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 disabled:opacity-60"
              disabled={sending}
            />
            <div className="flex items-center justify-between gap-2">
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
      ) : null}
    </li>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const messages = useQuery(api.messages.listMessages);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const unreadCount =
    messages === null || messages === undefined
      ? 0
      : messages.filter((m) => !m.read).length;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Owner workspace — only you can see this
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Contact inbox
              {unreadCount > 0 ? (
                <span className="ml-3 inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 align-middle font-mono text-sm font-semibold text-primary">
                  {unreadCount} new
                </span>
              ) : null}
            </h1>
            {user?.email ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as {user.email}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer gap-2 self-start"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </header>

        {/* Not the owner (guest / signed out / wrong email) */}
        {messages === null ? (
          <div className="rounded-xl border border-border/70 bg-card p-6 text-sm leading-relaxed text-muted-foreground">
            This inbox is locked. Sign in with the owner email (choose the
            <span className="text-foreground"> email code </span> option on the
            auth page — guest accounts can&apos;t read messages).
          </div>
        ) : (
          /* Message list */
          <section className="rounded-xl border border-border/70 bg-card shadow-none">
            <header className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Inbox className="size-4.5" />
              </div>
              <h2 className="text-base font-bold tracking-tight">Messages</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                latest 50 · live
              </span>
            </header>

            <div className="px-5 pb-2">
              {messages === undefined ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No messages yet — share your portfolio and this inbox will
                  fill up in real time.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {messages.map((msg) => (
                    <MessageThread key={msg._id} msg={msg} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
