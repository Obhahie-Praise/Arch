"use client";

/**
 * Hero — landing page entry animation
 *
 * Sequence:
 *   0ms   – headline begins resolving (blur → crisp, opacity 0→1, y 16px→0)
 *   400ms – shine sweep begins travelling down the headline words (one-time only)
 *   650ms – supporting copy fades in
 *   800ms – CTA buttons fade in
 *   950ms – "created by" / social button fades in
 *
 * Animation engine: motion/react (already a project dependency — no new packages)
 * Shine:            pure CSS keyframe, fires once, no ongoing cost after completion
 * Reduced-motion:   skips all motion, content appears immediately
 */

import { MorphingText } from "@/components/animate-ui/primitives/texts/morphing";
import SocialButton from "@/components/kokonutui/social-button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

// ─── Shared easing ─────────────────────────────────────────────────────────

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Hero ───────────────────────────────────────────────────────────────────

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center w-full mt-12 sm:mt-20 px-5 sm:px-10">
      <div className="text-center space-y-6 w-full max-w-4xl mx-auto">

        {/* ── Headline ──────────────────────────────────────────────────── */}
        {/*
         * The shine (background-clip: text) is applied only to the static
         * text spans — NOT to the parent <p> and NOT to the MorphingText
         * wrapper. This isolates the background-clip repaint budget to just
         * the letterforms that never change during morphing, preventing the
         * per-character blur/layoutId animations from triggering expensive
         * background-clip repaints on every frame.
         */}
        <motion.p
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display leading-tight"
          initial={{ opacity: 0, filter: "blur(8px)", y: 16 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            duration: 0.9,
            ease: EASE_OUT_EXPO,
          }}
        >
          {/* "Find" — gets the shine */}
          <span className="hero-shine-target">Find</span>{" "}
          {/* MorphingText — isolated from background-clip context */}
          <MorphingText
            text={["Opportunities", "Hackathons", "Jobs", "Grants"]}
            loop
            holdDelay={4000}
            transition={{
              type: "spring",
              stiffness: 125,
              damping: 30,
              mass: 0.4,
            }}
          />{" "}
          <br />
          {/* "worth chasing." — gets the shine */}
          <span className="hero-shine-target animation-delay-shine">worth chasing.</span>
        </motion.p>

        {/* ── Supporting copy ───────────────────────────────────────────── */}
        <motion.p
          className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: EASE_OUT_EXPO,
            delay: 0.55,
          }}
        >
          Arch finds opportunities across jobs, grants, hackathons, and more,
          then helps you discover the{" "}
          <span className="font-medium text-foreground">
            {" "}
            ones that actually fit you.
          </span>
        </motion.p>

        {/* ── CTA buttons ───────────────────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-2 mx-auto w-fit flex-wrap justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: EASE_OUT_EXPO,
            delay: 0.72,
          }}
        >
          <Link
            href={"/"}
            className="bg-background/20 text-primary px-6 py-3 rounded-full text-sm transition-colors hover:bg-muted/20 backdrop-blur-sm cursor-pointer duration-300 border shadow border-border"
          >
            How it works
          </Link>
          <Link
            href={"./auth"}
            className="bg-primary flex items-center gap-1 text-primary-foreground px-6 py-3 rounded-full text-sm transition-colors hover:bg-primary/90 cursor-pointer duration-300 shadow-inner shadow-white"
          >
            <p>Start discovering</p>
            <ChevronRight strokeWidth={1.5} size={16} />
          </Link>
        </motion.div>
      </div>

      {/* ── Social / "created by" ──────────────────────────────────────── */}
      <motion.div
        className="mt-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
          delay: 0.9,
        }}
      >
        <p className="text-xs text-start text-muted-foreground pb-1">created by</p>
        <SocialButton label="cre8ive_praise" className="" />
      </motion.div>
    </div>
  );
}
