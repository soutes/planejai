import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Força tracing root em apps/web pra standalone gerar server.js na raiz
  // (sem isso, lockfile no repo root faz Next detectar monorepo e gerar .next/standalone/apps/web/server.js)
  outputFileTracingRoot: path.join(process.cwd()),
  turbopack: {
    root: path.join(process.cwd()),
  },
};

export default nextConfig;
