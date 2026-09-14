import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SectionHeader from "./SectionHeader";
import { useSiteContent } from "@/hooks/use-site-content";
import { skills as staticSkills } from "@/data/portfolio";
// Reuse the single source of truth for brand logos so the public site, dashboard
// and this marquee never drift. `skillBrands`/`extraIcons` (and `VSCODE_SVG`) live
// in skillBrands.ts, so we don't redeclare them here.
import { skillBrands, extraIcons, type Brand } from "./skillBrands";

const levelOne = ["C", "C++", "Python", "Java", "SQL", "HTML", "CSS", "JavaScript", "React.js", "Next.js", "Express.js", "JDBC"];
const levelTwo = ["REST API", "Node.js", "MySQL", "MongoDB", "Git", "GitHub", "VS Code", "IntelliJ IDEA", "Generative AI", "Prompt Engineering", "LLMs", "n8n automation"];

function buildTrack(items: string[]) {
  const runWidth = items.reduce((sum, t) => sum + 140 + t.length * 12, 0) + items.length * 28;
  const reps = Math.max(1, Math.ceil(3200 / runWidth));
  const tiled = Array.from({ length: reps }, () => items).flat();
  return [...tiled.map((text) => ({ text, hidden: false })), ...tiled.map((text) => ({ text, hidden: true }))];
}

export default function Skills() {
  const { skills } = useSiteContent();
  // Use live (dashboard-edited) groups, falling back to the static defaults.
  const groups = skills?.groups?.length ? skills.groups : staticSkills.groups;
  const note = skills?.note ?? staticSkills.note;
  const intro =
    skills?.intro?.trim() ||
    "// Languages, frameworks, databases and tooling I reach for when building.";

  // Resolve each item to the brand-lookup key: the chosen icon if set, else the
  // skill name (so unmapped-but-named skills still get a logo via name lookup).
  const resolveKey = (it: { name: string; icon?: string }) => it.icon?.trim() || it.name;

  // Flatten every group's items into one pool. Falls back to the hardcoded
  // demo streams when there are no items at all.
  const allItems = groups
    .flatMap((g) => g.items)
    .filter((it) => it && it.name)
    .map(resolveKey);

  // Marquee layout — driven by the dashboard (rows / speed / direction).
  // Defaults match the original look: 2 rows, 70s base, alternating direction.
  const cfg = skills?.marquee ?? {
    rows: 2,
    baseSpeed: 70,
    alternateDirection: true,
  };
  const rowCount = Math.max(1, Math.min(6, cfg.rows || 2));

  // Distribute the pool round-robin across the rows so each row shows a distinct
  // subset and the columns stay balanced no matter how the owner edits groups.
  const pool = allItems.length ? allItems : levelOne.concat(levelTwo);
  const rowPools: string[][] = Array.from({ length: rowCount }, () => []);
  pool.forEach((item, idx) => rowPools[idx % rowCount].push(item));

  const levels = rowPools.map((rowItems, r) => ({
    items: buildTrack(rowItems),
    reverse: cfg.alternateDirection ? r % 2 === 1 : false,
    // Stagger each successive row slightly so they don't move in lockstep.
    speed: cfg.baseSpeed + r * 12,
  }));
  const brandFor = (text: string): Brand | undefined => skillBrands[text] ?? extraIcons[text];

  return (
    <section id="skills" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHeader number="03" title="Skills & Stack" />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm"
        >
          {intro}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 flex flex-col gap-10"
        >
          {levels.map((level, li) => (
            <div key={`level-${li}`} className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div className={`flex w-max items-center gap-7 pr-7 hover:[animation-play-state:paused] ${level.reverse ? "animate-marquee-reverse" : "animate-marquee"}`} style={{ animationDuration: `${level.speed}s` }}>
                {level.items.map(({ text, hidden }, i) => {
                  const brand = brandFor(text);
                  // Unique id so duplicated marquee chips don't share a mask.
                  const rawSvg = brand?.type === "raw" ? brand.svg.replace("vscode-mask", `vscode-mask-${li}-${i}`) : undefined;
                  return (
                    <span key={`${li}-${i}`} aria-hidden={hidden || undefined} className="glass-chip inline-flex items-center gap-4 whitespace-nowrap rounded-2xl px-7 py-4 font-mono text-lg tracking-tight text-foreground/90 transition-all duration-300 hover:border-accent/40 sm:px-9 sm:py-5 sm:text-xl">
                      {brand?.type === "svg" ? (
                        <svg viewBox="0 0 24 24" className="size-9 shrink-0 sm:size-10" style={{ color: `#${brand.hex}` }} fill="currentColor" aria-hidden><path d={brand.path} /></svg>
                      ) : brand?.type === "fa" ? (
                        <FontAwesomeIcon icon={brand.icon} className="size-10 shrink-0 sm:size-11" style={{ color: `#${brand.hex}` }} aria-hidden />
                      ) : brand?.type === "lucide" ? (
                        <brand.Icon className="size-8 shrink-0 sm:size-9" style={{ color: `#${brand.hex}` }} aria-hidden />
                      ) : rawSvg ? (
                        <span className="size-9 shrink-0 sm:size-10 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: rawSvg }} />
                      ) : null}
                      {text}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          {allItems.length} tools &middot; {rowCount} stream{rowCount === 1 ? "" : "s"} &middot; pause on hover
        </motion.p>
        {note ? (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground"
          >
            {"// "}{note}
          </motion.p>
        ) : null}
      </div>
    </section>
  );
}
