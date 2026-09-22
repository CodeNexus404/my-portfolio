import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireOwner } from "./guards";
import {
  shaderShapeValidator,
  shaderParamsValidator,
} from "./schema";

const MAX_LEN = {
  short: 200,
  medium: 600,
  long: 4000,
  url: 2000,
} as const;

function clampStr(s: string, max: number): string {
  return s.trim().slice(0, max);
}

/**
 * Public, read-only view of the editable site content.
 * Returns null until the owner has seeded the content (the frontend then falls
 * back to the static data in src/data/portfolio.ts). Exposes only public
 * content — nothing sensitive.
 */
export const getEditable = query({
  args: {},
  handler: async (ctx) => {
    const content = await ctx.db.query("siteContent").first();
    if (!content) return null;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_order")
      .order("asc")
      .collect();

    const resumeUrl = content.resumeStorageId
      ? await ctx.storage.getUrl(content.resumeStorageId)
      : null;
    const backgroundImageUrl = content.background?.imageStorageId
      ? await ctx.storage.getUrl(content.background.imageStorageId)
      : null;

    const experiences = await ctx.db
      .query("experiences")
      .withIndex("by_order")
      .order("asc")
      .collect();

    const skillsRow = await ctx.db.query("skills").first();

    return {
      content: {
        hero: content.hero,
        availability: content.availability,
        about: content.about,
        objective: content.objective,
        socials: content.socials,
        resumeUrl,
        terminal: content.terminal ?? {
          prompt: "sahil@portfolio:~$",
          bootLines: [],
          defaultCommands: ["help", "whoami", "projects", "skills", "socials", "clear"],
          commandDescriptions: {},
          commandResponses: {},
        },
      },
      projects: await Promise.all(
        projects.map(async (p) => ({
          id: p._id,
          name: p.name,
          description: p.description,
          technologies: p.technologies,
          liveUrl: p.liveUrl,
          githubUrl: p.githubUrl,
          order: p.order,
          shaderColors: p.shaderColors,
          shaderParams: p.shaderParams,
          shaderMode: (p.shaderMode ?? "shader") as string,
          customType: (p.customType ?? "html") as string,
          customCss: p.customCss ?? "",
          imageUrl: p.imageStorageId
            ? await ctx.storage.getUrl(p.imageStorageId)
            : null,
        })),
      ),
      experiences: experiences.map((e) => ({
        id: e._id,
        role: e.role,
        company: e.company,
        companySite: e.companySite ?? "",
        startDate: e.startDate,
        endDate: e.endDate ?? "",
        current: e.current ?? false,
        description: e.description,
        technologies: e.technologies,
      })),
      // Return empty groups (not a single empty group) when the table is
      // unseeded, so the frontend's `groups.length > 0` guard correctly falls
      // back to the real static skills in src/data/portfolio.ts instead of
      // showing one empty "Programming Languages" group.
      skills: skillsRow ?? {
        groups: [],
        note: "",
        intro: null,
        marquee: null,
      },
      background: content.background ?? DEFAULT_BACKGROUND,
      backgroundImageUrl,
    };
  },
});

/** Default global background shader — copied verbatim from aarab.me's GradientBg
 *  (github.com/aarabii/An → components/mics/bg/GradientBg.tsx) so the seeded
 *  look matches the reference site exactly. */
const DEFAULT_BACKGROUND = {
  mode: "shader" as const,
  colorBack: "hsl(0, 0%, 0%)",
  colors: [
    "hsl(193, 85%, 66%)",
    "hsl(196, 100%, 83%)",
    "hsl(195, 100%, 50%)",
  ],
  softness: 0.5,
  intensity: 0.3,
  noise: 0,
  speed: 1,
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  shape: "corners" as const,
};

// ── Owner-only content mutations ───────────────────────────────────────────────

export const updateHero = mutation({
  args: {
    constant: v.string(),
    rotating: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const constant = clampStr(args.constant, MAX_LEN.short);
    const rotating = args.rotating
      .map((w) => clampStr(w, MAX_LEN.short))
      .filter((w) => w.length > 0)
      .slice(0, 12);
    if (!constant) throw new Error("Hero constant can't be empty.");
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, { hero: { constant, rotating } });
  },
});

