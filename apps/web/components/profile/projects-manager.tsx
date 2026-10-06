"use client";

import React, { useState } from "react";
import { Plus, Trash2, FolderGit2, ChevronUp, ChevronDown } from "lucide-react";
import { TagInput } from "./tag-input";
import { CustomDropdown } from "./custom-dropdown";

export interface ProjectItem {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  repositoryUrl?: string;
  role?: string;
  technologies?: string[];
  status?: string;
  year?: string;
  achievements?: string;
}

interface ProjectsManagerProps {
  projects: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
}

const PROJECT_STATUSES = [
  { label: "Completed", value: "Completed" },
  { label: "In Progress", value: "In Progress" },
  { label: "Maintained", value: "Maintained" },
  { label: "Archived", value: "Archived" },
];

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  onChange,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(projects.length > 0 ? 0 : null);

  const addProject = () => {
    const newProj: ProjectItem = {
      title: "",
      description: "",
      url: "",
      repositoryUrl: "",
      role: "",
      technologies: [],
      status: "Completed",
      year: new Date().getFullYear().toString(),
      achievements: "",
    };
    const updated = [...projects, newProj];
    onChange(updated);
    setOpenIndex(updated.length - 1);
  };

  const updateProject = (index: number, item: ProjectItem) => {
    const next = [...projects];
    next[index] = item;
    onChange(next);
  };

  const removeProject = (index: number) => {
    const next = projects.filter((_, i) => i !== index);
    onChange(next);
    setOpenIndex(next.length > 0 ? Math.max(0, index - 1) : null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground">Projects</h3>
        </div>
        <button
          type="button"
          onClick={addProject}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-full hover:bg-muted transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span className="hidden md:inline">Add Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="border border-dashed border-border rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No projects added yet. Click <span className="hidden md:inline">"Add Project"</span> <Plus size={16} className="inline md:hidden" /> to showcase your work.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((proj, idx) => {
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
                      <FolderGit2 size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {proj.title || "Project Name"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {proj.role || "Creator"} {proj.year ? ` • ${proj.year}` : ""} {proj.status ? ` • ${proj.status}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProject(idx);
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
                      <label className="text-sm font-medium">Project Title *</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => updateProject(idx, { ...proj, title: e.target.value })}
                        placeholder="e.g. Arch Platform"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Your Role</label>
                      <input
                        type="text"
                        value={proj.role || ""}
                        onChange={(e) => updateProject(idx, { ...proj, role: e.target.value })}
                        placeholder="e.g. Lead Engineer / Founder"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Live Demo URL</label>
                      <input
                        type="url"
                        value={proj.url || ""}
                        onChange={(e) => updateProject(idx, { ...proj, url: e.target.value })}
                        placeholder="https://myproject.com"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Repository URL</label>
                      <input
                        type="url"
                        value={proj.repositoryUrl || ""}
                        onChange={(e) => updateProject(idx, { ...proj, repositoryUrl: e.target.value })}
                        placeholder="https://github.com/user/project"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <CustomDropdown
                      label="Status"
                      options={PROJECT_STATUSES}
                      value={proj.status || "Completed"}
                      onChange={(val) => updateProject(idx, { ...proj, status: val })}
                    />

                    <div className="flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Year</label>
                      <input
                        type="text"
                        value={proj.year || ""}
                        onChange={(e) => updateProject(idx, { ...proj, year: e.target.value })}
                        placeholder="e.g. 2026"
                        className="border border-border text-base rounded-full px-6 py-2.5 w-full focus:outline-none focus:border-foreground/60 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-0.5">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        rows={3}
                        value={proj.description || ""}
                        onChange={(e) => updateProject(idx, { ...proj, description: e.target.value })}
                        placeholder="What problem does this project solve? What did you build?"
                        className="border border-border text-base rounded-3xl p-4 w-full focus:outline-none focus:border-foreground/60 transition-all resize-y"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <TagInput
                        label="Technologies Used"
                        placeholder="e.g. Next.js, Cloudflare Workers, TypeScript..."
                        tags={proj.technologies || []}
                        onChange={(tags) => updateProject(idx, { ...proj, technologies: tags })}
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
