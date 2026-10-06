"use client";
import { API_URL } from "../../lib/api";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeImage } from "../../components/theme-image";
import { ThemeSwitcher } from "../../components/theme-switcher";
import { Cog, User2, LogOut, Menu, X, Home, Compass, Bookmark, User } from "lucide-react";
import { authClient } from "../../lib/auth-client";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Opportunities", href: "/opportunities", icon: Compass },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Profile", href: "/profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Navigation indicator state (desktop pill)
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

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Find active nav index
  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (item.href === "/home") return pathname === "/home";
    return pathname.startsWith(item.href);
  });

  const updatePillPosition = () => {
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const activeEl = navRefs.current[activeIndex];
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    } else {
      setPillStyle({ left: 0, width: 0 });
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

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Handle Log out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
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
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileAvatar() {
      try {
        const apiUrl = API_URL;
        const res = await fetch(`${apiUrl}/api/profile`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.avatarUrl) {
            const url = data.profile.avatarUrl;
            setProfileAvatar(url.startsWith("/") ? `${apiUrl}${url}` : url);
          }
        }
      } catch {
        // ignore fallback
      }
    }
    if (session) {
      fetchProfileAvatar();
    }
  }, [session]);

  const avatarSrc = profileAvatar || user?.image;

  return (
    <div className="h-screen max-w-6xl mx-auto">
      {/* ── Desktop Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed left-1/2 -translate-x-1/2 top-0 z-50 w-full max-w-6xl px-4 sm:px-6 flex items-center justify-between py-5 bg-background/50 backdrop-blur-xl">
        <Link href={"/"} className="flex items-center gap-2 shrink-0">
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

        {/* Desktop nav pill — hidden on mobile */}
        <div ref={containerRef} className="relative text-sm hidden md:flex items-center gap-2">
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

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />

          {/* Desktop profile button */}
          <div className="rounded-full relative hidden md:block" ref={dropdownRef}>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              {avatarSrc ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border transition-transform hover:scale-105 duration-300">
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center p-3 bg-foreground rounded-full w-fit text-background transition-colors hover:bg-foreground/80 hover:text-primary-foreground duration-300 shadow-inner shadow-background">
                  <User2 strokeWidth={1.5} size={20} />
                </div>
              )}
            </div>

            {/* Desktop Profile Dropdown */}
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
                <Cog size={16} strokeWidth={1.3} />
                <p>Settings</p>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-sm flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 rounded-full duration-300 transition-colors hover:bg-muted disabled:opacity-50"
              >
                <LogOut size={16} strokeWidth={1.3} className="text-red-500" />
                <p>{isSigningOut ? "Signing out..." : "Sign out"}</p>
              </button>
            </div>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X size={20} strokeWidth={1.5} />
            ) : (
              <Menu size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ─────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-background border-l border-border flex flex-col transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            {avatarSrc ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center bg-foreground rounded-full text-background">
                <User2 size={16} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu footer */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Cog size={18} strokeWidth={1.3} />
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <LogOut size={18} strokeWidth={1.3} className="text-red-500" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pt-24 pb-10 px-4 sm:px-6">{children}</main>
    </div>
  );
}
