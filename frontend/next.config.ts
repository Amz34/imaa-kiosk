import type { NextConfig } from "next";
import path from "node:path";

// The kiosk UI is fully client-side, so it ships as a static export and can be
// served from Cloudflare Pages with no Node runtime in the request path.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
