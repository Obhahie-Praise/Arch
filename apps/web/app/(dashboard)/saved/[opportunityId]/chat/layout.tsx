import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with Arch to prepare for this opportunity.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
