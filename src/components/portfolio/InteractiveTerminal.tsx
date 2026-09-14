"use client";

import { useEffect, useRef, useState } from "react";
import { profile, selectedWorks, skills, experience, codeQuotes } from "@/data/portfolio";
import { useSiteContent } from "@/hooks/use-site-content";
import { useScopedTheme } from "@/theme/theme";
import { cn } from "@/lib/utils";

type TerminalLine = {
  type: "input" | "output" | "error" | "system" | "header" | "accent" | "loading" | "link";
  text: string;
};

const FALLBACK_PROMPT = `sahil@portfolio:~$`;

/** Static fallback boot lines — used until the owner edits them in the dashboard. */
const FALLBACK_BOOT_LINES: TerminalLine[] = [
  { type: "system", text: `sahil@portfolio:~$ whoami` },
  { type: "accent", text: `${profile.name} — ${profile.role}` },
  { type: "system", text: "loading shell environment…" },
  { type: "loading", text: "▚ mounting ~/projects          [ok]" },
  { type: "loading", text: "▚ mounting ~/skills            [ok]" },
  { type: "loading", text: "▚ mounting ~/experience        [ok]" },
  { type: "loading", text: "▚ connecting shader engine     [ok]" },
  { type: "system", text: "ready. type 'help' to explore." },
  { type: "system", text: "tip: try 'ls projects', 'man about' or 'open github'." },
  { type: "output", text: "" },
];

const FALLBACK_COMMANDS = ["help", "whoami", "projects", "skills", "socials", "clear"];

type ManEntry = { usage: string; desc: string };

/** Canonical command → man-page entry. Aliases resolve onto these keys. */
const COMMANDS: Record<string, ManEntry> = {
  help: { usage: "help", desc: "List every available command" },
  whoami: { usage: "whoami", desc: "Who is running this shell" },
  biodata: { usage: "biodata", desc: "Full profile at a glance — name, handle, contact, motto" },
  about: { usage: "about", desc: "Bio, education history & stats" },
  objective: { usage: "objective", desc: "My résumé objective / what I'm seeking" },
  education: { usage: "education", desc: "Academic history: B.Tech → HSC → SSC" },
  skills: { usage: "skills", desc: "Technical skill set, grouped" },
  stack: { usage: "stack", desc: "Languages, frameworks & tools I build with" },
  experience: { usage: "experience", desc: "Work & education timeline in depth" },
  projects: { usage: "projects [name]", desc: "Featured projects — add a name for full detail" },
  opensource: { usage: "opensource", desc: "Open-source work & self-learning record" },
  now: { usage: "now", desc: "What I'm currently doing, building & exploring" },
  contact: { usage: "contact", desc: "How to reach me" },
  email: { usage: "email", desc: "Compose an email (opens your mail client)" },
  socials: { usage: "socials", desc: "Every social link — all clickable" },
  resume: { usage: "resume", desc: "Open my résumé in a new tab" },
  open: { usage: "open <target>", desc: "Open a project or profile: github, linkedin, x, email, resume, <project> or a URL" },
  git: { usage: "git", desc: "Open my GitHub profile" },
  banner: { usage: "banner", desc: "Render the portfolio banner" },
  neofetch: { usage: "neofetch", desc: "System info, dev style" },
  ls: { usage: "ls [projects|skills|socials]", desc: "Browse ~/ — dirs: projects, skills, socials" },
  man: { usage: "man <command>", desc: "Show the manual page for a command" },
  history: { usage: "history", desc: "Show your command history" },
  quote: { usage: "quote", desc: "Random developer wisdom" },
  uptime: { usage: "uptime", desc: "Session info & stats" },
  date: { usage: "date", desc: "Current date & time (IST)" },
  matrix: { usage: "matrix", desc: "Follow the white rabbit" },
  ascii: { usage: "ascii", desc: "ASCII art" },
  echo: { usage: "echo <msg>", desc: "Print a message" },
  sudo: { usage: "sudo <anything>", desc: "Elevate privileges (spoiler: you can't)" },
  theme: { usage: "theme [light|dark]", desc: "Toggle or set the site color theme" },
  say: { usage: "say <msg>", desc: "Echo a message with an accent highlight" },
  coffee: { usage: "coffee", desc: "Take a well-deserved break ☕" },
  fortune: { usage: "fortune", desc: "A random slice of developer wisdom" },
  clear: { usage: "clear", desc: "Clear the terminal" },
};

/** Aliases map onto a canonical command. */
const ALIASES: Record<string, string> = {
  "?": "help",
  commands: "help",
  bio: "biodata",
  info: "biodata",
  whois: "biodata",
  mission: "objective",
  edu: "education",
  exp: "experience",
  work: "projects",
  oss: "opensource",
  cv: "resume",
  github: "git",
  gh: "git",
};

