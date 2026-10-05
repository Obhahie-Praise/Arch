/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by @opennextjs/cloudflare — produces .next/standalone which the
  // OpenNext bundler reads to generate the Cloudflare Worker bundle.
  output: "standalone",
};

export default nextConfig;
