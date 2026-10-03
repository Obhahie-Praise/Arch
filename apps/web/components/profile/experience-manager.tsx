"use client";

import React, { useState } from "react";
import { Plus, Trash2, Briefcase, ChevronUp, ChevronDown } from "lucide-react";
import { CustomDropdown } from "./custom-dropdown";
import { TagInput } from "./tag-input";

export interface ExperienceItem {
  id?: string;
  organization: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  skillsUsed?: string[];
}

interface ExperienceManagerProps {
  experiences: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

const EMPLOYMENT_TYPES = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
  { label: "Freelance", value: "Freelance" },
  { label: "Internship", value: "Internship" },
];

export const ExperienceManager: React.FC<ExperienceManagerProps> = ({
  experiences,
  onChange,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(experiences.length > 0 ? 0 : null);

  const addExperience = () => {
    const newExp: ExperienceItem = {
      organization: "",
      role: "",
      employmentType: "Full-time",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      skillsUsed: [],
    };
    const updated = [...experiences, newExp];
    onChange(updated);
    setOpenIndex(updated.length - 1);
  };

  const updateExperience = (index: number, updatedItem: ExperienceItem) => {
    const next = [...experiences];
    next[index] = updatedItem;
    onChange(next);
  };

  const removeExperience = (index: number) => {
    const next = experiences.filter((_, i) => i !== index);
    onChange(next);
    setOpenIndex(next.length > 0 ? Math.max(0, index - 1) : null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground">Work Experience</h3>
          <p className="text-xs text-muted-foreground">Add your past and current roles</p>
        </div>
        <button
          type="button"
          onClick={addExperience}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-2 border-border rounded-full hover:bg-muted transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Experience</span>
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No work experiences added yet. Click "Add Experience" to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border-2 border-border rounded-3xl p-5 bg-card transition-all duration-200"
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-2xl text-foreground">
                      <Briefcase size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {exp.role || "New Role"} {exp.organization ? `at ${exp.organization}` : ""}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exp.startDate || "Start"} - {exp.isCurrent ? "Present" : exp.endDate || "End"}
                        {exp.employmentType ? ` • ${exp.employmentType}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExperience(idx);
                      }}
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-full transition-colors cursor-pointer"
                      title="Delete experience"
                    >
                      <Trash2 size={16} />
                    </button>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Form fields */}
                {isOpen && (
                  <div className="pt-4 mt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Organization / Company *</label>
                      <input
                        type="text"
                        value={exp.organization}
                        onChange={(e) => updateExperience(idx, { ...exp, organization: e.target.value })}
                        placeholder="e.g. Google, Vercel"
                        className="border-2 border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Role / Title *</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => updateExperience(idx, { ...exp, role: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                        className="border-2 border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <CustomDropdown
                      label="Employment Type"
                      options={EMPLOYMENT_TYPES}
                      value={exp.employmentType || "Full-time"}
                      onChange={(val) => updateExperience(idx, { ...exp, employmentType: val })}
                    />

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Location</label>
                      <input
                        type="text"
                        value={exp.location || ""}
                        onChange={(e) => updateExperience(idx, { ...exp, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA or Remote"
                        className="border-2 border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate || ""}
                        onChange={(e) => updateExperience(idx, { ...exp, startDate: e.target.value })}
                        className="border-2 border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-sm">
                        <label className="font-medium">End Date</label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent || false}
                            onChange={(e) =>
                              updateExperience(idx, { ...exp, isCurrent: e.target.checked })
                            }
                            className="rounded border-border"
                          />
                          Currently work here
                        </label>
                      </div>
                      <input
                        type="month"
                        disabled={exp.isCurrent}
                        value={exp.isCurrent ? "" : exp.endDate || ""}
                        onChange={(e) => updateExperience(idx, { ...exp, endDate: e.target.value })}
                        className="border-2 border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Description & Achievements</label>
                      <textarea
                        rows={3}
                        value={exp.description || ""}
                        onChange={(e) => updateExperience(idx, { ...exp, description: e.target.value })}
                        placeholder="Describe key responsibilities and impact..."
                        className="border-2 border-border text-base rounded-3xl p-4 w-full focus:outline-none focus:border-foreground/60 transition-all resize-y"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <TagInput
                        label="Skills Used"
                        placeholder="e.g. React, TypeScript, GraphQL..."
                        tags={exp.skillsUsed || []}
                        onChange={(tags) => updateExperience(idx, { ...exp, skillsUsed: tags })}
                        optional
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