const HELP_SECTIONS: { heading: string; names: string[] }[] = [
  {
    heading: "INFORMATION",
    names: [
      "help", "whoami", "biodata", "about", "objective", "education",
      "skills", "stack", "experience", "projects", "opensource", "now",
    ],
  },
  {
    heading: "CONNECT",
    names: ["contact", "email", "socials", "resume", "open", "git"],
  },
  {
    heading: "SHELL",
    names: [
      "banner", "neofetch", "ls", "man", "history", "quote",
      "uptime", "date", "matrix", "ascii", "echo", "sudo", "clear",
    ],
  },
];

/** Rows for 'help', derived from the sections + man entries. */
const HELP_LINES: TerminalLine[] = [
  { type: "header", text: "AVAILABLE COMMANDS" },
  { type: "output", text: "" },
  ...HELP_SECTIONS.flatMap((section): TerminalLine[] => [
    { type: "accent", text: section.heading },
    ...section.names.map((name): TerminalLine => {
      const entry = COMMANDS[name];
      return {
        type: "output",
        text: `  ${name.padEnd(14)}${entry?.desc ?? ""}`,
      };
    }),
    { type: "output", text: "" },
  ]),
  { type: "system", text: "↑/↓ history · Tab completes · 'man <cmd>' for details · 'sudo' for drama" },
];

/** Every command name + alias, for first-word Tab completion. */
const COMMAND_NAMES: Record<string, true> = Object.fromEntries(
  [...Object.keys(COMMANDS), ...Object.keys(ALIASES)].map((name) => [name, true as const]),
);

const MATRIX_CHARS = "アイウエオカキクケコサシスセソ0123456789ABCDEFｱｲｳｴｵ<>[]{}=+*";

