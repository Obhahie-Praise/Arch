import { ReactNode } from "react";
import { ThemeImage } from "../../components/theme-image";
import Link from "next/link";

interface SigninLayoutProps {
  children: ReactNode;
}

export default function SigninLayout({ children }: SigninLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href={"/"}>
          <ThemeImage
            srcLight="/logo-lightmode.jpg"
            srcDark="/logo-darkmode.jpg"
            alt="Arch logo"
            width={30}
            height={30}
            className="rounded-lg"
          />
        </Link>
        <p className="text-muted-foreground text-sm">
          You are signin into{" "}
          <span className="font-medium font-display text-foreground">Arch</span>
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        {children}
      </div>
      <div className="flex items-center justify-center">
        <p className="text-xs py-4 text-muted-foreground max-w-150 text-center">
          Arch uses AI to help you discover and match with opportunities.
          Results aren't guaranteed to be complete, the best fit, or a path to
          acceptance.
        </p>
      </div>
    </div>
  );
}
