"use client";

import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import SectionHeader from "./SectionHeader";
import Spotlight from "./Spotlight";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { profile } from "@/data/portfolio";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <SectionHeader number="06" title="Contact" align="right" />

        {/* Unified card — info side and form share one connected container
            with a divider between them (instead of two separate cards). */}
        <div className="mt-12 flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-black/40 backdrop-blur-xl md:flex-row">
          {/* Info side */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6 p-6 sm:p-8 md:w-1/2"
          >
            <p className="font-display text-3xl font-bold leading-snug tracking-tight text-foreground sm:text-4xl">
              Let's build something
              <span className="text-accent"> together</span>.
            </p>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              I'm always open to new opportunities, collaborations, or just a
              chat about tech. Drop me a message and I'll get back to you.
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="group inline-flex w-fit items-center gap-2 font-mono text-sm text-accent transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              {profile.email}
            </a>
            <div className="flex flex-wrap gap-2">
              {profile.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-white/[0.08] bg-black/40 px-4 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur-xl transition-all duration-200 hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                >
                  {social.label}
                </a>
              ))}
            </div>
            <p className="font-mono text-xs text-muted-foreground/60">
              {profile.location} · {profile.availability}
            </p>
          </motion.div>

          {/* Divider between the two connected halves (vertical on desktop) */}
          <div className="border-t border-white/[0.06] md:border-t-0 md:border-l md:w-px md:bg-white/[0.06]" aria-hidden />

          {/* Form side */}
          <Spotlight className="md:w-1/2">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full flex-col gap-4 rounded-2xl border border-white/[0.06] bg-black/90 p-6 backdrop-blur-xl sm:rounded-3xl sm:p-8"
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                    <Send className="size-5 text-accent" />
                  </div>
                  <p className="font-serif text-xl text-foreground">Message sent!</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    I'll get back to you soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 font-mono text-xs text-accent transition-colors hover:text-foreground"
                  >
                    send_another()
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border border-white/20 bg-black/80 px-4 py-3 font-mono text-sm text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-white/5 placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-accent/50 focus:ring-accent/20 focus:bg-black/90"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl border border-white/20 bg-black/80 px-4 py-3 font-mono text-sm text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-white/5 placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-accent/50 focus:ring-accent/20 focus:bg-black/90"
                  />
                  <textarea
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="resize-none rounded-xl border border-white/20 bg-black/80 px-4 py-3 font-mono text-sm text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ring-1 ring-white/5 placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-accent/50 focus:ring-accent/20 focus:bg-black/90"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="liquid-glass-accent inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-mono text-sm transition-all duration-300 hover:border-accent/60 disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        send_message()
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.form>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}