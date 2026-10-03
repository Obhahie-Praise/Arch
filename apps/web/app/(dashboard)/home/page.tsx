import React from "react";

const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner & Subtle Local Storage Status */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-medium text-foreground">
            Home
          </h1>
          <p className="text-muted-foreground text-sm">
            See what’s relevant, what needs your attention, and where to go next.
          </p>
        </div>
      </div>
      <div className="">
        
      </div>
    </div>
  );
};

export default HomePage;
