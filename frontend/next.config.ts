import type { NextConfig } from "next";
import path from "node:path";

// Pin the tracing root: a stray lockfile higher up the tree otherwise makes
// Next guess the wrong workspace root and pull unrelated files into the build.
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
