import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have type definitions
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 's3.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.anilist.co',
      },
    ],
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 開発環境では無効化
});

export default pwaConfig(nextConfig);
