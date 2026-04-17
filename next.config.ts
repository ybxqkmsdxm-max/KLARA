import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Suppress dev error overlay (the "1 Issue" badge)
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  allowedDevOrigins: [
    "preview-chat-934ea119-38d5-4eef-af4e-81353e3f24f5.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
