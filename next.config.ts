import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Faz'aa's own logo lockups (master-mark.svg etc.) are served through
    // next/image. They are first-party assets, so SVG rendering is safe here.
    dangerouslyAllowSVG: true,
  },
  experimental: {
    // Verification documents can be up to 10 MB — server actions cap at 1 MB by default.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
