import type { Metadata } from "next";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ detail: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
  const { detail } = await params;
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  try {
    const res = await fetch(`${apiUrl}/api/opportunities/${detail}`, {
      headers: { cookie },
    });

    if (res.ok) {
      const json = await res.json();
      const opp = json.data;

      if (opp?.title) {
        const org: string | undefined =
          opp.organizationName || opp.organization || undefined;

        // "React Developer — Acme" or just "React Developer" when org is absent
        const title = org ? `${opp.title} — ${org}` : opp.title;

        // Prefer stored description; fall back to a constructed sentence
        const description: string =
          opp.description
            ? opp.description.slice(0, 160).trimEnd()
            : org
              ? `${opp.title} is an opportunity from ${org}. Discover whether it is right for you on Arch.`
              : `${opp.title} — explore this opportunity on Arch.`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            type: "article",
          },
          twitter: {
            card: "summary",
            title,
            description,
          },
        };
      }
    }
  } catch {
    // Network failure or non-JSON response — fall through to default
  }

  return {
    title: "Opportunity",
    description: "Explore this opportunity on Arch.",
  };
}

export default function Layout({ children }: Props) {
  return <>{children}</>;
}
