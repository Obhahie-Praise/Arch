import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved",
  description: "View your saved opportunities and manage the ones you are pursuing.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
