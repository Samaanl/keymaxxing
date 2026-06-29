import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // fast HMR in dev
  register: true,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint isn't configured for this project; TypeScript stays the safety net.
  eslint: { ignoreDuringBuilds: true },
  // Hide the floating Next.js dev indicator ("N" badge) — it's dev-only anyway.
  devIndicators: false,
};

export default withPWA(nextConfig);
