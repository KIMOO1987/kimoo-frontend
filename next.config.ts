import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/signals",
        // FIXED: use env var instead of hardcoded Supabase project URL
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-signal`,
      },
    ];
  },
};

export default nextConfig;
