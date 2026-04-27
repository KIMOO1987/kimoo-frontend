import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/signals",
        // FIXED: use env var instead of hardcoded Supabase project URL, with fallback to prevent crash
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'}/functions/v1/get-signal`,
      },
    ];
  },
};

export default nextConfig;
