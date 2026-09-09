import {
  siC, siCplusplus, siCss, siExpress, siGit, siGithub,
  siHtml5, siIntellijidea, siJavascript, siMongodb, siMysql,
  siN8n, siNextdotjs, siNodedotjs, siPython, siReact,
} from "simple-icons/icons";
import { Bot, BrainCircuit, Database, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faJava } from "@fortawesome/free-brands-svg-icons";
import SectionHeader from "./SectionHeader";

type Brand =
  | { type: "svg"; path: string; hex: string }
  | { type: "fa"; icon: typeof faJava; hex: string }
  | { type: "lucide"; Icon: typeof Database; hex: string }
  | { type: "raw"; svg: string };

// Official Microsoft VS Code logo (multicolor) inlined as raw SVG so we don't
// ship a separate PNG/asset file. The mask id is unique per call site to avoid
// collisions when the marquee duplicates the chip.
const VSCODE_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<mask id="vscode-mask" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
<path fill-rule="evenodd" clip-rule="evenodd" d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z" fill="white"/>
</mask>
<g mask="url(#vscode-mask)">
<path d="M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 63.5832C-0.515693 65.2373 -0.513607 68.0937 1.30308 69.7452L6.81272 74.754C8.29793 76.1042 10.5347 76.2036 12.1338 74.9905L93.3609 13.3699C96.086 11.3026 100 13.2462 100 16.6667V16.4275C100 14.0265 98.6246 11.8378 96.4614 10.7962Z" fill="#0065A9"/>
<path d="M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 36.4169C-0.515693 34.7627 -0.513607 31.9063 1.30308 30.2548L6.81272 25.246C8.29793 23.8958 10.5347 23.7964 12.1338 25.0095L93.3609 86.6301C96.086 88.6974 100 86.7538 100 83.3334V83.5726C100 85.9735 98.6246 88.1622 96.4614 89.2038Z" fill="#007ACC"/>
<path d="M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 98.5895 75 95.3278V4.67213C75 1.41039 71.0564 -0.223106 68.75 2.08329C70.6219 0.211402 73.4721 -0.273666 75.8578 0.873633L96.4587 10.7807C98.6234 11.8217 100 14.0112 100 16.4132V83.5871C100 85.9891 98.6234 88.1786 96.4586 89.2196L75.8578 99.1263Z" fill="#1F9CF0"/>
</g>
</svg>`;

const skillBrands: Record<string, Brand> = {
  C: { type: "svg", path: siC.path, hex: siC.hex },
  "C++": { type: "svg", path: siCplusplus.path, hex: siCplusplus.hex },
  Python: { type: "svg", path: siPython.path, hex: siPython.hex },
  // Java brand mark from Font Awesome.
  Java: { type: "fa", icon: faJava, hex: "E76F00" },
  HTML: { type: "svg", path: siHtml5.path, hex: siHtml5.hex },
  CSS: { type: "svg", path: siCss.path, hex: "1572B6" },
  JavaScript: { type: "svg", path: siJavascript.path, hex: siJavascript.hex },
  "React.js": { type: "svg", path: siReact.path, hex: siReact.hex },
  "Next.js": { type: "svg", path: siNextdotjs.path, hex: "FFFFFF" },
  "Express.js": { type: "svg", path: siExpress.path, hex: "CBD5E1" },
  "Node.js": { type: "svg", path: siNodedotjs.path, hex: siNodedotjs.hex },
  MySQL: { type: "svg", path: siMysql.path, hex: siMysql.hex },
  MongoDB: { type: "svg", path: siMongodb.path, hex: siMongodb.hex },
  Git: { type: "svg", path: siGit.path, hex: siGit.hex },
  GitHub: { type: "svg", path: siGithub.path, hex: "E6EDF3" },
  // Official Microsoft VS Code logo, inlined as raw multicolor SVG.
  "VS Code": { type: "raw", svg: VSCODE_SVG },
  "IntelliJ IDEA": { type: "svg", path: siIntellijidea.path, hex: "FE315D" },
  "n8n automation": { type: "svg", path: siN8n.path, hex: siN8n.hex },
};

const levelOne = ["C", "C++", "Python", "Java", "SQL", "HTML", "CSS", "JavaScript", "React.js", "Next.js", "Express.js", "JDBC"];
const levelTwo = ["REST API", "Node.js", "MySQL", "MongoDB", "Git", "GitHub", "VS Code", "IntelliJ IDEA", "Generative AI", "Prompt Engineering", "LLMs", "n8n automation"];

const extraIcons: Record<string, Brand> = {
  SQL: { type: "lucide", Icon: Database, hex: "38BDF8" },
  JDBC: { type: "lucide", Icon: Database, hex: "5FA04E" },
  "REST API": { type: "lucide", Icon: Database, hex: "F89820" },
  "Generative AI": { type: "lucide", Icon: Sparkles, hex: "A855F7" },
  "Prompt Engineering": { type: "lucide", Icon: Bot, hex: "38BDF8" },
  LLMs: { type: "lucide", Icon: BrainCircuit, hex: "F472B6" },
};

function buildTrack(items: string[]) {
  const runWidth = items.reduce((sum, t) => sum + 140 + t.length * 12, 0) + items.length * 28;
  const reps = Math.max(1, Math.ceil(3200 / runWidth));
  const tiled = Array.from({ length: reps }, () => items).flat();
  return [...tiled.map((text) => ({ text, hidden: false })), ...tiled.map((text) => ({ text, hidden: true }))];
}

export default function Skills() {
  const levels = [
    { items: buildTrack(levelOne), reverse: false },
    { items: buildTrack(levelTwo), reverse: true },
  ];
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
          {"// "}Languages, frameworks, databases and tooling I reach for when building.
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
              <div className={`flex w-max items-center gap-7 pr-7 hover:[animation-play-state:paused] ${level.reverse ? "animate-marquee-reverse" : "animate-marquee"}`} style={{ animationDuration: `${70 + li * 20}s` }}>
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
          {levelOne.length + levelTwo.length} tools &middot; 2 streams &middot; pause on hover
        </motion.p>
      </div>
    </section>
  );
}