"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import {
  Sparkles,
  Bookmark,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { OpportunityCard } from "../../../components/opportunity-card";
import {
  MetricCardSkeleton,
  ChartSkeleton,
  OpportunityCardSkeleton,
  SavedItemSkeleton,
  TimelineItemSkeleton,
} from "../../../components/skeletons";

// ============================================================================
// 8. EMPTY-STATE DEVELOPMENT TOGGLES
// Toggle these mock constants to quickly test all dashboard states.
// Set MOCK_PROFILE_COMPLETION to a number (< 20 to test gate, >= 20 for dashboard),
// or set to null to use real profile completion score from backend API.
// ============================================================================
const MOCK_PROFILE_COMPLETION: number | null = 20; // Set < 20 (e.g. 1) to test completion gate
const SHOW_MOCK_MATCHES = true;     // Set false to test empty matches state
const SHOW_MOCK_SAVED = true;       // Set false to test empty saved state
const SHOW_MOCK_TIMELINE = true;    // Set false to test empty timeline state

// Mock Data Definitions
const MOCK_MATCHES_DATA = [
  {
    id: "opp-1",
    title: "Senior Full-Stack Engineer",
    organization: "Vercel",
    type: "Job",
    location: "Remote (Global)",
    deadline: "In 14 days",
    matchScore: 96,
    tags: ["TypeScript", "Next.js", "Serverless"],
  },
  {
    id: "opp-2",
    title: "Global Climate Innovation Grant",
    organization: "Earth Foundation",
    type: "Grant",
    location: "Worldwide",
    deadline: "In 21 days",
    matchScore: 91,
    tags: ["Climate Tech", "$50k - $150k", "Non-dilutive"],
  },
  {
    id: "opp-3",
    title: "AI Systems & Intelligence Hackathon",
    organization: "Anthropic",
    type: "Hackathon",
    location: "Online",
    deadline: "In 5 days",
    matchScore: 88,
    tags: ["Generative AI", "$100k Prize Pool"],
  },
];

const MOCK_SAVED_DATA = [
  {
    id: "saved-1",
    title: "Senior Product Engineer",
    organization: "Linear",
    type: "Job",
    savedDate: "Saved 2 days ago",
    matchScore: 94,
  },
  {
    id: "saved-2",
    title: "Open Source Fellowship 2026",
    organization: "Mozilla Foundation",
    type: "Fellowship",
    savedDate: "Saved 5 days ago",
    matchScore: 89,
  },
];

const MOCK_TIMELINE_DATA = [
  {
    id: "time-1",
    title: "AI Systems & Intelligence Hackathon",
    organization: "Anthropic",
    daysLeft: 5,
    label: "5 days left",
    urgency: "high", // high, medium, low
    percentRemaining: 25,
  },
  {
    id: "time-2",
    title: "Senior Full-Stack Engineer",
    organization: "Vercel",
    daysLeft: 14,
    label: "14 days left",
    urgency: "medium",
    percentRemaining: 60,
  },
  {
    id: "time-3",
    title: "Global Climate Innovation Grant",
    organization: "Earth Foundation",
    daysLeft: 21,
    label: "21 days left",
    urgency: "low",
    percentRemaining: 85,
  },
];

