"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { profile } from "@/data/portfolio";
import { useSiteContent } from "@/hooks/use-site-content";

function SocialIcon({ label }: { label: string }) {
  if (label === "GitHub") return <Github className="size-4" />;
  if (label === "LinkedIn") return <Linkedin className="size-4" />;
  if (label.startsWith("X")) return <Twitter className="size-4" />;
  if (label === "Email") return <Mail className="size-4" />;
  return null;
}

export default function Footer() {
  const { profile: liveProfile } = useSiteContent();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-card/80 backdrop-blur-2xl text-foreground pt-8 pb-8 px-4 sm:px-8 md:px-12 border-t border-border/60"
    >
      <div className="max-w-7xl mx-auto flex flex-col">
        {/* Top Section Grid */}
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-8 md:gap-0">
          {/* Navigation Column */}
          <div className="order-1 md:order-1 w-full md:w-1/3 flex flex-col justify-start">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary/80 mb-4">Navigate</p>
            <div className="flex flex-col gap-2">
              {["About", "Skills", "Experience", "Work", "Contact"].map((link) => (
                <a key={link} href={`#${link.toLowerCase()}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Social Column */}
          <div className="order-2 md:order-2 w-full md:w-1/3 flex flex-col justify-start">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary/80 mb-4">Social</p>
            <div className="flex flex-col gap-2">
              {liveProfile.socials.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <SocialIcon label={social.label} />
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Connect Column */}
          <div className="order-3 md:order-3 w-full md:w-1/3 flex flex-col justify-start">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary/80 mb-4">Contact</p>
            <a href={`mailto:${profile.email}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors break-all">
              {profile.email}
            </a>
            <p className="mt-2 font-mono text-xs text-muted-foreground/60">{profile.location}</p>
          </div>
        </div>

        {/* Full Name — uppercase outlined wordmark; click scrolls back to top */}
        <button type="button" onClick={scrollToTop} className="group mt-12 overflow-hidden cursor-pointer" aria-label="Scroll to top">
          <p className="text-outline font-mono text-[clamp(3rem,10vw,8rem)] font-black uppercase leading-none tracking-tight select-none text-center">
            {profile.name}
          </p>
        </button>

        {/* Copyright Bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-6 font-mono text-[11px] text-muted-foreground/60 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          <p>Built with React &middot; Convex &middot; Tailwind &middot; Framer Motion</p>
        </div>
      </div>
    </motion.footer>
  );
}
