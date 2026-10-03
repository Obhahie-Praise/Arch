"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "../../../lib/auth-client";
import { LocationSelector } from "../../../components/profile/location-selector";
import { TagInput } from "../../../components/profile/tag-input";
import { PrefixInput } from "../../../components/profile/prefix-input";
import { FileUpload } from "../../../components/profile/file-upload";
import { CustomDropdown } from "../../../components/profile/custom-dropdown";
import { ExperienceManager, ExperienceItem } from "../../../components/profile/experience-manager";
import { EducationManager, EducationItem } from "../../../components/profile/education-manager";
import { ProjectsManager, ProjectItem } from "../../../components/profile/projects-manager";
import { AchievementsManager, AchievementItem } from "../../../components/profile/achievements-manager";
import { ProfileCompleteness } from "../../../components/profile/profile-completeness";
import {
  CompletenessSkeleton,
  IdentitySkeleton,
  PreferencesSkeleton,
  SkillsSkeleton,
  ExperienceSkeleton,
  EducationSkeleton,
  ProjectsSkeleton,
  AchievementsSkeleton,
  GoalsSkeleton,
  EligibilitySkeleton,
  AvailabilitySkeleton,
  CompensationSkeleton,
  MaterialsSkeleton,
} from "../../../components/profile/profile-skeletons";
import { CheckCircle, AlertCircle, Loader2, Sparkles, Lock } from "lucide-react";

const OPPORTUNITY_TYPES = [
  "Jobs",
  "Internships",
  "Freelance",
  "Hackathons",
  "Grants",
  "Fellowships",
  "Scholarships",
  "Accelerators",
  "Competitions",
  "Startup programs",
  "Research",
  "Events",
];

const WORK_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Flexible"];
const WORK_ARRANGEMENTS = ["Remote", "Hybrid", "On-site", "Any"];

const STUDENT_STATUSES = [
  { label: "Not a student", value: "Not a student" },
  { label: "Undergraduate student", value: "Undergraduate student" },
  { label: "Graduate / Master's student", value: "Graduate / Master's student" },
  { label: "PhD student / Candidate", value: "PhD student / Candidate" },
  { label: "Bootcamp / Self-taught learner", value: "Bootcamp / Self-taught learner" },
];

const CURRENCIES = [
  { label: "USD ($)", value: "USD" },
  { label: "EUR (€)", value: "EUR" },
  { label: "GBP (£)", value: "GBP" },
  { label: "NGN (₦)", value: "NGN" },
  { label: "CAD ($)", value: "CAD" },
  { label: "AUD ($)", value: "AUD" },
  { label: "INR (₹)", value: "INR" },
];

const COMPENSATION_TYPES = [
  { label: "Annual salary", value: "Annual salary" },
  { label: "Hourly rate", value: "Hourly rate" },
  { label: "Fixed project fee", value: "Fixed project fee" },
  { label: "Stipend", value: "Stipend" },
  { label: "Grant request", value: "Grant request" },
];

const EQUITY_PREFERENCES = [
  { label: "Open to equity", value: "Open to equity" },
  { label: "Equity required", value: "Equity required" },
  { label: "No equity needed", value: "No equity needed" },
  { label: "Not applicable", value: "Not applicable" },
];

const SPONSORSHIP_OPTIONS = [
  { label: "No sponsorship required", value: "0" },
  { label: "Yes, require visa sponsorship", value: "1" },
];

const KEY_PRIORITIES = [
  "Career growth",
  "Learning",
  "Compensation",
  "Networking",
  "Mentorship",
  "Impact",
  "Flexibility",
  "Remote work",
  "Funding",
  "Community",
  "Prestige",
];

