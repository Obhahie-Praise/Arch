import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "View your personalized opportunity recommendations and track your progress.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
