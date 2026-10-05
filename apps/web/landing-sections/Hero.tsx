import { MorphingText } from "@/components/animate-ui/primitives/texts/morphing";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full mt-20">
      <div className="text-center space-y-6">
        <p className="text-7xl px-70 font-display">
          Find{" "}
          <MorphingText
            text={["Opportunities", "Hackathons", "Jobs", "Grants"]}
            loop
            transition={{
              type: "spring",
              stiffness: 125,
              damping: 30,
              mass: 0.4,
            }}
          />{" "}
          <br /> worth chasing.
        </p>
        <p className="px-100">
          Arch finds opportunities across jobs, grants, hackathons, and more,
          then helps you discover the{" "}
          <span className="font-medium"> ones that actually fit you.</span>
        </p>
        <div className="flex items-center gap-2 mx-auto w-fit">
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
            <p className="">Start discovering</p>
            <ChevronRight strokeWidth={1.5} size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