export default function ProfilePage() {
  const { data: session } = authClient.useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showEmailNotice, setShowEmailNotice] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bio, setBio] = useState("");
  const [shortTermGoals, setShortTermGoals] = useState("");
  const [longTermGoals, setLongTermGoals] = useState("");

  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [desiredIndustries, setDesiredIndustries] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [workArrangements, setWorkArrangements] = useState<string[]>([]);

  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [nonTechnicalSkills, setNonTechnicalSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [causes, setCauses] = useState<string[]>([]);

  const [citizenship, setCitizenship] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState<string[]>([]);
  const [requiresSponsorship, setRequiresSponsorship] = useState("0");
  const [studentStatus, setStudentStatus] = useState("Not a student");
  const [graduationYear, setGraduationYear] = useState("");

  const [availabilityStart, setAvailabilityStart] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");

  const [desiredCompensationMin, setDesiredCompensationMin] = useState("");
  const [desiredCompensationMax, setDesiredCompensationMax] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [compensationType, setCompensationType] = useState("Annual salary");
  const [equityPreference, setEquityPreference] = useState("Open to equity");

  const [keyPriorities, setKeyPriorities] = useState<string[]>([]);
  const [dealBreakers, setDealBreakers] = useState<string[]>([]);

  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFilename, setResumeFilename] = useState("");

  // Nested collections
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);

  const [completenessScore, setCompletenessScore] = useState(0);

  const userEmail = session?.user?.email || "";

  // Pre-fill initial identity & completeness from authenticated user data before network completes
  useEffect(() => {
    if (session?.user) {
      if (!fullName) setFullName(session.user.name || "");
      if (!username && session.user.email) setUsername(session.user.email.split("@")[0] || "");
      if (!avatarUrl && session.user.image) setAvatarUrl(session.user.image || "");

      // Compute initial non-zero completeness for new authenticated user
      let initialScore = 0;
      if (session.user.name || fullName) initialScore += 6;
      if (session.user.email || username) initialScore += 5;
      if (session.user.image || avatarUrl) initialScore += 4;

      setCompletenessScore((prev) => Math.max(prev, initialScore));
    }
  }, [session]);

  // Load Profile from Backend API asynchronously
  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const res = await fetch(`${apiUrl}/api/profile`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          if (p) {
            setFullName(p.fullName || session?.user?.name || "");
            setPreferredName(p.preferredName || "");
            setUsername(p.username || (session?.user?.email ? session.user.email.split("@")[0] : ""));
            setAvatarUrl(p.avatarUrl || session?.user?.image || "");
            setCountry(p.country || "");
            setState(p.state || "");
            setCity(p.city || "");
            setTimezone(p.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
            setPhone(p.phone || "");
            setWebsite(p.website || "");
            setGithub(p.github || "");
            setLinkedin(p.linkedin || "");
            setTwitter(p.twitter || "");
            setPortfolioUrl(p.portfolioUrl || "");
            setBio(p.bio || "");
            setShortTermGoals(p.shortTermGoals || "");
            setLongTermGoals(p.longTermGoals || "");

            setOpportunityTypes(p.opportunityTypes || []);
            setDesiredRoles(p.desiredRoles || []);
            setDesiredIndustries(p.desiredIndustries || []);
            setWorkTypes(p.workTypes || []);
            setWorkArrangements(p.workArrangements || []);

            setTechnicalSkills(p.technicalSkills || []);
            setNonTechnicalSkills(p.nonTechnicalSkills || []);
            setTools(p.tools || []);
            setLanguages(p.languages || []);

            setAreasOfInterest(p.areasOfInterest || []);
            setCauses(p.causes || []);

            setCitizenship(p.citizenship || "");
            setWorkAuthorization(p.workAuthorization || []);
            setRequiresSponsorship(p.requiresSponsorship ? "1" : "0");
            setStudentStatus(p.studentStatus || "Not a student");
            setGraduationYear(p.graduationYear ? p.graduationYear.toString() : "");

            setAvailabilityStart(p.availabilityStart || "");
            setHoursPerWeek(p.hoursPerWeek ? p.hoursPerWeek.toString() : "");
            setPreferredSchedule(p.preferredSchedule || "");

            setDesiredCompensationMin(p.desiredCompensationMin ? p.desiredCompensationMin.toString() : "");
            setDesiredCompensationMax(p.desiredCompensationMax ? p.desiredCompensationMax.toString() : "");
            setCurrency(p.currency || "USD");
            setCompensationType(p.compensationType || "Annual salary");
            setEquityPreference(p.equityPreference || "Open to equity");

            setKeyPriorities(p.keyPriorities || []);
            setDealBreakers(p.dealBreakers || []);

            setResumeUrl(p.resumeUrl || "");
            setResumeFilename(p.resumeFilename || "");

            if (typeof p.completenessScore === "number") {
              setCompletenessScore(p.completenessScore);
            }
          }

          setExperiences(data.experiences || []);
          setEducation(data.education || []);
          setProjects(data.projects || []);
          setAchievements(data.achievements || []);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  const toggleArrayItem = (item: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(item)) {
      setter(current.filter((i) => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  const handleEmailClick = () => {
    setShowEmailNotice(true);
    setTimeout(() => setShowEmailNotice(false), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const payload = {
      fullName,
      preferredName,
      username,
      avatarUrl,
      country,
      state,
      city,
      timezone,
      phone,
      website,
      github,
      linkedin,
      twitter,
      portfolioUrl,
      bio,
      shortTermGoals,
      longTermGoals,
      opportunityTypes,
      desiredRoles,
      desiredIndustries,
      workTypes,
      workArrangements,
      technicalSkills,
      nonTechnicalSkills,
      tools,
      languages,
      areasOfInterest,
      causes,
      citizenship,
      workAuthorization,
      requiresSponsorship: Number(requiresSponsorship),
      studentStatus,
      graduationYear: graduationYear ? Number(graduationYear) : null,
      availabilityStart,
      hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : null,
      preferredSchedule,
      desiredCompensationMin: desiredCompensationMin ? Number(desiredCompensationMin) : null,
      desiredCompensationMax: desiredCompensationMax ? Number(desiredCompensationMax) : null,
      currency,
      compensationType,
      equityPreference,
      keyPriorities,
      dealBreakers,
      resumeUrl,
      resumeFilename,
      experiences,
      education,
      projects,
      achievements,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        if (typeof data.completenessScore === "number") {
          setCompletenessScore(data.completenessScore);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        setSaveError(data.error || "Failed to save profile.");
      }
    } catch (err: any) {
      setSaveError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-medium text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Complete your profile intelligence so Arch can match you with relevant opportunities.
        </p>
      </div>

      {/* SECTION-LEVEL DYNAMIC LOADING: Completeness Bar */}
      {isLoading ? (
        <CompletenessSkeleton />
      ) : (
        <ProfileCompleteness
          score={completenessScore}
          profile={{
            fullName,
            preferredName,
            username,
            country,
            opportunityTypes,
            desiredRoles,
            technicalSkills,
            tools,
            resumeUrl,
            keyPriorities,
          }}
          experiences={experiences}
          education={education}
          sessionUser={session?.user}
        />
      )}

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle size={20} className="shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium">Profile saved successfully!</p>
            <p className="text-xs opacity-90">Your profile information is updated and ready for opportunity matching.</p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-3xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <p className="font-medium">{saveError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* 1. IDENTITY SECTION */}
        {isLoading ? (
          <IdentitySkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Identity</h2>
              <p className="text-xs text-muted-foreground">Personal details, profile image and online accounts</p>
            </div>

            <div className="space-y-4">
              <FileUpload
                label="Profile Picture"
                accept="image/*"
                type="image"
                valueUrl={avatarUrl}
                onUploadSuccess={(url) => setAvatarUrl(url)}
                onRemove={() => setAvatarUrl("")}
                optional
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <label htmlFor="fullname" className="text-sm font-medium">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
                    required
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="preferredname" className="font-medium">Preferred name</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="text"
                    id="preferredname"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="How should we address you?"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
                  />
                </div>
              </div>

              <PrefixInput
                label="Username"
                prefix="@"
                value={username}
                onChange={(val) => setUsername(val)}
                placeholder="your_username"
                required
              />

              <LocationSelector
                country={country}
                state={state}
                city={city}
                timezone={timezone}
                onCountryChange={(cName) => setCountry(cName)}
                onStateChange={(sName) => setState(sName)}
                onCityChange={(cName) => setCity(cName)}
                onTimezoneChange={(tz) => setTimezone(tz)}
              />

              {/* Read-only email input */}
              <div className="flex flex-col gap-0.5 relative">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="email" className="font-medium flex items-center gap-1.5">
                    Email <Lock size={13} className="text-muted-foreground" />
                  </label>
                  <span className="text-xs text-muted-foreground font-mono">Read-only</span>
                </div>
                <input
                  type="email"
                  id="email"
                  readOnly
                  value={userEmail}
                  onClick={handleEmailClick}
                  placeholder="email@example.com"
                  className="border-2 border-border text-base rounded-full px-6 py-3 w-full bg-muted/40 cursor-not-allowed text-muted-foreground focus:outline-none"
                />
                {showEmailNotice && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Email is managed by your authentication account and cannot be modified here.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="phone" className="font-medium">Phone</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="website" className="font-medium">Personal Website</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="url"
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PrefixInput
                  label="GitHub"
                  prefix="github.com/"
                  value={github}
                  onChange={(val) => setGithub(val)}
                  placeholder="username"
                  optional
                />
                <PrefixInput
                  label="LinkedIn"
                  prefix="linkedin.com/in/"
                  value={linkedin}
                  onChange={(val) => setLinkedin(val)}
                  placeholder="username"
                  optional
                />
                <PrefixInput
                  label="X / Twitter"
                  prefix="x.com/"
                  value={twitter}
                  onChange={(val) => setTwitter(val)}
                  placeholder="username"
                  optional
                />
              </div>
            </div>
          </section>
        )}

        {/* 2. WHAT YOU ARE LOOKING FOR */}
        {isLoading ? (
          <PreferencesSkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Opportunity Preferences</h2>
              <p className="text-xs text-muted-foreground">Define what opportunities you are looking for</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Opportunity Types</label>
                <div className="flex flex-wrap gap-2">
                  {OPPORTUNITY_TYPES.map((type) => {
                    const isSelected = opportunityTypes.includes(type);
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => toggleArrayItem(type, opportunityTypes, setOpportunityTypes)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-foreground border-border hover:border-foreground/40"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <TagInput
                label="Desired Roles"
                placeholder="e.g. Full-stack Developer, Product Manager, AI Researcher..."
                tags={desiredRoles}
                onChange={setDesiredRoles}
              />

              <TagInput
                label="Desired Industries & Domains"
                placeholder="e.g. FinTech, Climate Tech, Healthcare, Artificial Intelligence..."
                tags={desiredIndustries}
                onChange={setDesiredIndustries}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Work Types</label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_TYPES.map((wt) => {
                      const isSelected = workTypes.includes(wt);
                      return (
                        <button
                          type="button"
                          key={wt}
                          onClick={() => toggleArrayItem(wt, workTypes, setWorkTypes)}
                          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-foreground border-border hover:border-foreground/40"
                          }`}
                        >
                          {wt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Work Arrangement</label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_ARRANGEMENTS.map((wa) => {
                      const isSelected = workArrangements.includes(wa);
                      return (
                        <button
                          type="button"
                          key={wa}
                          onClick={() => toggleArrayItem(wa, workArrangements, setWorkArrangements)}
                          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-foreground border-border hover:border-foreground/40"
                          }`}
                        >
                          {wa}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. SKILLS */}
        {isLoading ? (
          <SkillsSkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Skills</h2>
              <p className="text-xs text-muted-foreground">Categorized skills, technologies and languages</p>
            </div>

            <div className="space-y-4">
              <TagInput
                label="Technical Skills"
                placeholder="e.g. TypeScript, Python, Node.js, Cloudflare Workers, PostgreSQL..."
                tags={technicalSkills}
                onChange={setTechnicalSkills}
              />

              <TagInput
                label="Non-Technical & Domain Skills"
                placeholder="e.g. Product Strategy, Financial Modeling, System Architecture..."
                tags={nonTechnicalSkills}
                onChange={setNonTechnicalSkills}
                optional
              />

              <TagInput
                label="Tools & Software"
                placeholder="e.g. Git, Docker, Figma, VS Code, Next.js..."
                tags={tools}
                onChange={setTools}
                optional
              />

              <TagInput
                label="Spoken & Written Languages"
                placeholder="e.g. English, Spanish, French, German..."
                tags={languages}
                onChange={setLanguages}
                optional
              />
            </div>
          </section>
        )}

        {/* 4. EXPERIENCE */}
        {isLoading ? (
          <ExperienceSkeleton />
        ) : (
          <section className="border-2 border-border rounded-3xl p-6 bg-card">
            <ExperienceManager experiences={experiences} onChange={setExperiences} />
          </section>
        )}

        {/* 5. EDUCATION */}
        {isLoading ? (
          <EducationSkeleton />
        ) : (
          <section className="border-2 border-border rounded-3xl p-6 bg-card">
            <EducationManager education={education} onChange={setEducation} />
          </section>
        )}

        {/* 6. PROJECTS */}
        {isLoading ? (
          <ProjectsSkeleton />
        ) : (
          <section className="border-2 border-border rounded-3xl p-6 bg-card">
            <ProjectsManager projects={projects} onChange={setProjects} />
          </section>
        )}

        {/* 7. ACHIEVEMENTS */}
        {isLoading ? (
          <AchievementsSkeleton />
        ) : (
          <section className="border-2 border-border rounded-3xl p-6 bg-card">
            <AchievementsManager achievements={achievements} onChange={setAchievements} />
          </section>
        )}

        {/* 8. INTERESTS & GOALS */}
        {isLoading ? (
          <GoalsSkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Interests & Goals</h2>
              <p className="text-xs text-muted-foreground">Free-form context and qualitative aspirations</p>
            </div>

            <div className="space-y-4">
              <TagInput
                label="Areas of Interest"
                placeholder="e.g. Generative AI, Distributed Systems, Web3, Open Source..."
                tags={areasOfInterest}
                onChange={setAreasOfInterest}
                optional
              />

              <TagInput
                label="Causes & Impact Areas"
                placeholder="e.g. Education Access, Climate Change, Open Science..."
                tags={causes}
                onChange={setCauses}
                optional
              />

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="bio" className="font-medium">About / Bio</label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A concise summary of who you are and what drives you..."
                  className="border-2 border-border text-base rounded-3xl p-4 w-full focus:outline-none focus:border-foreground/60 transition-all resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="shortTermGoals" className="font-medium">Short-Term Career Goals</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <textarea
                    id="shortTermGoals"
                    rows={3}
                    value={shortTermGoals}
                    onChange={(e) => setShortTermGoals(e.target.value)}
                    placeholder="What are you focusing on over the next 6-12 months?"
                    className="border-2 border-border text-base rounded-3xl p-4 w-full focus:outline-none focus:border-foreground/60 transition-all resize-y"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="longTermGoals" className="font-medium">Long-Term Career Vision</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <textarea
                    id="longTermGoals"
                    rows={3}
                    value={longTermGoals}
                    onChange={(e) => setLongTermGoals(e.target.value)}
                    placeholder="Where do you want to be in 3-5 years?"
                    className="border-2 border-border text-base rounded-3xl p-4 w-full focus:outline-none focus:border-foreground/60 transition-all resize-y"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 9. ELIGIBILITY */}
        {isLoading ? (
          <EligibilitySkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Eligibility & Status</h2>
              <p className="text-xs text-muted-foreground">Work authorization, citizenship and student status</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="citizenship" className="font-medium">Citizenship / Primary Country</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="text"
                    id="citizenship"
                    value={citizenship}
                    onChange={(e) => setCitizenship(e.target.value)}
                    placeholder="e.g. United States, Nigeria, United Kingdom"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                  />
                </div>

                <CustomDropdown
                  label="Visa / Sponsorship Requirements"
                  options={SPONSORSHIP_OPTIONS}
                  value={requiresSponsorship}
                  onChange={(val) => setRequiresSponsorship(val)}
                />
              </div>

              <TagInput
                label="Work Authorizations"
                placeholder="e.g. US Citizen, EU Passport, UK Right to Work..."
                tags={workAuthorization}
                onChange={setWorkAuthorization}
                optional
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomDropdown
                  label="Student Status"
                  options={STUDENT_STATUSES}
                  value={studentStatus}
                  onChange={(val) => setStudentStatus(val)}
                />

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="graduationYear" className="font-medium">Graduation Year</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="number"
                    id="graduationYear"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10. AVAILABILITY & SCHEDULING */}
        {isLoading ? (
          <AvailabilitySkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Availability</h2>
              <p className="text-xs text-muted-foreground">Start dates and available weekly commitments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="availStart" className="font-medium">Available From</label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <input
                  type="date"
                  id="availStart"
                  value={availabilityStart}
                  onChange={(e) => setAvailabilityStart(e.target.value)}
                  className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="hoursWeek" className="font-medium">Hours / Week Available</label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <input
                  type="number"
                  id="hoursWeek"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  placeholder="e.g. 40"
                  className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="prefSchedule" className="font-medium">Preferred Schedule</label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <input
                  type="text"
                  id="prefSchedule"
                  value={preferredSchedule}
                  onChange={(e) => setPreferredSchedule(e.target.value)}
                  placeholder="e.g. Flexible, US Eastern Overlap"
                  className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                />
              </div>
            </div>
          </section>
        )}

        {/* 11. COMPENSATION & FUNDING */}
        {isLoading ? (
          <CompensationSkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Compensation & Expectations</h2>
              <p className="text-xs text-muted-foreground">Salary, rates, currency and equity preferences</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomDropdown
                  label="Currency"
                  options={CURRENCIES}
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                />

                <CustomDropdown
                  label="Compensation Type"
                  options={COMPENSATION_TYPES}
                  value={compensationType}
                  onChange={(val) => setCompensationType(val)}
                />

                <CustomDropdown
                  label="Equity Preference"
                  options={EQUITY_PREFERENCES}
                  value={equityPreference}
                  onChange={(val) => setEquityPreference(val)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="compMin" className="font-medium">Minimum Expected</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="number"
                    id="compMin"
                    value={desiredCompensationMin}
                    onChange={(e) => setDesiredCompensationMin(e.target.value)}
                    placeholder="e.g. 80000"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="compMax" className="font-medium">Desired Target</label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <input
                    type="number"
                    id="compMax"
                    value={desiredCompensationMax}
                    onChange={(e) => setDesiredCompensationMax(e.target.value)}
                    placeholder="e.g. 130000"
                    className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 12. PREFERENCES & DEAL BREAKERS */}
        {isLoading ? (
          <PreferencesSkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Preferences & Deal-Breakers</h2>
              <p className="text-xs text-muted-foreground">Select what matters most and what you want to avoid</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Key Priorities</label>
                <div className="flex flex-wrap gap-2">
                  {KEY_PRIORITIES.map((priority) => {
                    const isSelected = keyPriorities.includes(priority);
                    return (
                      <button
                        type="button"
                        key={priority}
                        onClick={() => toggleArrayItem(priority, keyPriorities, setKeyPriorities)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-foreground border-border hover:border-foreground/40"
                        }`}
                      >
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </div>

              <TagInput
                label="Deal-Breakers / Non-negotiables"
                placeholder="e.g. No unpaid internships, No mandatory relocation, No weekend shifts..."
                tags={dealBreakers}
                onChange={setDealBreakers}
                optional
              />
            </div>
          </section>
        )}

        {/* 13. APPLICATION MATERIALS */}
        {isLoading ? (
          <MaterialsSkeleton />
        ) : (
          <section className="space-y-4 border-2 border-border rounded-3xl p-6 bg-card">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-xl text-foreground font-medium">Application Materials</h2>
              <p className="text-xs text-muted-foreground">Upload persistent resume / CV for opportunity applications</p>
            </div>

            <FileUpload
              label="Resume / CV Document"
              accept=".pdf,.doc,.docx"
              type="document"
              valueUrl={resumeUrl}
              valueFilename={resumeFilename}
              onUploadSuccess={(url, name) => {
                setResumeUrl(url);
                setResumeFilename(name);
              }}
              onRemove={() => {
                setResumeUrl("");
                setResumeFilename("");
              }}
              optional
            />
          </section>
        )}

        {/* FINAL SUBMISSION MESSAGE & BUTTON */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3 p-4 bg-muted/60 border border-border rounded-3xl">
            <Sparkles className="text-amber-500 shrink-0" size={20} />
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              Filling out your entire profile gives Arch more context to find opportunities that are a better fit for you.
            </p>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-8 py-3.5 bg-foreground text-background font-medium text-base rounded-full hover:bg-foreground/90 transition-all duration-300 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