export const updateAboutObjective = mutation({
  args: {
    about: v.array(v.string()),
    objective: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const about = args.about
      .map((p) => clampStr(p, MAX_LEN.long))
      .filter((p) => p.length > 0)
      .slice(0, 6);
    const objective = clampStr(args.objective, MAX_LEN.long);
    if (!about.length) throw new Error("Add at least one about paragraph.");
    if (!objective) throw new Error("Objective can't be empty.");
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, { about, objective });
  },
});

export const updateSocials = mutation({
  args: {
    socials: v.array(
      v.object({ label: v.string(), href: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const socials = args.socials
      .map((s) => ({
        label: clampStr(s.label, MAX_LEN.short),
        href: clampStr(s.href, MAX_LEN.url),
      }))
      .filter((s) => s.label.length > 0 && s.href.length > 0)
      .slice(0, 12);
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, { socials });
  },
});

export const updateAvailability = mutation({
  args: { availability: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const availability = clampStr(args.availability, MAX_LEN.short);
    if (!availability) throw new Error("Availability can't be empty.");
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, { availability });
  },
});

const BOOT_TYPES = [
  "input",
  "output",
  "error",
  "system",
  "header",
  "accent",
  "loading",
  "link",
] as const;

export const updateTerminal = mutation({
  args: {
    prompt: v.string(),
    bootLines: v.array(
      v.object({ type: v.string(), text: v.string() }),
    ),
    defaultCommands: v.array(v.string()),
    commandDescriptions: v.optional(v.record(v.string(), v.string())),
    // Optional custom output lines per command (command → lines[]). When a
    // command has an entry, the public terminal shows these instead of its
    // built-in logic.
    commandResponses: v.optional(
      v.record(v.string(), v.array(v.string())),
    ),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const prompt = clampStr(args.prompt, MAX_LEN.short);
    if (!prompt) throw new Error("Terminal prompt can't be empty.");
    const bootLines = args.bootLines
      .map((l) => ({
        type: BOOT_TYPES.includes(l.type as (typeof BOOT_TYPES)[number])
          ? (l.type as string)
          : "output",
        text: clampStr(l.text, MAX_LEN.medium),
      }))
      .slice(0, 40);
    const defaultCommands = args.defaultCommands
      .map((c) => clampStr(c, MAX_LEN.short))
      .filter((c) => c.length > 0)
      .slice(0, 12);
    const commandDescriptions = args.commandDescriptions ?? {};
    // Normalize custom responses: lowercase keys (commands are matched
    // case-insensitively), drop empties, cap length per line + per command.
    const commandResponses: Record<string, string[]> = {};
    if (args.commandResponses) {
      for (const [cmd, lines] of Object.entries(args.commandResponses)) {
        const key = cmd.trim().toLowerCase();
        if (!key) continue;
        const cleaned = lines
          .map((l) => clampStr(l, MAX_LEN.medium))
          .filter((l) => l.length > 0)
          .slice(0, 30);
        if (cleaned.length) commandResponses[key] = cleaned;
      }
    }
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, {
      terminal: {
        prompt,
        bootLines,
        defaultCommands,
        commandDescriptions,
        commandResponses,
      },
    });
  },
});

// ── Projects ────────────────────────────────────────────────────────────────────

