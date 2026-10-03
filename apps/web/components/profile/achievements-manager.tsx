"use client";

import React, { useState } from "react";
import { Plus, Trash2, Award, ChevronUp, ChevronDown } from "lucide-react";
import { CustomDropdown } from "./custom-dropdown";

export interface AchievementItem {
  id?: string;
  title: string;
  category?: string;
  issuer?: string;
  date?: string;
  url?: string;
  description?: string;
}

interface AchievementsManagerProps {
  achievements: AchievementItem[];
  onChange: (items: AchievementItem[]) => void;
}

const ACHIEVEMENT_CATEGORIES = [
  { label: "Award / Honor", value: "Award / Honor" },
  { label: "Hackathon Result", value: "Hackathon Result" },
  { label: "Competition", value: "Competition" },
  { label: "Certification", value: "Certification" },
  { label: "Publication", value: "Publication" },
  { label: "Open-source Contribution", value: "Open-source Contribution" },
  { label: "Speaking / Presentation", value: "Speaking / Presentation" },
  { label: "Other Accomplishment", value: "Other Accomplishment" },
];

export const AchievementsManager: React.FC<AchievementsManagerProps> = ({
  achievements,
  onChange,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(achievements.length > 0 ? 0 : null);

  const addAchievement = () => {
    const newAch: AchievementItem = {
      title: "",
      category: "Award / Honor",
      issuer: "",
      date: "",
      url: "",
      description: "",
    };
    const updated = [...achievements, newAch];
    onChange(updated);
    setOpenIndex(updated.length - 1);
  };

  const updateAchievement = (index: number, item: AchievementItem) => {
    const next = [...achievements];
    next[index] = item;
    onChange(next);
  };

  const removeAchievement = (index: number) => {
    const next = achievements.filter((_, i) => i !== index);
    onChange(next);
    setOpenIndex(next.length > 0 ? Math.max(0, index - 1) : null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground">Achievements</h3>
        </div>
        <button
          type="button"
          onClick={addAchievement}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-full hover:bg-muted transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Achievement</span>
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="border border-dashed border-border rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No achievements added yet. Click "Add Achievement" to list your recognitions.
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((ach, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-border rounded-3xl p-5 bg-card transition-all duration-200"
              >
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-2xl text-foreground">
                      <Award size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {ach.title || "Achievement Title"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ach.category || "Award"} {ach.issuer ? ` • ${ach.issuer}` : ""} {ach.date ? ` • ${ach.date}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAchievement(idx);
                      }}
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="pt-4 mt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Achievement Title *</label>
                      <input
                        type="text"
                        value={ach.title}
                        onChange={(e) => updateAchievement(idx, { ...ach, title: e.target.value })}
                        placeholder="e.g. 1st Place - Global AI Hackathon"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <CustomDropdown
                      label="Category"
                      options={ACHIEVEMENT_CATEGORIES}
                      value={ach.category || "Award / Honor"}
                      onChange={(val) => updateAchievement(idx, { ...ach, category: val })}
                    />

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Issuer / Organization</label>
                      <input
                        type="text"
                        value={ach.issuer || ""}
                        onChange={(e) => updateAchievement(idx, { ...ach, issuer: e.target.value })}
                        placeholder="e.g. Y Combinator, AWS, Google"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Date / Year</label>
                      <input
                        type="text"
                        value={ach.date || ""}
                        onChange={(e) => updateAchievement(idx, { ...ach, date: e.target.value })}
                        placeholder="e.g. Oct 2026"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Verification / Project URL</label>
                      <input
                        type="url"
                        value={ach.url || ""}
                        onChange={(e) => updateAchievement(idx, { ...ach, url: e.target.value })}
                        placeholder="https://credential-or-event-link.com"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        rows={2}
                        value={ach.description || ""}
                        onChange={(e) => updateAchievement(idx, { ...ach, description: e.target.value })}
                        placeholder="Details about the recognition, score, or project submission..."
                        className="border border-border text-base rounded-3xl p-4 w-full focus:outline-none focus:border-foreground/60 transition-all resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
