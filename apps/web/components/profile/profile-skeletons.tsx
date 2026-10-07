"use client";

import React from "react";

export const CompletenessSkeleton = () => (
  <div className="border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl flex flex-col gap-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-muted/60 rounded-full" />
        <div className="space-y-1.5">
          <div className="w-36 h-4 bg-muted/60 rounded-full" />
          <div className="w-64 h-3 bg-muted/60 rounded-full" />
        </div>
      </div>
      <div className="w-24 h-7 bg-muted/60 rounded-full" />
    </div>
    <div className="w-full bg-muted/60 h-2.5 rounded-full" />
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-border/50">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-muted/60 rounded-full" />
          <div className="w-20 h-3 bg-muted/60 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const IdentitySkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-24 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-60 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-4">
      <div className="w-full h-24 border border-dashed border-border/50 rounded-4xl bg-muted/20" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-12 bg-muted/60 rounded-full" />
        <div className="h-12 bg-muted/60 rounded-full" />
      </div>
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="h-12 bg-muted/60 rounded-full" />
        <div className="h-12 bg-muted/60 rounded-full" />
        <div className="h-12 bg-muted/60 rounded-full" />
      </div>
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-12 bg-muted/60 rounded-full" />
        <div className="h-12 bg-muted/60 rounded-full" />
        <div className="h-12 bg-muted/60 rounded-full" />
      </div>
    </div>
  </div>
);

export const PreferencesSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-48 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-72 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-24 h-9 bg-muted/60 rounded-full" />
        ))}
      </div>
      <div className="h-14 bg-muted/60 rounded-4xl" />
      <div className="h-14 bg-muted/60 rounded-4xl" />
    </div>
  </div>
);

export const SkillsSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-20 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-64 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-4">
      <div className="h-14 bg-muted/60 rounded-4xl" />
      <div className="h-14 bg-muted/60 rounded-4xl" />
      <div className="h-14 bg-muted/60 rounded-4xl" />
    </div>
  </div>
);

export const ExperienceSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="w-32 h-6 bg-muted/60 rounded-full mb-1" />
        <div className="w-48 h-3.5 bg-muted/60 rounded-full" />
      </div>
      <div className="w-36 h-10 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-20 bg-muted/60 rounded-4xl" />
    </div>
  </div>
);

export const EducationSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="w-28 h-6 bg-muted/60 rounded-full mb-1" />
        <div className="w-44 h-3.5 bg-muted/60 rounded-full" />
      </div>
      <div className="w-36 h-10 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-20 bg-muted/60 rounded-4xl" />
    </div>
  </div>
);

export const ProjectsSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="w-24 h-6 bg-muted/60 rounded-full mb-1" />
        <div className="w-56 h-3.5 bg-muted/60 rounded-full" />
      </div>
      <div className="w-32 h-10 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-20 bg-muted/60 rounded-4xl" />
    </div>
  </div>
);

export const AchievementsSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="w-32 h-6 bg-muted/60 rounded-full mb-1" />
        <div className="w-64 h-3.5 bg-muted/60 rounded-full" />
      </div>
      <div className="w-40 h-10 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-20 bg-muted/60 rounded-4xl" />
    </div>
  </div>
);

export const GoalsSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-36 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-64 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="space-y-4">
      <div className="h-24 bg-muted/60 rounded-4xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-24 bg-muted/60 rounded-4xl" />
        <div className="h-24 bg-muted/60 rounded-4xl" />
      </div>
    </div>
  </div>
);

export const EligibilitySkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-44 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-72 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="h-12 bg-muted/60 rounded-full" />
    </div>
  </div>
);

export const AvailabilitySkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-32 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-60 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="h-12 bg-muted/60 rounded-full" />
    </div>
  </div>
);

export const CompensationSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-56 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-64 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="h-12 bg-muted/60 rounded-full" />
      <div className="h-12 bg-muted/60 rounded-full" />
    </div>
  </div>
);

export const MaterialsSkeleton = () => (
  <div className="space-y-4 border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl animate-pulse">
    <div className="border-b border-border/50 pb-3">
      <div className="w-48 h-6 bg-muted/60 rounded-full mb-1" />
      <div className="w-72 h-3.5 bg-muted/60 rounded-full" />
    </div>
    <div className="w-full h-28 border border-dashed border-border/50 rounded-4xl bg-muted/20" />
  </div>
);