export const updateBackground = mutation({
  args: {
    background: v.object({
      mode: v.union(v.literal("shader"), v.literal("image"), v.literal("custom")),
      colorBack: v.string(),
      colors: v.array(v.string()),
      softness: v.number(),
      intensity: v.number(),
      noise: v.number(),
      speed: v.number(),
      scale: v.number(),
      rotation: v.number(),
      offsetX: v.number(),
      offsetY: v.number(),
      shape: shaderShapeValidator,
      imageStorageId: v.optional(v.id("_storage")),
      customType: v.optional(v.union(v.literal("html"), v.literal("react"))),
      customCss: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, {
      background: {
        ...args.background,
        customType: args.background.customType ?? "html",
        customCss: args.background.customCss ?? "",
      },
    });
  },
});

export const upsertProject = mutation({
  args: {
    id: v.optional(v.id("projects")),
    name: v.string(),
    description: v.string(),
    technologies: v.array(v.string()),
    liveUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    shaderColors: v.optional(v.array(v.string())),
    shaderParams: v.optional(shaderParamsValidator),
    shaderMode: v.optional(
      v.union(v.literal("shader"), v.literal("image"), v.literal("custom")),
    ),
    customType: v.optional(v.union(v.literal("html"), v.literal("react"))),
    customCss: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const name = clampStr(args.name, MAX_LEN.short);
    const description = clampStr(args.description, MAX_LEN.medium);
    const technologies = args.technologies
      .map((t) => clampStr(t, MAX_LEN.short))
      .filter((t) => t.length > 0)
      .slice(0, 24);
    const liveUrl = args.liveUrl ? clampStr(args.liveUrl, MAX_LEN.url) : undefined;
    const githubUrl = args.githubUrl
      ? clampStr(args.githubUrl, MAX_LEN.url)
      : undefined;
    // Up to 3 hex colors; anything else is dropped. Null → default palette.
    const shaderColors = args.shaderColors
      ?.map((c) => (typeof c === "string" ? c.trim() : ""))
      .filter((c) => /^#?[0-9A-Fa-f]{3,8}$/.test(c))
      .slice(0, 3);
    // Clamp numeric shader params to safe ranges. Null → defaults at render time.
    const shaderParams = args.shaderParams
      ? {
        softness: clampNum(args.shaderParams.softness, 0, 1, 0.5),
        intensity: clampNum(args.shaderParams.intensity, 0, 1, 0.25),
        noise: clampNum(args.shaderParams.noise, 0, 1, 0),
        speed: clampNum(args.shaderParams.speed, 0, 4, 0.5),
        scale: clampNum(args.shaderParams.scale, 0.01, 4, 1.5),
        rotation: clampNum(args.shaderParams.rotation, 0, 360, 0),
        offsetX: clampNum(args.shaderParams.offsetX, -1, 1, 0),
        offsetY: clampNum(args.shaderParams.offsetY, -1, 1, 0),
        shape: args.shaderParams.shape,
      }
      : undefined;
    if (!name) throw new Error("Project name can't be empty.");

    const shaderMode = args.shaderMode ?? "shader";
    const customType = args.customType ?? "html";
    const customCss = args.customCss ? clampStr(args.customCss, MAX_LEN.long) : "";

    const patch: Record<string, unknown> = {
      name,
      description,
      technologies,
      liveUrl,
      githubUrl,
      ...(shaderColors ? { shaderColors } : {}),
      ...(shaderParams ? { shaderParams } : {}),
      shaderMode,
      customType,
      customCss,
    };

    if (args.id) {
      await ctx.db.patch(args.id, patch);
      return args.id;
    }
    // New project goes to the end of the list.
    const last = await ctx.db
      .query("projects")
      .withIndex("by_order")
      .order("desc")
      .first();
    const order = (last?.order ?? 0) + 1;
    return await ctx.db.insert("projects", {
      name,
      description,
      technologies,
      liveUrl,
      githubUrl,
      ...(shaderColors ? { shaderColors } : {}),
      ...(shaderParams ? { shaderParams } : {}),
      shaderMode,
      customType,
      customCss,
      order,
    });
  },
});

/** Clamp a number into [min,max], falling back to `fallback` when NaN. */
function clampNum(n: number, min: number, max: number, fallback: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const deleteProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await ctx.db.delete(args.id);
  },
});

export const reorderProject = mutation({
  args: { id: v.id("projects"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_order")
      .order("asc")
      .collect();
    const idx = projects.findIndex((p) => p._id === args.id);
    if (idx === -1) return;
    const swapIdx = args.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= projects.length) return;
    const a = projects[idx];
    const b = projects[swapIdx];
    // Swap the two orders.
    await ctx.db.patch(a._id, { order: b.order });
    await ctx.db.patch(b._id, { order: a.order });
  },
});

// ── Experience timeline ──────────────────────────────────────────────────────────

export const upsertExperience = mutation({
  args: {
    id: v.optional(v.id("experiences")),
    role: v.string(),
    company: v.string(),
    companySite: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.optional(v.boolean()),
    description: v.array(v.string()),
    technologies: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const role = clampStr(args.role, MAX_LEN.short);
    const company = clampStr(args.company, MAX_LEN.short);
    const companySite = args.companySite ? clampStr(args.companySite, MAX_LEN.url) : undefined;
    const startDate = clampStr(args.startDate, MAX_LEN.short);
    const endDate = args.endDate ? clampStr(args.endDate, MAX_LEN.short) : undefined;
    const description = args.description
      .map((d) => clampStr(d, MAX_LEN.medium))
      .filter((d) => d.length > 0)
      .slice(0, 8);
    const technologies = args.technologies
      .map((t) => clampStr(t, MAX_LEN.short))
      .filter((t) => t.length > 0)
      .slice(0, 24);
    if (!role) throw new Error("Role can't be empty.");
    if (!company) throw new Error("Company can't be empty.");

    const patch = {
      role,
      company,
      companySite,
      startDate,
      endDate,
      current: args.current ?? false,
      description,
      technologies,
    };

    if (args.id) {
      await ctx.db.patch(args.id, patch);
      return args.id;
    }
    const last = await ctx.db
      .query("experiences")
      .withIndex("by_order")
      .order("desc")
      .first();
    const order = (last?.order ?? 0) + 1;
    return await ctx.db.insert("experiences", { ...patch, order });
  },
});

