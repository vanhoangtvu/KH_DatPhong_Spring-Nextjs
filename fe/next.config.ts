import type { NextConfig } from "next";

const extractHost = (value?: string) => {
  if (!value) return "";
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").split(":")[0];
  }
};

const allowedDevOrigins: string[] = [
  "localhost",
  "127.0.0.1",
  process.env.PUBLIC_IP,
  process.env.SERVER_PUBLIC_IP,
  process.env.NEXT_PUBLIC_HOST,
  extractHost(process.env.NEXT_PUBLIC_API_BASE_URL),
].filter((value): value is string => Boolean(value));

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
