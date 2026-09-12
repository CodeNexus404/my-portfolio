/**
 * Portfolio content — edit this file to make the site yours.
 * Name, hero titles, projects, experience, skills and links all live here.
 */

export const profile = {
  name: "Sahil Shedge",
  firstName: "Sahil",
  initials: "SS",
  role: "Full-Stack Developer",
  email: "shedgesahil2005@gmail.com",
  location: "India",
  availability: "Open to internships & full-time roles",
  hero: {
    constant: "Stay",
    rotating: [
      "Consistent",
      "Curious",
      "Shipping",
      "Building",
      "Learning",
    ],
  },
  quote: "Stay GOATED 🐐",
  about: [
    "I'm a final-year Computer Science undergrad and full-stack developer who enjoys turning rough ideas into real, shipped products — AI-powered automation tools, realtime systems and computer-vision apps.",
  ],
  /** Résumé OBJECTIVE — shown in the About section. */
  objective:
    "Final-year Computer Science student focused on full-stack development and applied AI. I've built working tools with Python, LLMs, REST APIs and workflow automation — from multi-platform content systems to realtime computer-vision pipelines. Now looking for an AI & Automation internship where I can ship intelligent, useful software with a team that moves fast.",
  education: {
    degree: "B.Tech — Computer Science & Engineering",
    detail: "2022 — 2026",
  },
  /** Full academic history from the résumé, newest first. */
  educationHistory: [
    {
      school: "Pimpri Chinchwad University (PCU), Pune",
      credential: "B.Tech — Computer Science Engineering",
      score: "CGPA 8.38",
    },
    {
      school: "Vidya Valley North Point Jr College, Pune",
      credential: "HSC (Class XII — Science)",
      score: "77.67%",
    },
    {
      school: "Vidya Niketan English Medium School, Pune",
      credential: "SSC (Class X)",
      score: "84.20%",
    },
  ],
  stats: [
    { value: "3+", label: "Years building" },
    { value: "5+", label: "Projects shipped" },
    { value: "100+", label: "Commits pushed" },
    { value: "4", label: "Flagship builds" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/CodeNexus404" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/sahil-shedge-a99401292/",
    },
    { label: "X / Twitter", href: "https://x.com/sahilshedge05" },
    { label: "Email", href: "mailto:shedgesahil2005@gmail.com" },
  ],
  /** Served from /public — replace public/resume.pdf with your real resume.
   *  The navbar downloads it as Sahil-Shedge-Resume.pdf. */
  resumeHref: "/resume.pdf",
};

export type Project = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  links: {
    live?: string;
    github?: string;
  };
  /** Optional per-card shader gradient (3 colors). Falls back to default palette. */
  shaderColors?: string[];
  /** Optional per-card shader numeric params (mirrors <GrainGradient />). */
  shaderParams?: {
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
  /** Header render mode: "shader" (default), "image", or "custom" (HTML/CSS/React). */
  shaderMode?: "shader" | "image" | "custom";
  /** Custom header source type when shaderMode === "custom": "html" or "react". */
  customType?: "html" | "react";
  /** Custom header source (HTML/CSS or React JSX) when shaderMode === "custom". */
  customCss?: string;
  /** Signed URL for the uploaded header image (shaderMode === "image"). */
  headerImageUrl?: string | null;
};

export const selectedWorks: Project[] = [
  {
    id: "socialflow",
    name: "SocialFlow",
    description:
      "AI-powered multi-platform content automation for creators — publish, schedule and analyze YouTube & Instagram content with AI-generated metadata, real-time analytics and n8n workflow automation.",
    technologies: ["React.js", "Prisma", "n8n automation", "Google APIs"],
    links: {
      github: "https://github.com/CodeNexus404/SocialFlow",
    },
  },
  {
    id: "nexference",
    name: "Nexference",
    description:
      "AI coding gateway switcher — browse live free models across 14 AI gateways and apply the right Anthropic / OpenAI / Gemini config to Claude Code or any client in one click.",
    technologies: ["JavaScript", "Node.js", "LLMs", "Claude Code"],
    links: {
      github: "https://github.com/CodeNexus404/Nexference",
    },
  },
  {
    id: "driver-safety-ai",
    name: "Driver Safety AI",
    description:
      "Real-time computer-vision system that detects risky driving behaviors — phone usage, missing seatbelts, helmet violations — with YOLOv8 + OpenCV, providing live alerts and automated logging.",
    technologies: ["Python", "YOLOv8", "OpenCV", "Computer Vision"],
    links: {
      github: "https://github.com/CodeNexus404/driver-safety-ai",
    },
  },
  {
    id: "poshara",
    name: "Poshara",
    description:
      "A platform connecting restaurants, NGOs and volunteers for surplus food distribution, using OCR & ML-based freshness assessment to route safe food to where it's needed.",
    technologies: ["OCR", "Machine Learning", "Web App"],
    links: {
      live: "https://poshara.netlify.app/",
      github: "https://github.com/CodeNexus404/Poshara",
    },
  },
];

export type Experience = {
  role: string;
  company: string;
  companySite: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string[];
  technologies: string[];
};

