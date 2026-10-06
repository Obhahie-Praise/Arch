"use client";

/**
 * @author: @dorianbaffier
 * @description: Social Button
 * @version: 1.1.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import type { SvgIconComponent } from "@mui/icons-material";
import { Link } from "lucide-react";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import LanguageIcon from "@mui/icons-material/Language";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareItem {
  icon: SvgIconComponent;
  label: string;
  href: string;
}

interface SocialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  items?: ShareItem[];
  onShare?: (index: number, item: ShareItem) => void;
  className?: string;
}

const DEFAULT_SHARE_ITEMS: ShareItem[] = [
  {
    icon: XIcon,
    label: "Twitter",
    href: "https://twitter.com/praizedevx",
  },
  {
    icon: LinkedInIcon,
    label: "LinkedIn",
    href: "https://linkedin.com/in/praise-d-builder-743b92426/",
  },
  {
    icon: GitHubIcon,
    label: "GitHub",
    href: "https://github.com/Obhahie-Praise",
  },
  {
    icon: LanguageIcon,
    label: "Portfolio",
    href: "https://creative-praise.vercel.app",
  },
];

export default function SocialButton({
  label = "Share",
  items = DEFAULT_SHARE_ITEMS,
  onShare,
  className,
  ...props
}: SocialButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleShare = (index: number, item: ShareItem) => {
    setActiveIndex(index);
    onShare?.(index, item);
    setTimeout(() => setActiveIndex(null), 300);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={(e) => {
        // Only hide when focus leaves the entire container
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsVisible(false);
        }
      }}
    >
      <motion.div
        animate={{
          opacity: isVisible ? 0 : 1,
          pointerEvents: isVisible ? "none" : "auto",
        }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
      >
        <Button
          className={cn(
            "relative min-w-40",
            "bg-background/20 backdrop-blur-sm",
            "hover:bg-gray-50 dark:hover:bg-gray-950",
            "text-foreground",
            "border border-border",
            "transition-colors duration-200",
            className
          )}
          {...props}
        >
          <span className="flex items-center gap-2 px-6 py-3">
            <Link className="h-4 w-4" />
            {label}
          </span>
        </Button>
      </motion.div>

      <motion.div
        animate={{
          opacity: isVisible ? 1 : 0,
          x: isVisible ? 0 : -8,
        }}
        aria-hidden={!isVisible}
        className="absolute top-0 left-0 flex h-10 overflow-hidden"
        initial={{ opacity: 0, x: -8 }}
        transition={{
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        {items.map((item, i) => (
          <motion.a
            animate={{
              opacity: isVisible ? 1 : 0,
              x: isVisible ? 0 : -12,
            }}
            aria-label={`Visit ${item.label}`}
            className={cn(
              "h-10",
              "w-10",
              "flex items-center justify-center",
              "bg-black dark:bg-white",
              "text-white dark:text-black",
              i === 0 && "rounded-l-md",
              i === items.length - 1 && "rounded-r-md",
              "border-white/10 border-r last:border-r-0 dark:border-black/10",
              "hover:bg-gray-900 dark:hover:bg-gray-100",
              "outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              "relative overflow-hidden",
              "transition-colors duration-200"
            )}
            href={item.href}
            initial={{ opacity: 0, x: -12 }}
            key={`share-${item.label}`}
            onClick={() => handleShare(i, item)}
            rel="noopener noreferrer"
            tabIndex={isVisible ? 0 : -1}
            target="_blank"
            transition={{
              duration: 0.3,
              ease: [0.23, 1, 0.32, 1],
              delay: isVisible ? i * 0.04 : 0,
            }}
          >
            <motion.div
              animate={{
                scale: activeIndex === i ? 0.85 : 1,
              }}
              className="relative z-10"
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            >
              <item.icon sx={{ fontSize: 16 }} />
            </motion.div>
            <motion.div
              animate={{
                opacity: activeIndex === i ? 0.15 : 0,
              }}
              className="absolute inset-0 bg-white dark:bg-black"
              initial={{ opacity: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            />
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
}
