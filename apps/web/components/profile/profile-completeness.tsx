"use client";

import React from "react";
import { Sparkles, CheckCircle2, Circle } from "lucide-react";

interface ProfileCompletenessProps {
  score: number;
  profile: any;
  experiences: any[];
  education: any[];
  sessionUser?: any;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({
  score,
  profile,
  experiences,
  education,
  sessionUser,
}) => {
  const hasName = Boolean(profile.fullName || profile.preferredName || sessionUser?.name);
  const hasUsername = Boolean(profile.username || sessionUser?.email);

  const sections = [
    {
      label: "Identity & Location",
      complete: Boolean(hasName && hasUsername),
    },
    {
      label: "Target Opportunities",
      complete: Boolean(
        (profile.opportunityTypes?.length || 0) > 0 && (profile.desiredRoles?.length || 0) > 0
      ),
    },
    {
      label: "Skills & Proficiency",
      complete: Boolean(
        (profile.technicalSkills?.length || 0) > 0 || (profile.tools?.length || 0) > 0
      ),
    },
    {
      label: "Experience & Education",
      complete: Boolean(experiences.length > 0 || education.length > 0),
    },
    {
      label: "Preferences & Resume",
      complete: Boolean(profile.resumeUrl || (profile.keyPriorities?.length || 0) > 0),
    },
  ];

  return (
    <div className="border-2 border-border rounded-3xl p-6 bg-card flex flex-col gap-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-foreground shrink-0" size={20} />
          <div>
            <h3 className="font-display text-base text-foreground">Profile Completeness</h3>
            <p className="text-xs text-muted-foreground">
              A detailed profile gives Arch the best signal for matching opportunities.
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 bg-muted px-4 py-1.5 rounded-full">
          <span className="font-display text-lg text-foreground">{score}%</span>
          <span className="text-xs text-muted-foreground">complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-foreground h-full transition-all duration-500 ease-out"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Section Checklists */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-border">
        {sections.map((sec, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs">
            {sec.complete ? (
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            ) : (
              <Circle size={14} className="text-muted-foreground shrink-0" />
            )}
            <span className={sec.complete ? "text-foreground font-medium" : "text-muted-foreground"}>
              {sec.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
