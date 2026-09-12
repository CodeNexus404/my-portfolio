"use client";
import { motion } from "framer-motion";
import { Calendar, ExternalLink } from "lucide-react";
import SectionHeader from "./SectionHeader";
import Spotlight from "./Spotlight";
import TechBadge from "./TechBadge";
import { useSiteContent } from "@/hooks/use-site-content";

type ExperienceItemData = {
  role: string;
  company: string;
  companySite: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
  technologies: string[];
};

function ExperienceItem({ item, index }: { item: ExperienceItemData; index: number }) {
  const dateRange = item.current ? `${item.startDate} — Present` : `${item.startDate} — ${item.endDate}`;
  return (
    <Spotlight className="w-full rounded-2xl sm:rounded-3xl">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }} className="card-static group relative w-full rounded-2xl border p-6 transition-all duration-300 hover:border-accent/40 hover:bg-accent/5 sm:rounded-3xl sm:p-8">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            {item.companySite ? (
              <a href={item.companySite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-display text-xl tracking-tight text-foreground transition-colors hover:text-accent sm:text-2xl">
                <span>{item.company}</span>
                <ExternalLink className="size-4 shrink-0 text-accent opacity-70 transition-opacity group-hover:opacity-100" />
              </a>
            ) : (
              <span className="font-display text-xl tracking-tight text-foreground sm:text-2xl">{item.company}</span>
            )}
            <p className="font-mono text-xs font-semibold tracking-wide text-accent sm:text-sm">{item.role}</p>
          </div>
          <span className="liquid-glass inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 font-mono text-xs font-medium sm:self-auto">
            <Calendar className="size-3.5 text-accent" />{dateRange}
          </span>
        </div>
        <ul className="mt-5 flex flex-col gap-2.5 font-sans text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {item.description.map((desc, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: i * 0.05 + 0.1 }} className="relative pl-5 before:absolute before:left-0 before:top-2 before:size-1.5 before:rounded-full before:bg-accent">
              {desc}
            </motion.li>
          ))}
        </ul>
        {item.technologies.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {item.technologies.map((tech) => (<TechBadge key={tech} name={tech} />))}
          </div>
        ) : null}
      </motion.div>
    </Spotlight>
  );
}

export default function ExperienceSection() {
  const { experience } = useSiteContent();
  return (
    <section id="experience" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <SectionHeader number="04" title="Experience" align="left" />
        <div className="flex w-full flex-col gap-6 sm:gap-8">
          {experience.map((item, index) => (<ExperienceItem key={item.id} item={item} index={index} />))}
        </div>
      </div>
    </section>
  );
}