/**
 * Generates public/resume.pdf — a clean one-page résumé built from the same
 * data as the site. Re-run after editing your details:
 *
 *   node scripts/generate-resume.mjs
 */
import { jsPDF } from "jspdf";

// ── Content (edit here) ────────────────────────────────────────────────────
const resume = {
  name: "Sahil Shedge",
  title: "FULL-STACK DEVELOPER",
  contact:
    "github.com/CodeNexus404   ·   shedgesahil2005@gmail.com   ·   India",
  summary:
    "Full-stack developer and Computer Science undergrad who turns rough ideas into working products — from AI-powered automation tools to real-time computer-vision systems. I care about clean architecture, fast interactions and interfaces that feel considered rather than assembled.",
  skills: [
    ["Languages", "TypeScript · JavaScript · Python · Java"],
    ["Frameworks", "React · Next.js · Node.js · Convex"],
    ["Data & Tools", "PostgreSQL · MySQL · Prisma · Docker · Git · n8n"],
    ["AI / Vision", "OpenCV · YOLOv8 · LLM APIs (Anthropic / OpenAI / Gemini)"],
    ["Styling", "Tailwind CSS · Framer Motion · Vite"],
  ],
  projects: [
    {
      name: "SocialFlow",
      meta: "Next.js · TypeScript · Prisma · n8n · Google APIs",
      desc: "AI-powered multi-platform content automation for creators: publish, schedule and analyze YouTube & Instagram content with AI-generated metadata, real-time analytics and n8n workflow automation.",
      link: "github.com/CodeNexus404/SocialFlow",
    },
    {
      name: "Nexference",
      meta: "JavaScript · Node.js · LLM APIs",
      desc: "AI coding gateway switcher: browse live free models across 14 AI gateways and apply the right config to Claude Code or any client in one click.",
      link: "github.com/CodeNexus404/Nexference",
    },
    {
      name: "Driver Safety AI",
      meta: "Python · YOLOv8 · OpenCV",
      desc: "Real-time computer-vision system detecting risky driving behaviors — phone usage, missing seatbelts, helmet violations — with live alerts and automated logging.",
      link: "github.com/CodeNexus404/driver-safety-ai",
    },
    {
      name: "Poshara",
      meta: "OCR · Machine Learning · Web App",
      desc: "Platform connecting restaurants, NGOs and volunteers for surplus food distribution, using OCR & ML-based freshness assessment.",
      link: "github.com/CodeNexus404/Poshara",
    },
  ],
  experience: [
    {
      role: "Full-Stack Developer — Freelance & Personal Projects",
      period: "2023 — Present",
      bullets: [
        "Designed and shipped full-stack products end-to-end: schema design, APIs, UI and deployment.",
        "Built across React/Next.js frontends, Node.js services, Python ML tooling and SQL databases.",
      ],
    },
  ],
  education: [
    {
      role: "B.Tech — Computer Science & Engineering",
      period: "2022 — 2026",
      bullets: [
        "Core CS foundations: data structures, algorithms, DBMS, operating systems, networks.",
        "Built a JDBC + MySQL banking system with role-based auth and layered DAO architecture.",
      ],
    },
  ],
};
// ───────────────────────────────────────────────────────────────────────────

const INK = [30, 33, 38];
const MUTED = [96, 103, 113];
const ACCENT = [7, 105, 158];
const LINE = [206, 210, 215];

const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
const PAGE_W = doc.internal.pageSize.getWidth();
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
let y = 64;

function setFont(style, size, color = INK) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

/** Section heading with rule */
function section(title) {
  setFont("bold", 10, ACCENT);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 8;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 16;
}

/** Wrapped paragraph */
function paragraph(
  text,
  { size = 9.5, style = "normal", color = MUTED, gap = 6 } = {},
) {
  setFont(style, size, color);
  for (const line of doc.splitTextToSize(text, CONTENT_W)) {
    doc.text(line, MARGIN, y);
    y += size + 3;
  }
  y += gap - 3;
}

/** Entry: bold title left, muted period right, optional meta/desc/bullets/link */
function entry({ name, role, meta, period, desc, bullets, link }) {
  const title = name ?? role;
  setFont("bold", 11);
  doc.text(title, MARGIN, y);
  if (period) {
    setFont("normal", 9, MUTED);
    const w = doc.getTextWidth(period);
    doc.text(period, PAGE_W - MARGIN - w, y);
  }
  y += 15;
  if (meta) {
    setFont("italic", 8.5, MUTED);
    doc.text(meta, MARGIN, y);
    y += 12;
  }
  if (desc) paragraph(desc, { gap: 3 });
  if (bullets) {
    for (const b of bullets) {
      setFont("normal", 9.5);
      const lines = doc.splitTextToSize(b, CONTENT_W - 14);
      lines.forEach((line, i) => {
        if (i === 0) {
          setFont("normal", 9.5, ACCENT);
          doc.text("•", MARGIN + 2, y);
          setFont("normal", 9.5);
        }
        doc.text(line, MARGIN + 14, y);
        y += 12.5;
      });
      y += 1;
    }
  }
  if (link) {
    setFont("normal", 8.5, ACCENT);
    doc.textWithLink(link, MARGIN + 14, y, { url: `https://${link}` });
    y += 14;
  }
  y += 2;
}

// ── Header ─────────────────────────────────────────────────────────────────
setFont("bold", 28);
doc.text(resume.name, MARGIN, y);
y += 18;
setFont("normal", 10.5, ACCENT);
doc.text(resume.title, MARGIN, y);
y += 14;
setFont("normal", 9, MUTED);
doc.text(resume.contact, MARGIN, y);
y += 10;
doc.setDrawColor(...LINE);
doc.setLineWidth(1);
doc.line(MARGIN, y, PAGE_W - MARGIN, y);
y += 20;

// Summary
section("Summary");
paragraph(resume.summary, { size: 9.5, gap: 10 });

// Skills
section("Skills");
for (const [group, items] of resume.skills) {
  setFont("bold", 9.5);
  doc.text(group, MARGIN, y);
  const gx = MARGIN + 92;
  setFont("normal", 9.5, MUTED);
  const lines = doc.splitTextToSize(items, PAGE_W - MARGIN - gx);
  lines.forEach((line, i) => {
    doc.text(line, gx, y);
    if (i < lines.length - 1) y += 12.5;
  });
  y += 14;
}
y += 6;

// Projects
section("Projects");
for (const p of resume.projects) entry(p);
y += 6;

// Experience
section("Experience");
for (const e of resume.experience) entry(e);
y += 6;

// Education
section("Education");
for (const e of resume.education) entry(e);

// Footer
setFont("italic", 7.5, LINE);
doc.text(
  "Latest version always available at github.com/CodeNexus404",
  MARGIN,
  826,
);

doc.setProperties({
  title: `${resume.name} — Resume`,
  author: resume.name,
});

const bytes = doc.output("arraybuffer");
const { writeFile, mkdir } = await import("node:fs/promises");
const path = await import("node:path");
const outPath = path.join(process.cwd(), "public", "resume.pdf");
await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, Buffer.from(bytes));
console.log(`✓ wrote ${outPath} (${bytes.byteLength} bytes)`);
