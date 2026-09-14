"use client";

import {
  Component,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { profile as staticProfile, selectedWorks, experience as staticExperience, skills as staticSkills } from "@/data/portfolio";
import type { Project } from "@/data/portfolio";

type TerminalBootLine = { type: string; text: string };

type SiteExperience = {
  id: string;
  role: string;
  company: string;
  companySite: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
  technologies: string[];
};

type SiteSkillItem = { name: string; icon?: string };
type SiteSkillGroup = { label: string; items: SiteSkillItem[] };

type SiteMarqueeConfig = {
  rows: number;
  baseSpeed: number;
  alternateDirection: boolean;
};

type SiteSkills = {
  groups: SiteSkillGroup[];
  note: string;
  /** Optional intro subtitle (null = use the static default). */
  intro: string | null;
  /** Optional marquee layout (rows / speed / direction). null = use defaults. */
  marquee: SiteMarqueeConfig | null;
};

type SiteTerminal = {
  prompt: string;
  bootLines: TerminalBootLine[];
  defaultCommands: string[];
  /** Editable description/response shown when a chip/command is run. */
  commandDescriptions?: Record<string, string>;
  /** Optional custom output lines per command (command → lines[]). */
  commandResponses?: Record<string, string[]>;
};

type SiteBackground = {
  mode: "shader" | "image" | "custom";
  colorBack: string;
  colors: string[];
  softness: number;
  intensity: number;
  noise: number;
  speed: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  shape: string;
  imageStorageId?: string;
  customType?: "html" | "react";
  customCss?: string;
};

type SiteContent = {
  /** Static profile with live CMS overrides merged in for editable fields. */
  profile: typeof staticProfile;
  /** Live projects when seeded; otherwise the static selectedWorks. */
  projects: Project[];
  /** Editable interactive-terminal content (boot text, prompt, quick chips). */
  terminal: SiteTerminal;
  /** Editable global background shader / image. */
  background: SiteBackground;
  /** Signed URL for the uploaded background image (when mode === "image"). */
  backgroundImageUrl: string | null;
  /** Editable experience timeline (fallback to static when unseeded). */
  experience: SiteExperience[];
  /** Editable skills & stack groups (fallback to static when unseeded). */
  skills: SiteSkills;
  /** True only while the editable query is still loading. */
  loading: boolean;
};

const EMPTY: SiteContent = {
  profile: staticProfile,
  projects: selectedWorks,
  terminal: {
    prompt: "sahil@portfolio:~$",
    bootLines: [],
    defaultCommands: ["help", "whoami", "projects", "skills", "socials", "clear"],
    commandDescriptions: {},
    commandResponses: {},
  },
  background: {
    mode: "shader",
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
    shape: "corners",
  },
  backgroundImageUrl: null,
  experience: staticExperience.map((e, i) => ({
    id: `static-${i}`,
    role: e.role,
    company: e.company,
    companySite: e.companySite ?? "",
    startDate: e.startDate,
    endDate: e.endDate ?? "",
    current: e.current ?? false,
    description: e.description,
    technologies: e.technologies,
  })),
  skills: { groups: staticSkills.groups, note: staticSkills.note, intro: null, marquee: null },
  loading: false,
};

const SiteContentContext = createContext<SiteContent>(EMPTY);

/** Normalize a live project (links split) to the static Project shape. */
function normalizeProject(p: {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  shaderColors?: string[];
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
  shaderMode?: string;
  customType?: string;
  customCss?: string;
  imageUrl?: string | null;
}): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    technologies: p.technologies,
    links: {
      live: p.liveUrl || undefined,
      github: p.githubUrl || undefined,
    },
    shaderColors: p.shaderColors,
    shaderParams: p.shaderParams,
    shaderMode: (p.shaderMode as Project["shaderMode"]) ?? "shader",
    customType: (p.customType as Project["customType"]) ?? "html",
    customCss: p.customCss ?? "",
    headerImageUrl: p.imageUrl ?? null,
  };
}

/**
 * Bridges the Convex/shim editable query into React context. If the query
 * errors, is null (unseeded) or is still loading, the static data is used so
 * the public site always renders. Only editable fields are overridden.
 */
function QueryBridge({ onData }: { onData: (next: SiteContent) => void }) {
  const data = useQuery(api.content.getEditable);

  useEffect(() => {
    // undefined = still loading, null = table not seeded yet → keep static.
    if (data === undefined || data === null) return;
    const liveProfile = {
      ...staticProfile,
      hero: data.content.hero,
      availability: data.content.availability,
      about: data.content.about,
      objective: data.content.objective,
      socials: data.content.socials,
      resumeHref: data.content.resumeUrl ?? staticProfile.resumeHref,
    };
    onData({
      profile: liveProfile,
      projects: data.projects.map(normalizeProject),
      terminal: data.content.terminal,
      background: data.background,
      backgroundImageUrl: data.backgroundImageUrl ?? null,
      // Fall back to the static cards when the live table is empty (unseeded) or
      // absent, so the three original experience entries never vanish.
      experience:
        data.experiences && data.experiences.length > 0
          ? data.experiences.map((e) => ({
              id: e.id,
              role: e.role,
              company: e.company,
              companySite: e.companySite ?? "",
              startDate: e.startDate,
              endDate: e.endDate ?? "",
              current: e.current ?? false,
              description: e.description,
              technologies: e.technologies,
            }))
          : EMPTY.experience,
      // Same guard for skills: keep the static groups until the owner edits them.
      skills:
        data.skills && data.skills.groups && data.skills.groups.length > 0
          ? {
              groups: data.skills.groups,
              note: data.skills.note,
              intro: data.skills.intro ?? null,
              marquee: data.skills.marquee ?? null,
            }
          : EMPTY.skills,
      loading: false,
    });
  }, [data, onData]);

  return null;
}

/** Falls back to static data if the editable query throws. */
class QueryErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(EMPTY);

  return (
    <SiteContentContext.Provider value={content}>
      <QueryErrorBoundary onError={() => setContent(EMPTY)}>
        <QueryBridge onData={setContent} />
      </QueryErrorBoundary>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext);
}
