import Link from "next/link";
import { ThemeImage } from "../../components/theme-image";
import { ThemeSwitcher } from "../../components/theme-switcher";
import { ChevronDown, Cog, User2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen max-w-6xl mx-auto">
      <nav className="fixed left-1/2 -translate-x-1/2 top-0 z-50 min-w-6xl flex items-center justify-between py-5">
        <h1 className="flex items-center gap-2">
          <ThemeImage
            srcLight="/logo-lightmode.jpg"
            srcDark="/logo-darkmode.jpg"
            alt="Arch logo"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <p className="font-display text-xl">Arch</p>
        </h1>
        <div className="text-sm flex items-center gap-2">
          <Link
            href={"/home"}
            className="py-2.5 px-4 text-background bg-foreground rounded-full transition-colors cursor-pointer"
          >
            Home
          </Link>
          <Link
            href={"/opportunities"}
            className="py-2.5 px-4 rounded-full transition-colors hover:text-primary/70 cursor-pointer"
          >
            Oppurtunitites
          </Link>
          <Link
            href={"/saved"}
            className="py-2.5 px-4 rounded-full transition-colors hover:text-primary/70 cursor-pointer"
          >
            Saved
          </Link>
          <Link
            href={"/profile"}
            className="py-2.5 px-4 rounded-full transition-colors hover:text-primary/70 cursor-pointer"
          >
            Profile
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className=" rounded-full relative">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="flex items-center justify-center p-3 bg-foreground rounded-full w-fit text-background transition-colors hover:bg-foreground/80 hover:text-primary-foreground duration-300 shadow-inner shadow-background">
                <User2 strokeWidth={1.5} size={20} />
              </div>
            </div>
            <div className="absolute top-full right-0 mt-2 w-56 bg-background rounded-3xl shadow-lg p-2 z-10 border border-border">
              <div className="px-2 py-1 border-b-2 border-border">
                <p className="leading-none text-sm">Praise Ose</p>
                <span className="leading-none text-muted-foreground text-xs">
                  obhahiepraise@gmail.com
                </span>
              </div>
              <Link href={"/settings"} className="text-sm flex items-center gap-2 px-3 py-1.5 rounded-full duration-300 transition-colors hover:bg-muted mt-1.5">
                <Cog size={16} strokeWidth={1.3} className=""/>
                <p className="">Settings</p>
              </Link>
              <button className="text-sm flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 rounded-full duration-300 transition-colors hover:bg-muted">
                <Cog size={16} strokeWidth={1.3} className="text-red-500"/>
                <p className="">Sign out</p>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto pt-20 pb-10">{children}</main>
    </div>
  );
}
