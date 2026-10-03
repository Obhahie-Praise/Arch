"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeImage } from "../../components/theme-image";
import { ThemeSwitcher } from "../../components/theme-switcher";
import { Cog, User2 } from "lucide-react";
import { authClient } from "../../lib/auth-client";

const NAV_ITEMS = [
  { label: "Home", href: "/home" },
  { label: "Oppurtunitites", href: "/opportunities" },
  { label: "Saved", href: "/saved" },
  { label: "Profile", href: "/profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Navigation indicator state
  const containerRef = useRef<HTMLDivElement>(null);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  // Profile dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find active nav index
  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (item.href === "/home") return pathname === "/home";
    return pathname.startsWith(item.href);
  });

  // Update animated indicator position
  const updatePillPosition = () => {
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const activeEl = navRefs.current[activeIndex];
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    }
  };

  useLayoutEffect(() => {
    updatePillPosition();
  }, [pathname, activeIndex]);

  useEffect(() => {
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [pathname, activeIndex]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  // Handle Log out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsDropdownOpen(false);
    try {
      await authClient.signOut();
    } catch {
      // ignore
    } finally {
      setIsSigningOut(false);
      router.push("/signin");
      router.refresh();
    }
  };

  const user = session?.user;
  const displayName = user?.name || "Praise Ose";
  const displayEmail = user?.email || "obhahiepraise@gmail.com";

  return (
    <div className="h-screen max-w-6xl mx-auto">
      <nav className="fixed left-1/2 -translate-x-1/2 top-0 z-50 min-w-6xl flex items-center justify-between py-5">
        <Link href={"/"} className="flex items-center gap-2">
          <ThemeImage
            srcLight="/logo-lightmode.jpg"
            srcDark="/logo-darkmode.jpg"
            alt="Arch logo"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <p className="font-display text-xl">Arch</p>
        </Link>

        {/* Navigation bar with animated sliding pill */}
        <div ref={containerRef} className="relative text-sm flex items-center gap-2">
          {pillStyle.width > 0 && (
            <span
              className="absolute top-0 bottom-0 rounded-full bg-foreground transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
              }}
            />
          )}
          {NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={item.href}
                ref={(el) => {
                  navRefs.current[index] = el;
                }}
                href={item.href}
                className={`relative z-10 py-2.5 px-4 rounded-full transition-colors duration-300 cursor-pointer ${
                  isActive
                    ? "text-background"
                    : "hover:text-primary/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="rounded-full relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <div className="flex items-center justify-center p-3 bg-foreground rounded-full w-fit text-background transition-colors hover:bg-foreground/80 hover:text-primary-foreground duration-300 shadow-inner shadow-background">
                <User2 strokeWidth={1.5} size={20} />
              </div>
            </div>

            {/* Animated Profile Dropdown */}
            <div
              className={`absolute top-full right-0 mt-2 w-56 bg-background rounded-3xl shadow-lg p-2 z-10 border border-border transition-all duration-200 ease-out origin-top-right ${
                isDropdownOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="px-2 py-3 border-b-2 border-border">
                <p className="leading-none text-sm">{displayName}</p>
                <span className="leading-none text-muted-foreground text-xs font-normal truncate block mt-0.5">
                  {displayEmail}
                </span>
              </div>
              <Link
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="text-sm flex items-center gap-2 px-3 py-1.5 rounded-full duration-300 transition-colors hover:bg-muted mt-1.5"
              >
                <Cog size={16} strokeWidth={1.3} className="" />
                <p className="">Settings</p>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-sm flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 rounded-full duration-300 transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Cog size={16} strokeWidth={1.3} className="text-red-500" />
                <p className="">{isSigningOut ? "Signing out..." : "Sign out"}</p>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto pt-20 pb-10">{children}</main>
    </div>
  );
}
