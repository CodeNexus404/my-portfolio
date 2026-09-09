import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { profile, selectedWorks } from "@/data/portfolio";
import SectionHeader from "./SectionHeader";
import WorkCard from "./WorkCard";

export default function Projects() {
  const githubHref = profile.socials.find((s) => s.label === "GitHub")?.href;
  return (
    <section id="work" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeader number="05" title="Work" align="right" />
          {githubHref ? (
            <motion.a initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} href={githubHref} target="_blank" rel="noreferrer" className="group mb-16 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground">
              more_on_github()
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </motion.a>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2">
          {selectedWorks.map((project, index) => (<WorkCard key={project.id} project={project} index={index} />))}
        </div>
      </div>
    </section>
  );
}