export const experience: Experience[] = [
  {
    role: "Full-Stack Developer",
    company: "Independent Projects",
    companySite: "https://github.com/CodeNexus404",
    startDate: "2023",
    current: true,
    description: [
      "Designed and shipped SocialFlow end-to-end: a content-automation platform (Next.js, Prisma, n8n, Google APIs) that schedules YouTube & Instagram posts, generates AI metadata and surfaces real-time analytics for creators.",
      "Built Nexference, an AI coding-gateway switcher in JavaScript/Node.js — aggregates live free-model listings across 14 gateways (Anthropic, OpenAI, Gemini) and hot-swaps Claude Code configs in one click. MIT-licensed.",
      "Trained and deployed Driver Safety AI: a YOLOv8 + OpenCV pipeline that flags phone usage, missing seatbelts and helmet violations in real time, with live alerts and automated violation logging.",
      "Contributed to Poshara, a food-redistribution platform connecting restaurants, NGOs and volunteers, working on the OCR & ML freshness-assessment flow.",
      "Own everything across the stack — schema design, REST/integration layers, UI polish, git hygiene and deployment.",
    ],
    technologies: ["React.js", "Next.js", "Node.js", "Python", "SQL"],
  },
  {
    role: "B.Tech — Computer Science & Engineering",
    company: "Undergraduate Studies",
    companySite: "https://github.com/CodeNexus404",
    startDate: "2022",
    current: true,
    description: [
      "Core coursework: data structures & algorithms, DBMS, operating systems, computer networks and software engineering.",
      "Built a JDBC + MySQL banking system with role-based authentication, transaction processing, analytics and layered DAO architecture — my deep-dive into clean OOP backend design.",
      "Regular participant in coding contests and hackathons; comfortable picking up any framework or language a project demands.",
      "Consistently applied coursework directly into side projects — most production patterns I use started as class concepts pushed further on my own time.",
    ],
    technologies: ["Java", "JDBC", "MySQL", "OOP", "Algorithms"],
  },
  {
    role: "Open Source & Self-Learning",
    company: "GitHub · CodeNexus404",
    companySite: "https://github.com/CodeNexus404",
    startDate: "2022",
    current: true,
    description: [
      "Publishing projects publicly with clean READMEs, proper licensing and structured commit history — code meant to be read, not just run.",
      "Deep-diving LLM tooling: prompt engineering, multi-provider gateway abstractions and agentic coding workflows (Claude Code and friends).",
      "Exploring realtime systems, computer vision and developer-experience tooling beyond the standard curriculum.",
      "Documenting what I build so the next project starts smarter than the last one.",
    ],
    technologies: ["Git", "GitHub", "LLMs", "Linux"],
  },
];

/** Skills grouped exactly like the résumé — rendered as scrolling chip
 *  streams in the Skills section. */
export const skills = {
  groups: [
    {
      label: "Programming Languages",
      items: ["C", "C++", "Python", "Java", "SQL", "HTML", "CSS", "JavaScript"],
    },
    {
      label: "Frameworks",
      items: ["React.js", "Next.js", "Express.js"],
    },
    {
      label: "APIs & Technologies",
      items: ["JDBC", "REST API", "Node.js"],
    },
    {
      label: "Databases",
      items: ["MySQL", "MongoDB"],
    },
    {
      label: "Tools, AI & Automation",
      items: [
        "Git",
        "GitHub",
        "VS Code",
        "IntelliJ IDEA",
        "Generative AI",
        "Prompt Engineering",
        "LLMs",
        "n8n automation",
      ],
    },
  ],
  note: "Currently exploring realtime apps, AI tooling and computer vision.",
};

/**
 * Original one-liners shown in the About "// thoughts.log" quote engine.
 * All written for this site — none lifted from anywhere else.
 */
export const codeQuotes: string[] = [
  // Craft & code quality
  "First make it work, then make it right, then make it fast.",
  "Clean code is a courtesy to your future self at 2 AM.",
  "Every abstraction is a promise you now have to keep.",
  "Naming things is 50% of programming; the other 50% is renaming them.",
  "A comment explaining why beats ten explaining what.",
  "Refactor while the context is fresh — debt compounds faster than interest.",
  // Debugging & problem solving
  "Read the error message. Really read it — it already told you the line.",
  "If you can't explain the bug, you haven't found it yet.",
  "The best debugger is still a good night's sleep.",
  "Rubber-duck debugging works because saying it out loud slows you down enough to think.",
  "It's not a bug until you can reproduce it. After that, it's an appointment.",
  // Shipping & momentum
  "Done is a feature.",
  "Ship small, ship often, never ship scared.",
  "Perfect is the enemy of deployed.",
  "Version 1 exists so version 2 has something to be better than.",
  "Momentum beats motivation. Commit something today.",
  // Learning & mindset
  "Copy-paste is fine. Copy-understand is better.",
  "The fastest way to learn a stack is to build the thing you're scared of.",
  "Tutorials end where engineering begins.",
  "Google it like you mean it — half of senior dev is knowing what to search.",
  "Stay curious, stay shipping.",
  // Systems & architecture
  "Cache invalidation is hard because the future is hard.",
  "There are two hard problems: naming, cache invalidation, and off-by-one errors.",
  "Simple systems are hard to build precisely because they must stay simple.",
  "The database doesn't care about your framework drama.",
  // Personality
  "Stay goated 🐐",
  "Code like the person who inherits it is you, six months from now, tired.",
];
