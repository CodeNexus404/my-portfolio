/**
 * Temporary smoke test: server-renders Landing + Auth with full providers
 * to surface render-time crashes or unresolved imports. Deleted after running.
 */
import { createServer } from "vite";
import { renderToString } from "react-dom/server";
import React from "react";
import { MemoryRouter } from "react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
});

const client = new ConvexReactClient("https://test-123456.convex.cloud");

function withProviders(el) {
  return React.createElement(
    ConvexProvider,
    { client },
    React.createElement(MemoryRouter, null, el),
  );
}

async function check(label, load) {
  try {
    const mod = await load();
    const html = renderToString(withProviders(React.createElement(mod.default)));
    console.log(`✓ ${label} rendered (${html.length} chars)`);
    return html;
  } catch (err) {
    console.error(`✗ ${label} FAILED:`, err?.message ?? err);
    if (err?.stack)
      console.error(err.stack.split("\n").slice(0, 8).join("\n"));
    return null;
  }
}

const landing = await check("Landing", () =>
  vite.ssrLoadModule("/src/pages/Landing.tsx"),
);
if (landing) {
  for (const marker of [
    "Initializing portfolio",
    "Full-Stack Developer",
    "whoami",
    "About",
  ]) {
    console.log(
      `${landing.includes(marker) ? "✓" : "✗"} Landing contains "${marker}"`,
    );
  }
}

await check("Auth", () => vite.ssrLoadModule("/src/pages/Auth.tsx"));
await check("NotFound", () => vite.ssrLoadModule("/src/pages/NotFound.tsx"));

await vite.close();
process.exit(0);
