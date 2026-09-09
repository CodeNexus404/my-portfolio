import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Download,
  FileText,
  Github,
  Home,
  Mail,
  Twitter,
  UserRound,
  Wrench,
  Briefcase,
  FolderGit2,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner";
import { profile } from "@/data/portfolio";

/**
 * Developer-style command palette — ⌘K / Ctrl+K anywhere on the landing page.
 * Jump to sections, copy the email, download the resume or open socials.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Register ⌘K / Ctrl+K globally
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (hash: string) => {
    setOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/" + hash);
    } else {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      toast.success("Email copied to clipboard", {
        description: profile.email,
      });
      setTimeout(() => setCopied(false), 1600);
      setOpen(false);
    } catch {
      toast.error("Couldn't copy — email is " + profile.email);
    }
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList className="max-h-full">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Sections">
            <CommandItem onSelect={() => go("#top")}>
              <Home /> Hero
            </CommandItem>
            <CommandItem onSelect={() => go("#about")}>
              <UserRound /> About
            </CommandItem>
            <CommandItem onSelect={() => go("#skills")}>
              <Wrench /> Skills
            </CommandItem>
            <CommandItem onSelect={() => go("#experience")}>
              <Briefcase /> Experience
            </CommandItem>
            <CommandItem onSelect={() => go("#work")}>
              <FolderGit2 /> Projects
            </CommandItem>
            <CommandItem onSelect={() => go("#contact")}>
              <MessageSquare /> Contact
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem onSelect={copyEmail}>
              {copied ? <Check className="text-accent" /> : <Copy />}
              Copy email
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {profile.email}
              </span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                window.open(profile.resumeHref, "_blank");
              }}
            >
              <Download />
              Download resume
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                PDF
              </span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Links">
            {profile.socials.map((s) => {
              const Icon =
                s.label === "GitHub"
                  ? Github
                  : s.label === "LinkedIn"
                    ? FileText
                    : s.label.startsWith("X")
                      ? Twitter
                      : Mail;
              return (
                <CommandItem
                  key={s.label}
                  onSelect={() => {
                    setOpen(false);
                    window.open(s.href, "_blank", "noopener,noreferrer");
                  }}
                >
                  <Icon />
                  {s.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
