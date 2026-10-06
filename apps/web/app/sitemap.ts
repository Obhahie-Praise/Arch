import type { MetadataRoute } from "next";

/**
 * Next.js App Router sitemap — auto-served at /sitemap.xml
 *
 * Only publicly accessible pages with genuine search-engine value are included.
 *
 * Excluded (authentication required — enforced by middleware):
 *   /home, /opportunities/*, /saved/*, /profile, /settings
 *
 * Excluded (auth flows — no search value):
 *   /auth, /auth/email, /signin, /signin/email
 *
 * The production base URL is read from NEXT_PUBLIC_APP_URL, falling back to
 * the established production domain used throughout the application.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://arch.obhahiepraise.workers.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
