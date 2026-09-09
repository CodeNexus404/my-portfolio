import { vlyPlugin } from "@vly-ai/integrations";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // ── Backend selection: real Convex vs offline shim ─────────────────────
  // If VITE_CONVEX_URL is set (e.g. in .env.local or the shell), the app
  // talks to a real Convex deployment. If it's absent, the three backend
  // imports are aliased to the local no-network shim under ./shim (backed
  // by src/data/mock-backend.json) so the app runs fully offline — handy
  // for previewing/developing without `npx convex dev` running.
  const env = loadEnv(mode, process.cwd(), "");
  const useShim = !env.VITE_CONVEX_URL;
  // Specific specifiers must precede the catch-all "@" alias below.
  const shimAliases: Record<string, string> = useShim
    ? {
        "@/convex/_generated/api": path.resolve(__dirname, "./shim/api.ts"),
        "convex/react": path.resolve(__dirname, "./shim/convex-react.ts"),
        "@convex-dev/auth/react": path.resolve(
          __dirname,
          "./shim/convex-auth-react.ts",
        ),
      }
    : {};

  return {
    plugins: [react(), vlyPlugin(), tailwindcss()],
    resolve: {
      alias: {
        ...shimAliases,
        "@": path.resolve(__dirname, "./src"),
      },
    // Force a single copy of React across all packages (including vlyPlugin).
    // Without this, @vly-ai/integrations can resolve its own React copy, which
    // triggers "Invalid hook call" errors at runtime.
    dedupe: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  },
  build: {
    // Enable source maps for better debugging (disable in production if needed)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and lazy loading
        manualChunks: {
          // Vendor chunks for large libraries
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'convex-vendor': ['convex'],
          // Large UI library chunks
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // Heavy optional libraries - separate chunks for better lazy loading
          'framer-motion': ['framer-motion'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
        // Optimize chunk size
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit for better chunking
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for better optimization
    target: 'esnext',
    // Minify options - using esbuild (faster than terser)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    // Only scan the app entry HTML; avoids crawling unrelated *.html files
    // if a legacy snapshot accidentally contains leaked package folders.
    entries: ['index.html'],
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      'framer-motion',
      ...(useShim ? [] : ['@convex-dev/auth/react']),
    ],
    // When the shim is active, keep the shim'd specifiers as source so the
    // resolve.alias above redirects them to ./shim instead of the real
    // convex packages.
    ...(useShim ? { exclude: ['@convex-dev/auth/react', 'convex/react'] } : {}),
  },
  // Performance hints
  server: {
    // Bind to all interfaces so WebContainer's server-ready event fires.
    host: true,
    port: 5173,
    // Keep HMR on, but disable full-screen error overlay
    hmr: {
      overlay: false,
    },
  },
  };
});
