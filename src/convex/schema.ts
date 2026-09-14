import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// ── Reusable GrainGradient shader-param validators ─────────────────────────────
// Mirrors the props accepted by @paper-design/shaders-react <GrainGradient />:
// softness, intensity, noise, speed, scale, rotation, offsetX, offsetY, shape.
// Colors are stored separately (shaderColors for cards, `colors` for the global
// background) because they're arrays of hex strings, not single numbers.
export const shaderShapeValidator = v.union(
  v.literal("wave"),
  v.literal("dots"),
  v.literal("truchet"),
  v.literal("corners"),
  v.literal("ripple"),
  v.literal("blob"),
  v.literal("sphere"),
);

export const shaderParamsValidator = v.object({
  softness: v.number(),
  intensity: v.number(),
  noise: v.number(),
  speed: v.number(),
  scale: v.number(),
  rotation: v.number(),
  offsetX: v.number(),
  offsetY: v.number(),
  shape: shaderShapeValidator,
});

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // contact form submissions from the portfolio
    contactMessages: defineTable({
      name: v.string(),
      email: v.string(),
      message: v.string(),
      read: v.boolean(),
      reply: v.optional(v.string()),
      repliedAt: v.optional(v.number()),
    }),

    // Editable site content (owner CMS). Singleton — at most one row.
    siteContent: defineTable({
      hero: v.object({
        constant: v.string(),
        rotating: v.array(v.string()),
      }),
      availability: v.string(),
      about: v.array(v.string()),
      objective: v.string(),
      socials: v.array(
        v.object({ label: v.string(), href: v.string() }),
      ),
      resumeStorageId: v.optional(v.id("_storage")),
      // Interactive-terminal content: boot text, prompt label, and the
      // quick-action chips. Each boot line carries a `type` so the terminal
      // can color it (system / loading / accent / output / input / header /
      // error / link) exactly like the original static BOOT_LINES.
      terminal: v.optional(
        v.object({
          prompt: v.string(),
          bootLines: v.array(
            v.object({ type: v.string(), text: v.string() }),
          ),
          defaultCommands: v.array(v.string()),
          // Editable description/response shown when a chip/command is run.
          commandDescriptions: v.optional(v.record(v.string(), v.string())),
          // Optional custom output lines per command. When a command has an entry
          // here, the public terminal shows these lines instead of its built-in
          // logic — so the owner can fully rewrite any command's answer. Commands
          // without an entry keep their live, data-driven default output.
          commandResponses: v.optional(
            v.record(v.string(), v.array(v.string())),
          ),
        }),
      ),
      // Global background shader (the site's animated backdrop). `mode` switches
      // between the live GrainGradient shader and a static uploaded image. Colors
      // + numeric params mirror <GrainGradient /> so the dashboard can edit them.
      background: v.optional(
        v.object({
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
      ),
    }),

    // Work projects — ordered via `order`.
    projects: defineTable({
      name: v.string(),
      description: v.string(),
      technologies: v.array(v.string()),
      liveUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
      order: v.number(),
      // Per-card shader gradient (3 hex colors). Null → default palette by index.
      shaderColors: v.optional(v.array(v.string())),
      // Per-card shader numeric params (mirrors <GrainGradient />). Null → defaults.
      shaderParams: v.optional(shaderParamsValidator),
      // Header render mode: "shader" (default WebGL), "image" (uploaded), "custom" (HTML/CSS/React).
      shaderMode: v.optional(v.union(v.literal("shader"), v.literal("image"), v.literal("custom"))),
      // Custom header source type when shaderMode === "custom": "html" (HTML/CSS) or "react" (JSX).
      customType: v.optional(v.union(v.literal("html"), v.literal("react"))),
      // Custom header source (HTML/CSS or React JSX) when shaderMode === "custom".
      customCss: v.optional(v.string()),
      // Uploaded header image storage id (shaderMode === "image").
      imageStorageId: v.optional(v.id("_storage")),
    }).index("by_order", ["order"]),

    // Experience timeline entries (owner-editable from the dashboard). Ordered via `order`.
    experiences: defineTable({
      role: v.string(),
      company: v.string(),
      companySite: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      current: v.optional(v.boolean()),
      description: v.array(v.string()),
      technologies: v.array(v.string()),
      order: v.number(),
    }).index("by_order", ["order"]),

    // Skills & Stack — grouped chips that scroll in the marquee. Owner-editable.
    // Each item is { name, icon? } where `icon` is an optional key into the
    // brand library (skillBrands/extraIcons in skillBrands.ts). When absent,
    // the public site falls back to name-based logo lookup.
    skills: defineTable({
      groups: v.array(
        v.object({
          label: v.string(),
          items: v.array(
            v.object({ name: v.string(), icon: v.optional(v.string()) }),
          ),
        }),
      ),
      note: v.string(),
      // Optional intro line shown under the section header (above the marquee).
      // When absent the public site falls back to the static default.
      intro: v.optional(v.string()),
      // Marquee layout: number of scroll rows, base loop duration (seconds),
      // and whether odd rows scroll in reverse. Optional so older rows keep
      // the default (2 rows, 70s, alternating).
      marquee: v.optional(
        v.object({
          rows: v.number(),
          baseSpeed: v.number(),
          alternateDirection: v.boolean(),
        }),
      ),
    }),

    // add other tables here

    // tableName: defineTable({
    //   ...
    //   // table fields
    // }).index("by_field", ["field"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
