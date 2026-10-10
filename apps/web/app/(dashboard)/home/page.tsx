"use client";
import { API_URL } from "../../../lib/api";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import { cachedFetch } from "../../../lib/cache";
import {
  Sparkles,
  Bookmark,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { OpportunityCard } from "../../../components/opportunity-card";
import {
  MetricCardSkeleton,
  ChartSkeleton,
  OpportunityCardSkeleton,
  SavedItemSkeleton,
  TimelineItemSkeleton,
} from "../../../components/skeletons";



// ─── Data shapes ────────────────────────────────────────────────────────────

interface HomeSummary {
  metrics: { matches: number; saved: number; pursuing: number };
  recentMatches: any[];
  recentSaved: any[];
  timeline: {
    id: string;
    title: string;
    organization: string;
    deadline: string;
    daysLeft: number;
    label: string;
    urgency: "high" | "medium" | "low";
    percentRemaining: number;
  }[];
  discoveryChart: { day: string; created: number }[];
}

// ─── Discovery bar chart (pure CSS, no external library) ────────────────────

function DiscoveryBarChart({ data }: { data: { day: string; created: number }[] }) {
  const [tooltip, setTooltip] = React.useState<{ index: number } | null>(null);
  const max = Math.max(...data.map((d) => d.created), 1);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totalCreated = data.reduce((s, d) => s + d.created, 0);

  if (totalCreated === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
        <Sparkles size={20} className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">No discoveries in the last 7 days</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      {/* Bars */}
      <div className="flex-1 flex items-end gap-1.5 min-h-0">
        {data.map((d, i) => {
          const heightPct = max > 0 ? (d.created / max) * 100 : 0;
          const isActive = tooltip?.index === i;
          const dayName = days[new Date(d.day + "T12:00:00").getDay()];
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 h-full relative group"
              onMouseEnter={() => setTooltip({ index: i })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Tooltip */}
              {isActive && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="bg-foreground text-background text-[10px] font-medium rounded-lg px-2 py-1 whitespace-nowrap shadow-md">
                    {d.created} discovered
                    <br />
                    <span className="opacity-60">{dayName}, {d.day.slice(5)}</span>
                  </div>
                  <div className="w-2 h-2 bg-foreground/30 backdrop-blur-2xl rotate-45 mx-auto -mt-1" />
                </div>
              )}
              {/* Bar container */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isActive ? "bg-foreground" : "bg-foreground/60 group-hover:bg-foreground/80"
                  }`}
                  style={{
                    height: d.created > 0
                      ? `${Math.max(heightPct, 4)}%`
                      : "2px",
                    opacity: d.created === 0 ? 0.2 : 1,
                  }}
                />
              </div>
              <span className={`text-[10px] transition-colors ${
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>
                {dayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Journey chart ───────────────────────────────────────────────────────────

function JourneyChart({
  matches,
  saved,
  pursuing,
}: {
  matches: number;
  saved: number;
  pursuing: number;
}) {
  const base = Math.max(matches, 1);
  const savedPct = Math.round((saved / base) * 100);
  const pursuingPct = Math.round((pursuing / base) * 100);

  return (
    <div className="space-y-4 my-auto">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" /> Matched
          </span>
          <span className="font-mono text-muted-foreground">{matches} (100%)</span>
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
          <div className="bg-foreground h-full rounded-full w-full" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <Bookmark size={12} className="text-emerald-500" /> Saved
          </span>
          <span className="font-mono text-muted-foreground">
            {saved} ({savedPct}%)
          </span>
        </div>
        <div className="w-full bg-muted/30 backdrop-blur-2xl h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-foreground/70 h-full rounded-full transition-all duration-500"
            style={{ width: `${savedPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <Briefcase size={12} className="text-blue-500" /> Pursuing
          </span>
          <span className="font-mono text-muted-foreground">
            {pursuing} ({pursuingPct}%)
          </span>
        </div>
        <div className="w-full bg-muted/30 backdrop-blur-2xl h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-foreground/40 h-full rounded-full transition-all duration-500"
            style={{ width: `${pursuingPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session } = authClient.useSession();
  const [realProfileCompletion, setRealProfileCompletion] = useState<number | null>(null);

  // ── Cache-primed initial state ──────────────────────────────────────────
  // Read the home summary synchronously from the in-memory cache so that
  // returning to this page never resets to an empty state before the async
  // fetch resolves. On the first visit this will be null and the page falls
  // back to skeleton loading as before.
  const [summary, setSummary] = useState<HomeSummary | null>(() => {
    const cached = cachedFetch.peek<{ data: HomeSummary }>(`${API_URL}/api/opportunities/home`);
    return cached?.data ?? null;
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    const cached = cachedFetch.peek<{ data: HomeSummary }>(`${API_URL}/api/opportunities/home`);
    if (!cached?.data) return new Set();
    const saved = new Set<string>();
    cached.data.recentMatches.forEach((opp: any) => {
      if (opp.userStatus === "saved" || opp.userStatus === "pursuing") saved.add(opp.id);
    });
    cached.data.recentSaved.forEach((opp: any) => saved.add(opp.id));
    return saved;
  });
  const [hasError, setHasError] = useState(false);

  // Progressive loading states.
  // When we already have cached data, start all sections as NOT loading so
  // valid data is shown immediately. We still fetch in the background to
  // revalidate, but we don't show skeletons while doing so.
  const hasCachedSummary = summary !== null;
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(!hasCachedSummary);
  const [loadingCharts, setLoadingCharts] = useState(!hasCachedSummary);
  const [loadingMatches, setLoadingMatches] = useState(!hasCachedSummary);
  const [loadingSaved, setLoadingSaved] = useState(!hasCachedSummary);
  const [loadingTimeline, setLoadingTimeline] = useState(!hasCachedSummary);

  const profileCompletion = realProfileCompletion ?? 0;

  // Fetch profile completion from the API
  useEffect(() => {
    async function check() {
      try {
        const data = await cachedFetch<any>(`${API_URL}/api/profile`, {
          credentials: "include",
          ttl: 120_000, // 2 min — profile changes rarely
        });
        if (typeof data.profile?.completenessScore === "number") {
          setRealProfileCompletion(data.profile.completenessScore);
        }
      } catch {
        // fall back to 0
      } finally {
        setLoadingProfile(false);
      }
    }
    check();
  }, []);

  // Fetch home summary
  const fetchSummary = useCallback(async () => {
    if (profileCompletion < 20) {
      setLoadingMetrics(false);
      setLoadingCharts(false);
      setLoadingMatches(false);
      setLoadingSaved(false);
      setLoadingTimeline(false);
      return;
    }

    try {
      const json = await cachedFetch<{ data: HomeSummary }>(
        `${API_URL}/api/opportunities/home`,
        { credentials: "include", ttl: 60_000 }
      );
      const data = json.data;
      setSummary(data);

      // Refresh saved IDs from the latest server response
      const saved = new Set<string>();
      data.recentMatches.forEach((opp: any) => {
        if (opp.userStatus === "saved" || opp.userStatus === "pursuing") saved.add(opp.id);
      });
      data.recentSaved.forEach((opp: any) => saved.add(opp.id));
      setSavedIds(saved);
    } catch {
      // Preserve cached data — only set error when there is nothing to show
      if (!hasCachedSummary) setHasError(true);
    }

    // When we had cached data, loading flags were already false — just ensure
    // they are cleared. On a first visit, stagger them for a progressive reveal.
    if (!hasCachedSummary) {
      const t1 = setTimeout(() => setLoadingMetrics(false), 300);
      const t2 = setTimeout(() => setLoadingMatches(false), 500);
      const t3 = setTimeout(() => setLoadingSaved(false), 650);
      const t4 = setTimeout(() => setLoadingTimeline(false), 800);
      const t5 = setTimeout(() => setLoadingCharts(false), 1000);
      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
        clearTimeout(t4); clearTimeout(t5);
      };
    } else {
      setLoadingMetrics(false);
      setLoadingMatches(false);
      setLoadingSaved(false);
      setLoadingTimeline(false);
      setLoadingCharts(false);
    }
  }, [profileCompletion, hasCachedSummary]);

  useEffect(() => {
    const cleanup = fetchSummary();
    return () => { cleanup?.then?.(fn => fn?.()); };
  }, [fetchSummary]);

  // Optimistic save toggle — invalidates the home cache so next visit is fresh
  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const wasSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      const method = wasSaved ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/api/opportunities/${id}/save`, {
        method,
        credentials: "include",
      });
      if (!res.ok) {
        // revert
        setSavedIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(id) : next.delete(id);
          return next;
        });
      } else {
        cachedFetch.invalidate(`${API_URL}/api/opportunities/home`);
        cachedFetch.invalidatePrefix(`${API_URL}/api/opportunities?`);
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  // ── Profile completion gate ───────────────────────────────────────────────
  if (!loadingProfile && profileCompletion < 20) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Home</h1>
        </div>
        <div className="rounded-4xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-5 transition-all">
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

  const metrics = summary?.metrics ?? { matches: 0, saved: 0, pursuing: 0 };
  const recentMatches = summary?.recentMatches ?? [];
  const recentSaved = summary?.recentSaved ?? [];
  const timeline = summary?.timeline ?? [];
  const chart = summary?.discoveryChart ?? [];

  // The discovery chart represents global system activity (opportunities Arch has
  // found), not a user's personal match state. If any day has discovered
  // opportunities, show the full dashboard rather than an empty-state placeholder.
  const hasDiscoveryActivity = chart.some((d) => d.created > 0);

  const isDataEmpty =
    !loadingMetrics &&
    !hasError &&
    !hasDiscoveryActivity &&
    metrics.matches === 0 &&
    metrics.saved === 0 &&
    metrics.pursuing === 0 &&
    recentMatches.length === 0 &&
    recentSaved.length === 0 &&
    timeline.length === 0;

  if (isDataEmpty) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Home</h1>
        </div>
        <div className="rounded-4xl p-8 text-center flex flex-col items-center justify-center gap-3 mt-8">
          <Sparkles size={24} className="text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No matches found yet</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            As new opportunities are discovered, your matched recommendations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Home</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loadingMetrics ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl flex flex-col justify-between gap-3 transition-all hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Matches</span>
                <div className="p-2 bg-muted/20 backdrop-blur-2xl rounded-full text-foreground">
                  <Sparkles size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div className="font-display text-3xl font-medium text-foreground">
                {metrics.matches}
              </div>
            </div>

            <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl flex flex-col justify-between gap-3 transition-all hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saved</span>
                <div className="p-2 bg-muted/30 backdrop-blur-2xl rounded-full text-foreground">
                  <Bookmark size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div className="font-display text-3xl font-medium text-foreground">
                {metrics.saved}
              </div>
            </div>

            <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl flex flex-col justify-between gap-3 transition-all hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pursuing</span>
                <div className="p-2 bg-muted/30 backdrop-blur-2xl rounded-full text-foreground">
                  <Briefcase size={16} strokeWidth={1.5} />
                </div>
              </div>
              <div className="font-display text-3xl font-medium text-foreground">
                {metrics.pursuing}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loadingCharts ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Discovery Chart */}
            <div className="border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl flex flex-col gap-4" style={{ minHeight: "220px" }}>
              <div className="flex items-center justify-between shrink-0">
                <h3 className="font-display text-base font-medium text-foreground">
                  Opportunities Discovered
                </h3>
                <span className="text-xs font-mono bg-muted/30 backdrop-blur-2xl px-2.5 py-1 rounded-full text-foreground">
                  Past 7 Days
                </span>
              </div>
              <DiscoveryBarChart data={chart} />
            </div>

            {/* Journey Chart */}
            <div className="border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl flex flex-col justify-between gap-4">
              <h3 className="font-display text-base font-medium text-foreground">
                Opportunity Journey
              </h3>
              <JourneyChart
                matches={metrics.matches}
                saved={metrics.saved}
                pursuing={metrics.pursuing}
              />
              <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
                <span>Overall Conversion</span>
                <span className="font-medium text-foreground font-mono">
                  {metrics.matches > 0
                    ? `${Math.round((metrics.pursuing / metrics.matches) * 100)}% Pursued`
                    : "—"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Matches */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-foreground">Recent Matches</h2>
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
        ) : hasError ? (
          <div className="border border-dashed border-border rounded-4xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-red-500">
              Failed to load recent matches. Please try again.
            </p>
          </div>
        ) : recentMatches.length > 0 ? (
          <div className="space-y-3">
            {recentMatches.map((opp: any) => (
              <OpportunityCard
                key={opp.id}
                id={opp.id}
                title={opp.title}
                organization={opp.organizationName || opp.organization || ""}
                type={opp.type}
                matchScore={opp.matchScore}
                location={opp.location}
                deadline={opp.deadline}
                tags={opp.skills || []}
                isSaved={savedIds.has(opp.id)}
                onSaveToggle={toggleSave}
                actionMode="bookmark"
              />
            ))}
          </div>
        ) : (
          // The matching engine ran and returned zero results. Show an honest,
          // reassuring state rather than implying the catalogue is empty.
          <div className="border border-dashed border-border/60 rounded-4xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-muted/40 rounded-full">
              <Sparkles size={20} className="text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-medium text-foreground">Finding your opportunities</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Arch is matching opportunities to your profile. Your best-fit results will appear here as they become available.
              </p>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-medium text-foreground hover:opacity-70 flex items-center gap-1 transition-opacity mt-1"
            >
              <span>Browse all opportunities</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </section>

      {/* Recent Saved & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Saved */}
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
          ) : recentSaved.length > 0 ? (
            <div className="space-y-3">
              {recentSaved.map((opp: any) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="border border-border/50 rounded-4xl p-4 bg-card/30 backdrop-blur-2xl flex items-center justify-between gap-3 transition-all hover:border-foreground/30"
                >
                  <div className="space-y-0.5 truncate">
                    <h4 className="text-sm font-medium text-foreground truncate">{opp.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {opp.organizationName || opp.organization}
                    </p>
                  </div>
                  {opp.matchScore != null && (
                    <span className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium shrink-0">
                      {opp.matchScore}% Match
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-4xl p-6 text-center text-xs text-muted-foreground">
              No saved opportunities yet. Saved opportunities will appear here.
            </div>
          )}
        </section>

        {/* Deadline Timeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium text-foreground">Deadline Timeline</h2>
            <span className="text-xs text-muted-foreground">Urgency overview</span>
          </div>

          {loadingTimeline ? (
            <div className="border border-border rounded-4xl p-6 bg-card">
              <div className="space-y-6">
                <TimelineItemSkeleton />
                <TimelineItemSkeleton />
                <TimelineItemSkeleton />
              </div>
            </div>
          ) : timeline.length > 0 ? (
            <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl space-y-4">
              {timeline.map((item) => (
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
            <div className="rounded-4xl p-6 text-center text-xs text-muted-foreground">
              No active deadlines to track. Save opportunities to view their closing timeline.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