export default function HomePage() {
  const { data: session } = authClient.useSession();
  const [realProfileCompletion, setRealProfileCompletion] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mock loading states
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setLoadingMetrics(false), 300);
    const t2 = setTimeout(() => setLoadingMatches(false), 500);
    const t3 = setTimeout(() => setLoadingSaved(false), 600);
    const t4 = setTimeout(() => setLoadingTimeline(false), 800);
    const t5 = setTimeout(() => setLoadingCharts(false), 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  // Fetch actual completeness score from profile backend if mock override is null
  useEffect(() => {
    if (MOCK_PROFILE_COMPLETION !== null) return;

    async function checkCompleteness() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const res = await fetch(`${apiUrl}/api/profile`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.profile?.completenessScore === "number") {
            setRealProfileCompletion(data.profile.completenessScore);
          }
        }
      } catch {
        // Fall back
      }
    }
    checkCompleteness();
  }, []);

  const profileCompletion =
    MOCK_PROFILE_COMPLETION !== null
      ? MOCK_PROFILE_COMPLETION
      : (realProfileCompletion ?? 0);

  // 1. PROFILE COMPLETION GATE (< 20%)
  if (profileCompletion < 20) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-medium text-foreground">Home</h1>
        </div>

        {/* Minimal Gate Empty State */}
        <div className="rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-5 transition-all">
          <div className="p-4 bg-muted rounded-full text-foreground">
            <Sparkles size={28} strokeWidth={1.5} />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="font-display text-xl font-medium text-foreground">
              Complete your profile first
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add a little more about yourself so Arch can start finding opportunities that fit you.
            </p>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium text-sm rounded-full hover:bg-foreground/90 transition-all cursor-pointer shadow-md"
          >
            <span>Complete profile</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // 2. FULL DASHBOARD CONTENT (Profile Completion >= 20%)
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-medium text-foreground">Home</h1>
      </div>

      {/* 2. METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loadingMetrics ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="border border-border rounded-3xl p-5 bg-card flex flex-col justify-between gap-3 transition-all hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Matches
                </span>
                <div className="p-2 bg-muted rounded-full text-foreground">
                  <Sparkles size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-medium text-foreground">24</div>
              </div>
            </div>

            <div className="border border-border rounded-3xl p-5 bg-card flex flex-col justify-between gap-3 transition-all hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Saved
                </span>
                <div className="p-2 bg-muted rounded-full text-foreground">
                  <Bookmark size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-medium text-foreground">8</div>
              </div>
            </div>

            <div className="border border-border rounded-3xl p-5 bg-card flex flex-col justify-between gap-3 transition-all hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pursuing
                </span>
                <div className="p-2 bg-muted rounded-full text-foreground">
                  <Briefcase size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <div className="font-display text-3xl font-medium text-foreground">3</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. TWO CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loadingCharts ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Chart 1: Opportunities Discovered Over Time */}
            <div className="border border-border rounded-3xl p-6 bg-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-medium text-foreground">
                Opportunities Discovered
              </h3>
            </div>
            <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-full text-foreground">
              Past 7 Days
            </span>
          </div>

          {/* SVG Line / Area Chart */}
          <div className="w-full h-36 pt-2">
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Background Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="400" y2="70" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="400" y2="110" stroke="currentColor" strokeOpacity="0.06" />

              {/* Area Fill */}
              <path
                d="M 10,95 Q 70,80 130,55 T 250,40 T 370,18 L 370,110 L 10,110 Z"
                className="text-foreground fill-current"
              />

              {/* Line */}
              <path
                d="M 10,95 Q 70,80 130,55 T 250,40 T 370,18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-foreground"
              />

              {/* Data points */}
              <circle cx="10" cy="95" r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
              <circle cx="70" cy="82" r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
              <circle cx="130" cy="55" r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
              <circle cx="190" cy="48" r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
              <circle cx="250" cy="40" r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
              <circle cx="310" cy="28" r="3.5" className="fill-background stroke-foreground" strokeWidth="2" />
              <circle cx="370" cy="18" r="4.5" className="fill-foreground stroke-background" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Chart 2: Opportunity Journey */}
        <div className="border border-border rounded-3xl p-6 bg-card flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-medium text-foreground">
              Opportunity Journey
            </h3>
          </div>

          <div className="space-y-4 my-auto">
            {/* Matched Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" /> Matched
                </span>
                <span className="font-mono text-muted-foreground">24 (100%)</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-foreground h-full rounded-full w-full" />
              </div>
            </div>

            {/* Saved Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Bookmark size={12} className="text-emerald-500" /> Saved
                </span>
                <span className="font-mono text-muted-foreground">8 (33%)</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-foreground/70 h-full rounded-full w-[33%]" />
              </div>
            </div>

            {/* Pursuing Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <Briefcase size={12} className="text-blue-500" /> Pursuing
                </span>
                <span className="font-mono text-muted-foreground">3 (12.5%)</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-foreground/40 h-full rounded-full w-[12.5%]" />
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
            <span>Overall Conversion</span>
            <span className="font-medium text-foreground font-mono">12.5% Pursued</span>
          </div>
        </div>
          </>
        )}
      </div>

      {/* 4. RECENT MATCHES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-medium text-foreground">Recent Matches</h2>
          </div>
          <Link
            href="/opportunities"
            className="text-xs font-medium text-foreground hover:opacity-70 flex items-center gap-1 transition-opacity"
          >
            <span>View all opportunities</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loadingMatches ? (
          <div className="space-y-3">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </div>
        ) : SHOW_MOCK_MATCHES ? (
          <div className="space-y-3">
            {MOCK_MATCHES_DATA.map((opp) => (
              <OpportunityCard
                key={opp.id}
                id={opp.id}
                title={opp.title}
                organization={opp.organization}
                type={opp.type}
                matchScore={opp.matchScore}
                location={opp.location}
                deadline={opp.deadline}
                tags={opp.tags}
                isSaved={savedIds.has(opp.id)}
                onSaveToggle={toggleSave}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <Sparkles size={24} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No matches found yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              As new opportunities are discovered, your matched recommendations will appear here.
            </p>
          </div>
        )}
      </section>

      {/* 5. RECENT SAVED & 6. SAVED TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Recent Saved */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium text-foreground">Recent Saved</h2>
            <Link
              href="/saved"
              className="text-xs font-medium text-foreground hover:opacity-70 flex items-center gap-1"
            >
              <span>View saved</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {loadingSaved ? (
            <div className="space-y-3">
              <SavedItemSkeleton />
              <SavedItemSkeleton />
              <SavedItemSkeleton />
            </div>
          ) : SHOW_MOCK_SAVED ? (
            <div className="space-y-3">
              {MOCK_SAVED_DATA.map((saved) => (
                <div
                  key={saved.id}
                  className="border border-border rounded-3xl p-4 bg-card flex items-center justify-between gap-3 transition-all hover:border-foreground/30"
                >
                  <div className="space-y-0.5 truncate">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {saved.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {saved.organization} • <span className="font-mono">{saved.savedDate}</span>
                    </p>
                  </div>
                  <span className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium shrink-0">
                    {saved.matchScore}% Match
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-3xl p-6 text-center text-xs text-muted-foreground">
              No saved opportunities yet. Saved opportunities will appear here.
            </div>
          )}
        </section>

        {/* 6. Saved Opportunity Timeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium text-foreground">Deadline Timeline</h2>
            <span className="text-xs text-muted-foreground">Urgency overview</span>
          </div>

          {loadingTimeline ? (
            <div className="border border-border rounded-3xl p-6 bg-card">
              <div className="space-y-6">
                <TimelineItemSkeleton />
                <TimelineItemSkeleton />
                <TimelineItemSkeleton />
              </div>
            </div>
          ) : SHOW_MOCK_TIMELINE ? (
            <div className="border border-border rounded-3xl p-5 bg-card space-y-4">
              {MOCK_TIMELINE_DATA.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <span className="text-muted-foreground ml-1.5">• {item.organization}</span>
                    </div>
                    <span
                      className={`font-mono font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        item.urgency === "high"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.urgency === "high" ? "bg-amber-500" : "bg-foreground/70"
                      }`}
                      style={{ width: `${100 - item.percentRemaining}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-3xl p-6 text-center text-xs text-muted-foreground">
              No active deadlines to track. Save opportunities to view their closing timeline.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
