import React from "react";
import Navbar from "../landing-sections/Navbar";
import Hero from "../landing-sections/Hero";

const LandingPage = () => {
  return (
    <div>
      <nav className="">
        <Navbar />
      </nav>
      <div className="">
        <Hero />
      </div>
    </div>
  );
};

export default LandingPage;
