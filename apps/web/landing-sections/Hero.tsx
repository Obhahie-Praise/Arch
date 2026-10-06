import { MorphingText } from "@/components/animate-ui/primitives/texts/morphing";
import SocialButton from "@/components/kokonutui/social-button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full mt-12 sm:mt-20 px-5 sm:px-10">
      <div className="text-center space-y-6 w-full max-w-4xl mx-auto">
        <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display leading-tight">
          Find{" "}
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
          <br /> worth chasing.
        </p>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Arch finds opportunities across jobs, grants, hackathons, and more,
          then helps you discover the{" "}
          <span className="font-medium text-foreground"> ones that actually fit you.</span>
        </p>
        <div className="flex items-center gap-2 mx-auto w-fit flex-wrap justify-center">
          <Link
            href={"./auth/login"}
            className="bg-background/80 text-primary px-6 py-3 rounded-full text-sm transition-colors hover:bg-muted cursor-pointer duration-300 border shadow border-border"
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
        </div>
      </div>
      <SocialButton label="cre8ive_praise" className="mt-20 bg-background" />
    </div>
  );
};

export default Hero;
