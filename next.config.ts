import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move it here, OUTSIDE of experimental
  allowedDevOrigins: ['192.168.1.7', 'localhost:3000'],
  
  /* other options if you have them */
};

export default nextConfig;