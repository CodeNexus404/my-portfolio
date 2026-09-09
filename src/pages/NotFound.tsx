import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col bg-background"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-sm text-primary">// 404 — not_found</p>
        <h1 className="mt-4 text-7xl font-bold tracking-tighter text-outline sm:text-8xl">
          404
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          This page doesn&apos;t exist (or moved).
        </p>
        <Button asChild className="mt-8 rounded-full">
          <a href="/">
            <ArrowLeft className="mr-2 size-4" />
            Back to home
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
