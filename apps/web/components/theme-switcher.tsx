"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-transparent text-foreground border border-transparent cursor-pointer transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2 motion-reduce:transition-none"
        aria-label="Toggle theme"
        title="Toggle theme"
        disabled
      >
        <div className="relative w-5 h-5">
          <span className="absolute inset-0 w-5 h-5 opacity-0 scale-50 -rotate-90 transition-all duration-300 motion-reduce:transition-none" />
        </div>
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIconClass = (active: boolean) => 
    `absolute inset-0 w-5 h-5 transition-all duration-300 motion-reduce:transition-none ${
      active ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
    }`;

  return (
    <button
      onClick={cycleTheme}
      className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-transparent text-foreground border border-transparent cursor-pointer transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2 motion-reduce:transition-none"
      aria-label={`Toggle theme (current: ${theme})`}
      title={`Current theme: ${theme}. Click to change.`}
    >
      <div className="relative w-5 h-5">
        <Sun className={getIconClass(theme === "light")} />
        <Moon className={getIconClass(theme === "dark")} />
        <Monitor className={getIconClass(theme === "system")} />
      </div>
    </button>
  );
}
