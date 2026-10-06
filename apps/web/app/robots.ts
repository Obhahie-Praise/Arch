import type { MetadataRoute } from "next";

/**
 * Next.js App Router robots — auto-served at /robots.txt
 *
 * Allows all public content, disallows authenticated dashboard routes,
 * and points crawlers to the sitemap.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://arch.obhahiepraise.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/home",
          "/opportunities",
          "/saved",
          "/profile",
          "/settings",
          "/auth",
          "/signin",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
