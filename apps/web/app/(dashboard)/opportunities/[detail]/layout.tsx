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
      const data = await res.json();
      if (data.opportunity) {
        return {
          title: data.opportunity.title,
          description: `Learn more about ${data.opportunity.title} at ${data.opportunity.organizationName || data.opportunity.organization || "this organization"}.`,
        };
      }
    }
  } catch {
    // Fetch failed or opportunity not found — fall through to default metadata
  }

  return {
    title: "Opportunity Details",
  };
}

export default function Layout({ children }: Props) {
  return <>{children}</>;
}