export const deleteExperience = mutation({
  args: { id: v.id("experiences") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await ctx.db.delete(args.id);
  },
});

export const reorderExperience = mutation({
  args: { id: v.id("experiences"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const list = await ctx.db
      .query("experiences")
      .withIndex("by_order")
      .order("asc")
      .collect();
    const idx = list.findIndex((e) => e._id === args.id);
    if (idx === -1) return;
    const swapIdx = args.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    await ctx.db.patch(a._id, { order: b.order });
    await ctx.db.patch(b._id, { order: a.order });
  },
});

// ── Skills & Stack ─────────────────────────────────────────────────────────────────

export const updateSkills = mutation({
  args: {
    groups: v.array(
      v.object({
        label: v.string(),
        items: v.array(
          v.object({ name: v.string(), icon: v.optional(v.string()) }),
        ),
      }),
    ),
    note: v.string(),
    // Optional intro line (subtitle under the section header).
    intro: v.optional(v.string()),
    // Optional marquee layout. Clamped so a bad value can't break the animation.
    marquee: v.optional(
      v.object({
        rows: v.number(),
        baseSpeed: v.number(),
        alternateDirection: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const groups = args.groups
      .map((g) => ({
        label: clampStr(g.label, MAX_LEN.short),
        items: g.items
          .map((it) => ({
            name: clampStr(it.name, MAX_LEN.short),
            // Keep the icon key only if it's a non-empty string; the dashboard
            // sends "none" to clear an icon, which we normalize to undefined.
            icon:
              it.icon && it.icon !== "none"
                ? clampStr(it.icon, MAX_LEN.short)
                : undefined,
          }))
          .filter((it) => it.name.length > 0),
      }))
      .filter((g) => g.label.length > 0 && g.items.length > 0)
      .slice(0, 12);
    const note = clampStr(args.note, MAX_LEN.medium);
    // Keep intro only when non-empty; blank means "use the static default".
    const intro =
      args.intro && args.intro.trim().length > 0
        ? clampStr(args.intro, MAX_LEN.medium)
        : undefined;

    // Normalize marquee: clamp rows to 1–6, baseSpeed to 10–240s, default the
    // alternate-direction flag. Only stored when the owner actually sets it.
    const marquee = args.marquee
      ? {
        rows: Math.min(6, Math.max(1, Math.round(args.marquee.rows || 2))),
        baseSpeed: Math.min(
          240,
          Math.max(10, Math.round(args.marquee.baseSpeed || 70)),
        ),
        alternateDirection: args.marquee.alternateDirection !== false,
      }
      : undefined;

    const existing = await ctx.db.query("skills").first();
    if (existing) {
      await ctx.db.patch(existing._id, { groups, note, intro, marquee });
    } else {
      await ctx.db.insert("skills", { groups, note, intro, marquee });
    }
  },
});

// ── Resume upload (file storage) ─────────────────────────────────────────────────

export const createUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setResume = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, { resumeStorageId: args.storageId });
  },
});

/** Clear the custom resume so the site falls back to /public/resume.pdf. */
export const resetResume = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const id = await getOrCreateContent(ctx);
    await ctx.db.patch(id, { resumeStorageId: undefined });
  },
});

export const setBackgroundImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const id = await getOrCreateContent(ctx);
    const existing = (await ctx.db.get(id))?.background ?? DEFAULT_BACKGROUND;
    await ctx.db.patch(id, {
      background: {
        ...existing,
        mode: "image",
        imageStorageId: args.storageId,
      },
    });
  },
});

/** Upload a custom image for a single work card's header. */
export const setProjectImage = mutation({
  args: { id: v.id("projects"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found.");
    await ctx.db.patch(args.id, { imageStorageId: args.storageId });
  },
});

/** Clear a project's custom header image (falls back to the shader). */
export const clearProjectImage = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found.");
    await ctx.db.patch(args.id, { imageStorageId: undefined });
  },
});

