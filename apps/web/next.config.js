/** @type {import('next').NextConfig} */
const nextConfig = {
  // `output: "standalone"` is required by @opennextjs/cloudflare — it produces
  // .next/standalone which the OpenNext bundler reads to generate the Worker bundle.
  //
  // Vercel's own build integration is incompatible with standalone output: its
  // onBuildComplete hook expects .next/next-server.js.nft.json, which Next.js
  // does not produce when output is set to "standalone".
  //
  // Vercel sets VERCEL=1 in every build environment. We use that to opt out of
  // standalone mode on Vercel while keeping it for the Cloudflare deployment.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