/** 5-wide × 7-tall block letters ('.' = blank, replaced at build time). */
const FONT: Record<string, string[]> = {
  S: [".####", "#....", "#....", ".####", "....#", "....#", ".####"],
  A: ["..#..", ".#.#.", "#...#", "#####", "#...#", "#...#", "#...#"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  O: [".####", "#...#", "#...#", "#...#", "#...#", "#...#", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  N: ["#...#", "##..#", "#.#.#", "#..#.#", "#...##", "#...#", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".####"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
};

/** Render a word as block letters, one string per row. */
function blockBanner(word: string): string[] {
  const letters = [...word.toUpperCase()].map((ch) => FONT[ch] ?? Array(7).fill("....."));
  const rows: string[] = [];
  for (let r = 0; r < 7; r++) {
    const row = letters.map((ls) => ls[r] ?? ".....").join("  ");
    rows.push(row.replace(/\./g, " ").replace(/\s+$/, ""));
  }
  return rows;
}

/** GitHub / LinkedIn / X hrefs pulled from the profile data. */
function socialHref(labelPart: string): string | undefined {
  const social = profile.socials.find(
    (s) => s.label.toLowerCase().includes(labelPart) || labelPart.startsWith(s.label.toLowerCase().slice(0, 2)),
  );
  return social?.href;
}

function githubHref(): string | undefined {
  return socialHref("github") ?? "https://github.com/CodeNexus404";
}

/** Resolve an 'open <target>' argument to a URL, or null if unknown. */
function openUrlFor(target: string): string | null {
  const t = target.trim().toLowerCase();
  if (/^https?:\/\/\S+$/.test(target.trim())) return target.trim();
  if (t === "resume" || t === "cv") return profile.resumeHref;
  if (t === "github" || t === "gh") return githubHref() ?? null;
  if (t === "linkedin" || t === "li" || t === "in") return socialHref("linked") ?? null;
  if (t === "x" || t === "twitter") return socialHref("x") ?? null;
  if (t === "email" || t === "mail") return `mailto:${profile.email}`;
  const project = selectedWorks.find(
    (p) => p.id === t || p.name.toLowerCase().includes(t) || t.includes(p.name.toLowerCase()),
  );
  if (project) return project.links.live ?? project.links.github ?? null;
  return null;
}

function openTargetsList(): string {
  const slugs = selectedWorks.map((p) => p.id);
  return `Targets: ${slugs.join(" · ")} · github · linkedin · x · email · resume · <https url>`;
}

/** Extract a trailing linkable URL from a link line, if present. */
function splitUrl(text: string): { label: string; url: string } | null {
  const parts = text.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (!/^(?:https?:\/\/|mailto:)\S+$/.test(last)) return null;
  const idx = text.lastIndexOf(last);
  return { label: text.slice(0, idx), url: last };
}

/** Render text with any embedded http(s)/mailto URLs as clickable anchors.
 *  Used so repo URLs shown by `projects`/`open`/`contact` etc. are live. */
const URL_RE = /(https?:\/\/[^\s]+|mailto:[^\s]+)/g;
function linkify(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  let key = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a
        key={key++}
        href={m[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {m[0]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function InteractiveTerminal({ className }: { className?: string }) {
  const { terminal } = useSiteContent();
  const { theme, toggle: toggleTheme } = useScopedTheme();
  // Live, owner-edited terminal content — falls back to the static defaults
  // until the owner edits them in the dashboard's Terminal tab. Re-read on every
  // render so a dashboard edit that reaches this client (hot reload / re-query)
  // shows up without a full page refresh.
  const livePrompt = terminal.prompt || FALLBACK_PROMPT;
  const BOOT_LINES: TerminalLine[] =
    terminal.bootLines.length > 0
      ? terminal.bootLines.map((l) => ({ type: l.type as TerminalLine["type"], text: l.text }))
      : FALLBACK_BOOT_LINES;
  const QUICK_COMMANDS =
    terminal.defaultCommands.length > 0 ? terminal.defaultCommands : FALLBACK_COMMANDS;

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Boot sequence — letters type out line-by-line, like a real shell waking up.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let lineIdx = 0;
    let charIdx = 0;

    const typeNext = () => {
      if (cancelled) return;
      if (lineIdx >= BOOT_LINES.length) {
        setBooting(false);
        return;
      }
      const line = BOOT_LINES[lineIdx];
      // Empty lines are just spacing — advance immediately.
      if (line.text.length === 0) {
        setLines((prev) => [...prev, { ...line }]);
        lineIdx++;
        charIdx = 0;
        timer = setTimeout(typeNext, 180);
        return;
      }
      // Start a new line with an empty placeholder we keep filling.
      if (charIdx === 0) {
        setLines((prev) => [...prev, { ...line, text: "" }]);
      }
      if (charIdx < line.text.length) {
        charIdx++;
        setLines((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...line, text: line.text.slice(0, charIdx) };
          return copy;
        });
        // Vary speed a little for an authentic typing feel.
        timer = setTimeout(typeNext, 10 + Math.random() * 22);
      } else {
        lineIdx++;
        charIdx = 0;
        timer = setTimeout(typeNext, 220);
      }
    };

    timer = setTimeout(typeNext, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const push = (echoed: TerminalLine, out: TerminalLine[], typed: string) => {
    setLines((prev) => [...prev, echoed, ...out, { type: "output", text: "" }]);
    setHistory((h) => [typed, ...h]);
    setHistoryIndex(-1);
  };

  const run = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [command, ...args] = trimmed.toLowerCase().split(/\s+/);
    const echoed: TerminalLine = { type: "input", text: `${livePrompt} ${trimmed}` };
    const canonical = ALIASES[command] ?? command;

    // Dashboard-managed description for this command — shown as a highlighted line
    // before the command's own output, so each chip can carry an editable blurb.
    const descMap = terminal.commandDescriptions ?? {};
    const descKey = command in descMap ? command : canonical in descMap ? canonical : null;
    const desc = descKey ? descMap[descKey] : undefined;

    // Owner-authored custom answer: when the dashboard has set a response for this
    // command, show those exact lines instead of the built-in logic. This lets the
    // owner fully rewrite any command's output while leaving un-set commands to
    // their live, data-driven defaults.
    const respMap = terminal.commandResponses ?? {};
    const respKey = command in respMap ? command : canonical in respMap ? canonical : null;

    if (canonical === "clear") {
      setLines([]);
      setHistory((h) => [trimmed, ...h]);
      setHistoryIndex(-1);
      return;
    }

    let out: TerminalLine[] = [];

    switch (canonical) {
      case "help":
        out = HELP_LINES;
        break;

      case "whoami":
        out = [
          { type: "output", text: `${profile.name} — ${profile.role}` },
          { type: "output", text: `alias: ${profile.initials} · github.com/CodeNexus404` },
          { type: "system", text: "root of this portfolio; no root access granted." },
        ];
        break;

      case "biodata":
        out = [
          { type: "header", text: "BIODATA" },
          { type: "output", text: "" },
          { type: "output", text: `Name:         ${profile.name}` },
          { type: "output", text: `Handle:       CodeNexus404` },
          { type: "output", text: `Role:         ${profile.role}` },
          { type: "output", text: `Location:     ${profile.location}` },
          { type: "output", text: `Timezone:     IST (UTC+5:30)` },
          { type: "output", text: `Email:        ${profile.email}` },
          { type: "output", text: `Availability: ${profile.availability}` },
          { type: "output", text: "" },
          { type: "accent", text: `Motto: ${profile.quote}` },
        ];
        break;

      case "about":
        out = [
          { type: "header", text: "ABOUT" },
          { type: "output", text: "" },
          { type: "output", text: `Name:     ${profile.name}` },
          { type: "output", text: `Role:     ${profile.role}` },
          { type: "output", text: `Location: ${profile.location}` },
          { type: "output", text: `Status:   ${profile.availability}` },
          { type: "output", text: "" },
          { type: "output", text: `${profile.about[0]}` },
          { type: "output", text: "" },
          { type: "accent", text: "Education" },
          ...profile.educationHistory.map(
            (edu): TerminalLine => ({
              type: "output",
              text: `• ${edu.school} — ${edu.credential} (${edu.score})`,
            }),
          ),
          { type: "output", text: "" },
          { type: "accent", text: "Stats" },
          ...profile.stats.map(
            (stat): TerminalLine => ({
              type: "accent",
              text: `${stat.value.padEnd(6)} ${stat.label}`,
            }),
          ),
        ];
        break;

      case "objective":
        out = [
          { type: "header", text: "OBJECTIVE / MISSION" },
          { type: "output", text: "" },
          { type: "output", text: profile.objective },
          { type: "output", text: "" },
          { type: "system", text: "→ actively seeking AI & Automation internships" },
        ];
        break;

      case "education":
        out = [
          { type: "header", text: "EDUCATION" },
          { type: "output", text: "" },
          ...profile.educationHistory.map((edu, i): TerminalLine[] => [
            { type: "accent", text: `${edu.credential}` },
            { type: "output", text: `${edu.school}` },
            { type: "output", text: `Score: ${edu.score}${i === 0 ? " · expected 2026" : ""}` },
            { type: "output", text: "" },
          ]).flat(),
          { type: "system", text: "Core CS: DSA · DBMS · OS · Networks · Software Engineering" },
        ];
        break;

      case "skills":
        out = [
          { type: "header", text: "TECHNICAL SKILLS" },
          { type: "output", text: "" },
          ...skills.groups.flatMap(
            (group): TerminalLine[] => [
              { type: "accent", text: `${group.label}:` },
              { type: "output", text: `${group.items.join(" · ")}` },
              { type: "output", text: "" },
            ],
          ),
          { type: "system", text: `${skills.note}` },
        ];
        break;

      case "stack":
        out = [
          { type: "header", text: "CURRENT STACK" },
          { type: "output", text: "" },
          { type: "accent", text: "Frontend:  React.js, Next.js, TypeScript, Tailwind CSS" },
          { type: "accent", text: "Backend:   Node.js, Express.js, Python" },
          { type: "accent", text: "Database:  MySQL, MongoDB, Prisma" },
          { type: "accent", text: "AI/ML:     LLMs, OpenCV, YOLOv8, n8n" },
          { type: "accent", text: "Tools:     Git, GitHub, VS Code, IntelliJ IDEA" },
          { type: "output", text: "" },
          { type: "system", text: "Always learning, always shipping." },
        ];
        break;

      case "experience":
        out = [
          { type: "header", text: "EXPERIENCE & EDUCATION" },
          { type: "output", text: "" },
          ...experience.flatMap(
            (exp): TerminalLine[] => [
              { type: "accent", text: `${exp.role} @ ${exp.company}` },
              { type: "output", text: `${exp.startDate} — ${exp.current ? "Present" : exp.endDate ?? ""}` },
              ...exp.description.slice(0, 3).map(
                (desc): TerminalLine => ({ type: "output", text: `→ ${desc}` }),
              ),
              { type: "output", text: `Tech: ${exp.technologies.join(", ")}` },
              { type: "output", text: "" },
            ],
          ),
        ];
        break;

      case "projects": {
        const query = args.join(" ").toLowerCase();
        if (query) {
          const project = selectedWorks.find(
            (p) => p.id === query || p.name.toLowerCase().includes(query),
          );
          if (!project) {
            out = [
              { type: "error", text: `project not found: '${query}'` },
              { type: "system", text: `try: projects ${selectedWorks.map((p) => p.id).join(" | ")}` },
            ];
            break;
          }
          out = [
            { type: "header", text: project.name.toUpperCase() },
            { type: "output", text: "" },
            { type: "output", text: project.description },
            { type: "output", text: `Tech:  ${project.technologies.join(", ")}` },
            ...(project.links.github
              ? [{ type: "output" as const, text: `Repo:  ${project.links.github}` }]
              : []),
            ...(project.links.live
              ? [{ type: "output" as const, text: `Live:  ${project.links.live}` }]
              : []),
            { type: "output", text: "" },
            { type: "system", text: `tip: 'open ${project.id}' opens it in a new tab` },
          ];
          break;
        }
        out = [
          { type: "header", text: "FEATURED PROJECTS" },
          { type: "output", text: "" },
          ...selectedWorks.flatMap(
            (project): TerminalLine[] => [
              { type: "accent", text: `${project.name}` },
              { type: "output", text: `${project.description}` },
              { type: "output", text: `Tech: ${project.technologies.join(", ")}` },
              ...(project.links.github
                ? [{ type: "output" as const, text: `GitHub: ${project.links.github}` }]
                : []),
              ...(project.links.live
                ? [{ type: "output" as const, text: `Live:   ${project.links.live}` }]
                : []),
              { type: "output", text: "" },
            ],
          ),
          { type: "system", text: `'projects <name>' for detail · 'open <name>' to launch` },
        ];
        break;
      }

      case "opensource":
        out = [
          { type: "header", text: "OPEN SOURCE & SELF-LEARNING" },
          { type: "output", text: "" },
          { type: "accent", text: `GitHub: ${githubHref() ?? ""}` },
          { type: "output", text: "" },
          ...(experience
            .find((e) => e.role.toLowerCase().includes("open source"))?.description.map(
              (desc): TerminalLine => ({ type: "output", text: `→ ${desc}` }),
            ) ?? []),
          { type: "output", text: "" },
          { type: "system", text: "code meant to be read, not just run." },
        ];
        break;

      case "now":
        out = [
          { type: "header", text: "NOW" },
          { type: "output", text: "" },
          { type: "accent", text: "Staying:" },
          { type: "output", text: `${profile.hero.rotating.join(" · ")}` },
          { type: "output", text: "" },
          { type: "accent", text: "Building:" },
          { type: "output", text: `${selectedWorks.map((p) => p.name).join(" · ")}` },
          { type: "output", text: "" },
          { type: "accent", text: "Exploring:" },
          { type: "output", text: `${skills.note}` },
          { type: "output", text: "" },
          { type: "accent", text: "Status:" },
          { type: "output", text: `${profile.availability}` },
        ];
        break;

      case "contact":
        out = [
          { type: "header", text: "CONTACT" },
          { type: "output", text: "" },
          { type: "output", text: `Email:    ${profile.email}` },
          { type: "output", text: `GitHub:   ${socialHref("github") ?? ""}` },
          { type: "output", text: `LinkedIn: ${socialHref("linked") ?? ""}` },
          { type: "output", text: `X:        ${socialHref("x") ?? ""}` },
          { type: "output", text: "" },
          { type: "system", text: "Always open to opportunities & collaborations." },
          { type: "system", text: "→ 'open email' composes · 'open github' / 'open linkedin' jump straight there" },
        ];
        break;

      case "email":
        if (typeof window !== "undefined") {
          window.open(`mailto:${profile.email}`, "_self");
        }
        out = [
          { type: "output", text: `Composing mail to ${profile.email}…` },
          { type: "output", text: `mailto:${profile.email}` },
          { type: "system", text: "if nothing opened, copy the address — I reply fast." },
        ];
        break;

      case "socials":
        out = profile.socials.map(
          (s): TerminalLine => ({
            type: "link",
            text: `${s.label.padEnd(12)} ${s.href}`,
          }),
        );
        break;

      case "resume":
        if (typeof window !== "undefined") window.open(profile.resumeHref, "_blank", "noopener,noreferrer");
        out = [
          { type: "output", text: "Opening resume in a new tab…" },
          { type: "output", text: `→ ${profile.resumeHref}` },
        ];
        break;

      case "open": {
        const target = args.join(" ");
        if (!target) {
          out = [
            { type: "header", text: "OPEN — USAGE" },
            { type: "output", text: "" },
            { type: "output", text: openTargetsList() },
            { type: "output", text: "" },
            { type: "system", text: "example: open socialflow · open linkedin · open https://github.com" },
          ];
          break;
        }
        const url = openUrlFor(target);
        if (!url) {
          out = [
            { type: "error", text: `unknown target: '${target}'` },
            { type: "system", text: openTargetsList() },
          ];
          break;
        }
        if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
        out = [
          { type: "link", text: `${target}  ${url}` },
          { type: "system", text: "↗ opening in a new tab…" },
        ];
        break;
      }

      case "git": {
        const gh = githubHref();
        if (typeof window !== "undefined" && gh) window.open(gh, "_blank", "noopener,noreferrer");
        out = gh
          ? [
              { type: "link", text: `${gh}` },
              { type: "system", text: "↗ opening in a new tab…" },
            ]
          : [{ type: "error", text: "GitHub profile not configured." }];
        break;
      }

      case "banner":
        out = [
          ...blockBanner(profile.firstName).map(
            (row): TerminalLine => ({ type: "accent", text: row }),
          ),
          { type: "output", text: "" },
          { type: "output", text: `${profile.name} — ${profile.role} · ${profile.location}` },
          { type: "output", text: "" },
          { type: "system", text: `"${profile.quote}"` },
        ];
        break;

      case "neofetch": {
        const info: TerminalLine[] = [
          { type: "output", text: `${profile.name}` },
          { type: "output", text: "─────────────────────" },
          { type: "output", text: `Role:     ${profile.role}` },
          { type: "output", text: `Location: ${profile.location}` },
          { type: "output", text: "Shell:    portfolio-term v3.0" },
          { type: "output", text: "Theme:    Signal (cyan on black)" },
          { type: "output", text: `Skills:   ${skills.groups.reduce((sum, g) => sum + g.items.length, 0)} installed` },
          { type: "output", text: "Uptime:   3+ years of building" },
          { type: "output", text: `Projects: ${selectedWorks.length} flagship builds` },
        ];
        const art = [
          "   .--.      ",
          "  |o_o |     ",
          "  |:_/ |     ",
          " //   \\ \\    ",
          "(|     | )   ",
          "/'\\_   _/`\\  ",
          "\\___)=(___/  ",
        ];
        const ART_W = 16;
        out = info.map((row, i): TerminalLine => {
          const artLine = art[i] ?? "";
          const left = artLine ? artLine.padEnd(ART_W) : " ".repeat(ART_W);
          return {
            type: artLine ? "accent" : "output",
            text: `${left}${row.text}`,
          };
        });
        break;
      }

      case "ls": {
        const dir = (args[0] ?? "").toLowerCase().replace(/\/$/, "");
        if (!dir || dir === "." || dir === "~" || dir === "~/" || dir === "/") {
          const entries: { name: string; kind: "file" | "dir" }[] = [
            { name: "about.txt", kind: "file" },
            { name: "biodata.txt", kind: "file" },
            { name: "contact.txt", kind: "file" },
            { name: "education.txt", kind: "file" },
            { name: "experience.txt", kind: "file" },
            { name: "objective.txt", kind: "file" },
            { name: "resume.pdf", kind: "file" },
            { name: "stack.txt", kind: "file" },
            { name: "projects/", kind: "dir" },
            { name: "skills/", kind: "dir" },
            { name: "socials/", kind: "dir" },
          ];
          out = [
            { type: "header", text: `~ — ${entries.length} ENTRIES` },
            { type: "output", text: "" },
            ...entries.map(
              (e): TerminalLine => ({
                type: e.kind === "dir" ? "accent" : "output",
                text: `${e.kind === "dir" ? "d" : "-"}rw-r--r--  sahil sahil  ${e.name}`,
              }),
            ),
            { type: "output", text: "" },
            { type: "system", text: "ls projects · ls skills · ls socials — files are hints: 'man about'" },
          ];
        } else if (dir === "projects") {
          out = [
            { type: "header", text: "~/projects — 4 ITEMS" },
            { type: "output", text: "" },
            ...selectedWorks.map(
              (p): TerminalLine => ({
                type: "accent",
                text: `${p.id.padEnd(20)}open ${p.id}`,
              }),
            ),
            { type: "output", text: "" },
            { type: "system", text: "'projects <name>' for full detail" },
          ];
        } else if (dir === "skills") {
          out = [
            { type: "header", text: "~/skills — 5 GROUPS" },
            { type: "output", text: "" },
            ...skills.groups.map(
              (g): TerminalLine => ({
                type: "output",
                text: `${g.label}  (${g.items.length} items)`,
              }),
            ),
            { type: "output", text: "" },
            { type: "system", text: "run 'skills' or 'stack' to expand" },
          ];
        } else if (dir === "socials") {
          out = [
            { type: "header", text: "~/socials — 4 LINKS" },
            { type: "output", text: "" },
            ...profile.socials.map(
              (s): TerminalLine => ({
                type: "output",
                text: `${s.label.padEnd(14)}open ${s.label.split(" ")[0]?.toLowerCase()}`,
              }),
            ),
            { type: "output", text: "" },
            { type: "system", text: "'socials' lists every link — all clickable" },
          ];
        } else {
          out = [
            { type: "error", text: `ls: cannot access '~/${dir}': No such directory` },
            { type: "system", text: "dirs: projects · skills · socials" },
          ];
        }
        break;
      }

      case "man": {
        const query = args[0] ?? "";
        const target = ALIASES[query] ?? query;
        const entry = COMMANDS[target];
        if (!entry) {
          out = [
            { type: "error", text: `no manual entry for '${query || ""}'` },
            { type: "system", text: "type 'help' to list commands" },
          ];
          break;
        }
        out = [
          { type: "header", text: `${target.toUpperCase()}(1)` },
          { type: "accent", text: "NAME" },
          { type: "output", text: `    ${target} — ${entry.desc}` },
          { type: "accent", text: "SYNOPSIS" },
          { type: "output", text: `    ${entry.usage}` },
          { type: "output", text: "" },
          { type: "system", text: "(type 'help' for the full list)" },
        ];
        break;
      }

      case "history": {
        const oldestFirst = [...history].reverse();
        if (oldestFirst.length === 0) {
          out = [{ type: "system", text: "history is empty — run something first." }];
          break;
        }
        const shown = oldestFirst.slice(-20);
        const start = Math.max(0, oldestFirst.length - 20);
        out = shown.map(
          (item, i): TerminalLine => ({
            type: i === shown.length - 1 ? "accent" : "output",
            text: `${String(start + i + 1).padStart(4)}  ${item}`,
          }),
        );
        break;
      }

      case "quote":
        out = [
          { type: "output", text: "" },
          { type: "header", text: `"${codeQuotes[Math.floor(Math.random() * codeQuotes.length)]}"` },
          { type: "output", text: "" },
          { type: "system", text: "— developer wisdom" },
        ];
        break;

      case "uptime": {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        out = [
          { type: "output", text: `Session time: ${h}:${m}:${s} IST` },
          { type: "output", text: `${profile.name} has been building for 3+ years` },
          { type: "output", text: `Ships: ${selectedWorks.length} flagship builds · 100+ commits` },
          { type: "output", text: "Status: always shipping 🚀" },
        ];
        break;
      }

      case "date":
        out = [
          { type: "output", text: `${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (IST)` },
        ];
        break;

      case "matrix": {
        const rows: TerminalLine[] = [];
        for (let i = 0; i < 8; i++) {
          let row = "";
          for (let j = 0; j < 52; j++) {
            row += MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          }
          rows.push({ type: "accent", text: `${row}` });
        }
        rows.push({ type: "output", text: "" });
        rows.push({ type: "system", text: "Wake up, Neo…" });
        out = rows;
        break;
      }

      case "ascii":
        out = [
          { type: "accent", text: "    ___       ___" },
          { type: "accent", text: "   /   \\     /   \\" },
          { type: "accent", text: "  / /\\  \\   / /\\  \\" },
          { type: "accent", text: " / /  \\  \\ / /  \\  \\" },
          { type: "accent", text: "/ /    \\  V /    \\  \\" },
          { type: "accent", text: "\\_/     \\___/     \\_/" },
          { type: "output", text: "" },
          { type: "system", text: `Built by ${profile.name}` },
        ];
        break;

      case "echo":
        out = [{ type: "output", text: args.join(" ") }];
        break;

      case "theme": {
        const want = args[0]?.toLowerCase();
        if (want === "light" || want === "dark") {
          if ((want === "dark") !== (theme !== "light")) {
            // already in the requested mode — no toggle needed
          } else {
            toggleTheme();
          }
          out = [
            { type: "system", text: `theme set to ${want}.` },
          ];
        } else {
          toggleTheme();
          out = [
            { type: "system", text: `theme toggled → ${theme === "dark" ? "light" : "dark"}` },
          ];
        }
        break;
      }

      case "say":
        out = [{ type: "accent", text: args.join(" ") || "…" }];
        break;

      case "coffee":
        out = [
          { type: "accent", text: "　 ( ( ( ☕ ) ) )" },
          { type: "output", text: "" },
          { type: "system", text: "brewing… done. take a break, you've earned it." },
          { type: "output", text: "☕☕☕　rest, then ship." },
        ];
        break;

      case "fortune":
        out = [
          { type: "output", text: "" },
          { type: "header", text: `"${codeQuotes[Math.floor(Math.random() * codeQuotes.length)]}"` },
          { type: "output", text: "" },
          { type: "system", text: "— fortune cookie" },
        ];
        break;

      case "sudo":
        out = [
          { type: "error", text: "sahil is not in the sudoers file. This incident will be reported." },
          { type: "system", text: "(psst — you already have full access here. try 'man sudo'.)" },
        ];
        break;

      default:
        out = [
          { type: "error", text: `command not found: ${command} — try 'help'` },
        ];
    }

    // Owner-authored custom answer takes precedence over built-in logic: when the
    // dashboard has set a response for this command, those exact lines are shown.
    if (respKey && respMap[respKey]?.length) {
      out = respMap[respKey].map((line): TerminalLine => ({ type: "output", text: line }));
    }

    // Prepend the dashboard-managed description (if any) as a highlighted line.
    if (desc) {
      out = [{ type: "accent", text: desc }, { type: "output", text: "" }, ...out];
    }

    push(echoed, out, trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      if (history.length > 0 && next >= 0) {
        setHistoryIndex(next);
        setInput(history[next] ?? "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIndex - 1;
      if (next >= 0) {
        setHistoryIndex(next);
        setInput(history[next] ?? "");
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const trimmed = input.trim().toLowerCase();
      const [head, ...rest] = trimmed.split(/\s+/);
      if (!head) return;

      // Argument completion for `open <target>` / `man <command>`
      if ((head === "open" || head === "man") && rest.length <= 1) {
        const pool =
          head === "open"
            ? [...selectedWorks.map((p) => p.id), "github", "linkedin", "x", "email", "resume"]
            : [...Object.keys(COMMANDS), ...Object.keys(ALIASES)];
        const prefix = rest[0] ?? "";
        const matches = pool.filter((c) => c.startsWith(prefix));
        if (matches.length === 1) setInput(`${head} ${matches[0]} `);
        else if (matches.length > 1) {
          setLines((prev) => [
            ...prev,
            { type: "input", text: `${livePrompt} ${input}` },
            { type: "system", text: `${matches.join("  ")}` },
          ]);
        }
        return;
      }

      // First-word command completion
      const matches = Object.keys(COMMAND_NAMES).filter((c) => c.startsWith(trimmed));
      if (matches.length === 1) setInput(matches[0] + " ");
      else if (matches.length > 1) {
        setLines((prev) => [
          ...prev,
          { type: "input", text: `${livePrompt} ${input}` },
          { type: "system", text: `${matches.join("  ")}` },
        ]);
      }
    }
  };

  // While the cursor is over the terminal, swallow wheel events so the page
  // (Lenis) never scrolls — even after the inner output hits its top/bottom.
  // Page scrolling only resumes once the cursor leaves the terminal window.
  const hovering = useRef(false);
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (hovering.current) e.stopPropagation();
  };

  return (
    <div
      onWheel={handleWheel}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.10] bg-black/90 font-mono text-[13px] text-left shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl",
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
        <div className="size-3 rounded-full bg-[#ff5f57]" />
        <div className="size-3 rounded-full bg-[#febc2e]" />
        <div className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[11px] tracking-wide text-muted-foreground/60">
          sahil@portfolio: ~
        </span>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto px-4 py-3 sm:h-80"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => {
          // Link lines render a real anchor for the trailing URL
          const link =
            line.type === "link" ? splitUrl(line.text) : null;
          if (link) {
            return (
              <div
                key={i}
                className="whitespace-pre-wrap break-words leading-relaxed"
              >
                <span className="text-accent/85">{link.label}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-foreground"
                >
                  {link.url}
                </a>
              </div>
            );
          }
          return (
            <div
              key={i}
              className={cn(
                "whitespace-pre-wrap break-words leading-relaxed",
                line.type === "input" && "font-semibold text-accent",
                line.type === "output" && "text-foreground/90",
                line.type === "error" && "text-red-300",
                line.type === "system" && "text-muted-foreground/65",
                line.type === "header" && "mt-1 font-bold tracking-[0.2em] text-foreground",
                line.type === "accent" && "text-accent",
                line.type === "loading" && "animate-pulse text-muted-foreground/55",
              )}
            >
              {linkify(line.text) || "\u00A0"}
            </div>
          );
        })}

        {/* Input line — real shell prompt */}
        {!booting && (
          <>
            <form onSubmit={handleSubmit} className="flex items-center gap-0">
              <span className="shrink-0 font-semibold text-accent">{livePrompt}&nbsp;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-w-0 flex-1 bg-transparent text-foreground caret-accent outline-none placeholder:text-muted-foreground/25"
                placeholder="type a command… (help)"
                aria-label="Terminal command input"
                autoComplete="off"
                spellCheck={false}
              />
              {!input && (
                <span
                  className="ml-0.5 inline-block h-4 w-2 animate-cursor-blink bg-accent"
                  aria-hidden
                />
              )}
            </form>

            {/* Quick-action chips — clickable shortcuts to common commands */}
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => run(cmd)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[11px] tracking-wide text-muted-foreground transition-all duration-200 hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
