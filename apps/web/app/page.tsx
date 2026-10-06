import React from "react";
import Navbar from "../landing-sections/Navbar";
import Hero from "../landing-sections/Hero";
import BeamsBackground from "@/components/kokonutui/beams-background";

const LandingPage = () => {
  return (
    <div className="relative">
      <nav className="">
        <Navbar />
      </nav>
      <div className="">
        <Hero />
      </div>
      <BeamsBackground className="absolute top-0 left-0 -z-100" />
    </div>
  );
};

export default LandingPage;