// ── Seed (run once) ─────────────────────────────────────────────────────────────

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // One-time bootstrap: only creates the initial row if the table is empty.
    // Not owner-gated because `npx convex run` executes as a system caller with
    // no logged-in user; this only seeds public default content and is idempotent.
    const existing = await ctx.db.query("siteContent").first();
    if (existing) return existing._id;

    const contentId = await ctx.db.insert("siteContent", {
      hero: {
        constant: "Stay",
        rotating: ["Consistent", "Curious", "Shipping", "Building", "Learning"],
      },
      availability: "Open to internships & full-time roles",
      about: [
        "I'm a final year Computer Science undergraduate and full stack developer focused on building practical software that solves real world problems. I turn ideas into real, shipped products by combining full stack development, AI, automation, and computer vision. From scalable web applications to real time intelligent systems, I enjoy building products that are useful, reliable, and easy to use."
      ],
      objective:
        "I am seeking a Software Developer role where I can apply my skills in full stack development, AI, automation, and computer vision to build practical and impactful software. I enjoy solving real world problems, learning new technologies, and turning ideas into reliable products while growing as a software engineer.",

      socials: [
        { label: "GitHub", href: "https://github.com/CodeNexus404" },
        {
          label: "LinkedIn",
          href: "https://www.linkedin.com/in/sahil-shedge-a99401292/",
        },
        { label: "X / Twitter", href: "https://x.com/sahilshedge05" },
        { label: "Email", href: "mailto:shedgesahil2005@gmail.com" },
      ],
      terminal: {
        prompt: "sahil@portfolio:~$",
        bootLines: [
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
        ],
        defaultCommands: ["help", "whoami", "projects", "skills", "socials", "clear"],
      },
      background: DEFAULT_BACKGROUND,
    });

    const seedProjects = [
      {
        name: "SocialFlow",
        description:
          "AI-powered multi-platform content automation for creators — publish, schedule and analyze YouTube & Instagram content with AI-generated metadata, real-time analytics and n8n workflow automation.",
        technologies: ["React.js", "Prisma", "n8n automation", "Google APIs"],
        liveUrl: undefined as string | undefined,
        githubUrl: "https://github.com/CodeNexus404/SocialFlow",
      },
      {
        name: "Nexference",
        description:
          "AI coding gateway switcher — browse live free models across 14 AI gateways and apply the right Anthropic / OpenAI / Gemini config to Claude Code or any client in one click.",
        technologies: ["JavaScript", "Node.js", "LLMs", "Claude Code"],
        liveUrl: undefined as string | undefined,
        githubUrl: "https://github.com/CodeNexus404/Nexference",
      },
      {
        name: "Driver Safety AI",
        description:
          "Real-time computer-vision system that detects risky driving behaviors — phone usage, missing seatbelts, helmet violations — with YOLOv8 + OpenCV, providing live alerts and automated logging.",
        technologies: ["Python", "YOLOv8", "OpenCV", "Computer Vision"],
        liveUrl: undefined as string | undefined,
        githubUrl: "https://github.com/CodeNexus404/driver-safety-ai",
      },
      {
        name: "Poshara",
        description:
          "A platform connecting restaurants, NGOs and volunteers for surplus food distribution, using OCR & ML-based freshness assessment to route safe food to where it's needed.",
        technologies: ["OCR", "Machine Learning", "Web App"],
        liveUrl: "https://poshara.netlify.app/",
        githubUrl: "https://github.com/CodeNexus404/Poshara",
      },
    ];

    for (let i = 0; i < seedProjects.length; i++) {
      const p = seedProjects[i];
      await ctx.db.insert("projects", {
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        liveUrl: p.liveUrl,
        githubUrl: p.githubUrl,
        order: i + 1,
      });
    }

    return contentId;
  },
});

/** Get the singleton siteContent id, creating an empty placeholder if needed. */
async function getOrCreateContent(
  ctx: MutationCtx,
): Promise<Id<"siteContent">> {
  const existing = await ctx.db.query("siteContent").first();
  if (existing) return existing._id;
  return await ctx.db.insert("siteContent", {
    hero: { constant: "Stay", rotating: [] },
    availability: "Open to internships & full-time roles",
    about: [""],
    objective: "",
    socials: [],
    terminal: {
      prompt: "sahil@portfolio:~$",
      bootLines: [],
      defaultCommands: ["help", "whoami", "projects", "skills", "socials", "clear"],
    },
  });
}
