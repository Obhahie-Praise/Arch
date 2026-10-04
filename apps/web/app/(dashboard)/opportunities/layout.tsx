import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Discover and search through opportunities matched to your profile.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
