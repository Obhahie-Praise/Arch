import React from "react";
import Navbar from "../landing-sections/Navbar";
import Hero from "../landing-sections/Hero";
import BeamsBackground from "@/components/kokonutui/beams-background";

const LandingPage = () => {
  return (
    <div className="relative">
      {/* Navbar enters with the standard page-enter animation */}
      <nav className="animate-page-enter">
        <Navbar />
      </nav>
      {/*
       * Hero owns its own entrance sequence via motion/react.
       * The outer animate-page-enter wrapper has been removed — Hero's
       * motion sequence starts at mount and handles its own timing/stagger.
       */}
      <Hero />
      <BeamsBackground className="absolute top-0 left-0 -z-100" />
    </div>
  );
};

export default LandingPage;
