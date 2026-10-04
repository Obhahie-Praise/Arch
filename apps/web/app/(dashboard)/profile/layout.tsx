import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile, experiences, and preferences to get better opportunity matches.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
