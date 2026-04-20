import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/signals",
        destination: "https://mdchezakdhcwnoelwiye.supabase.co/functions/v1/get-signal",
      },
    ];
  },
};

export default nextConfig;
