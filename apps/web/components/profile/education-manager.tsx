"use client";

import React, { useState } from "react";
import { Plus, Trash2, GraduationCap, ChevronUp, ChevronDown } from "lucide-react";

export interface EducationItem {
  id?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  achievements?: string;
}

interface EducationManagerProps {
  education: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

export const EducationManager: React.FC<EducationManagerProps> = ({
  education,
  onChange,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(education.length > 0 ? 0 : null);

  const addEducation = () => {
    const newEdu: EducationItem = {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      achievements: "",
    };
    const updated = [...education, newEdu];
    onChange(updated);
    setOpenIndex(updated.length - 1);
  };

  const updateEducation = (index: number, item: EducationItem) => {
    const next = [...education];
    next[index] = item;
    onChange(next);
  };

  const removeEducation = (index: number) => {
    const next = education.filter((_, i) => i !== index);
    onChange(next);
    setOpenIndex(next.length > 0 ? Math.max(0, index - 1) : null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground">Education</h3>
        </div>
        <button
          type="button"
          onClick={addEducation}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-full hover:bg-muted transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Education</span>
        </button>
      </div>

      {education.length === 0 ? (
        <div className="border border-dashed border-border rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No education history added yet. Click "Add Education" to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {education.map((edu, idx) => {
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
                      <GraduationCap size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {edu.institution || "Institution Name"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {edu.degree || "Degree"}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                        {edu.startDate || edu.endDate ? ` • ${edu.startDate || ""} - ${edu.isCurrent ? "Present" : edu.endDate || ""}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEducation(idx);
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
                    <div className="md:col-span-2 flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Institution / University *</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, { ...edu, institution: e.target.value })}
                        placeholder="e.g. Stanford University, MIT"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Degree / Program</label>
                      <input
                        type="text"
                        value={edu.degree || ""}
                        onChange={(e) => updateEducation(idx, { ...edu, degree: e.target.value })}
                        placeholder="e.g. Bachelor of Science"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Field of Study</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ""}
                        onChange={(e) => updateEducation(idx, { ...edu, fieldOfStudy: e.target.value })}
                        placeholder="e.g. Computer Science"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Start Year</label>
                      <input
                        type="number"
                        placeholder="e.g. 2020"
                        value={edu.startDate || ""}
                        onChange={(e) => updateEducation(idx, { ...edu, startDate: e.target.value })}
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-sm">
                        <label className="font-medium">End / Graduation Year</label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={edu.isCurrent || false}
                            onChange={(e) =>
                              updateEducation(idx, { ...edu, isCurrent: e.target.checked })
                            }
                            className="rounded border-border"
                          />
                          Currently studying
                        </label>
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        disabled={edu.isCurrent}
                        value={edu.isCurrent ? "" : edu.endDate || ""}
                        onChange={(e) => updateEducation(idx, { ...edu, endDate: e.target.value })}
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Relevant Achievements / Details</label>
                      <textarea
                        rows={2}
                        value={edu.achievements || ""}
                        onChange={(e) => updateEducation(idx, { ...edu, achievements: e.target.value })}
                        placeholder="Honors, thesis, activities..."
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
