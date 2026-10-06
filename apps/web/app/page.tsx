import React from "react";
import Navbar from "../landing-sections/Navbar";
import Hero from "../landing-sections/Hero";
import BeamsBackground from "@/components/kokonutui/beams-background";

const LandingPage = () => {
  return (
    <div className="relative">
      {/* Navbar enters first — no delay */}
      <nav className="animate-page-enter">
        <Navbar />
      </nav>
      {/* Hero enters second — slight stagger after navbar */}
      <div className="animate-page-enter animation-delay-150">
        <Hero />
      </div>
      <BeamsBackground className="absolute top-0 left-0 -z-100" />
    </div>
  );
};

export default LandingPage;
