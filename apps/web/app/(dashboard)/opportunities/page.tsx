"use client";
import { API_URL } from "../../../lib/api";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import { cachedFetch } from "../../../lib/cache";
import {
  Sparkles,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { OpportunityCard } from "../../../components/opportunity-card";
import { OpportunityCardSkeleton } from "../../../components/skeletons";

// Reuse the mock profile completion for consistency with Home
const MOCK_PROFILE_COMPLETION: number | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the canonical cache key for a given page/filter combination. */
function buildOppsUrl(
  page: number,
  activeType: string,
  debouncedSearch: string,
  matchedFilter: boolean
): string {
  const params = new URLSearchParams({ page: page.toString(), pageSize: "30" });
  if (activeType !== "All") params.append("type", activeType);
  if (debouncedSearch) params.append("search", debouncedSearch);
  if (matchedFilter) params.append("matched", "true");
  return `${API_URL}/api/opportunities?${params.toString()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpportunitiesPage() {
  const { data: session } = authClient.useSession();
  const [realProfileCompletion, setRealProfileCompletion] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [matchedFilter, setMatchedFilter] = useState(false);

  // Derive the URL for the current filter state so we can peek the cache
  // synchronously before the component even mounts effects.
  const currentUrl = buildOppsUrl(page, activeType, debouncedSearch, matchedFilter);

  // ── Cache-primed initial state ──────────────────────────────────────────
  // Initialise from cache synchronously so that navigating back to this page
  // never flashes an empty list when valid data is already in memory.
  const [opportunities, setOpportunities] = useState<any[]>(() => {
    const cached = cachedFetch.peek<any>(currentUrl);
    return cached?.data ?? [];
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    const cached = cachedFetch.peek<any>(currentUrl);
    if (!cached?.data) return new Set();
    const saved = new Set<string>();
    (cached.data as any[]).forEach((opp) => {
      if (opp.userStatus === "saved" || opp.userStatus === "pursuing") saved.add(opp.id);
    });
    return saved;
  });

  const hasCachedData = opportunities.length > 0;

  // When we already have cached data, do not show loading skeletons — fetch
  // silently in the background to revalidate.
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [hasError, setHasError] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  // knownTypes accumulates every opportunity type seen across all fetches so
  // filter pills never disappear when a type filter narrows the result set.
  const [knownTypes, setKnownTypes] = useState<string[]>(() => {
    const cached = cachedFetch.peek<any>(currentUrl);
    if (!cached?.data) return [];
    const types = new Set<string>();
    (cached.data as any[]).forEach((opp) => { if (opp.type) types.add(opp.type); });
    return Array.from(types);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeType]);

  // Fetch completeness score from profile backend if mock override is null
  useEffect(() => {
    if (MOCK_PROFILE_COMPLETION !== null) return;
    async function checkCompleteness() {
      try {
        const data = await cachedFetch<any>(`${API_URL}/api/profile`, {
          credentials: "include",
          ttl: 120_000,
        });
        if (typeof data.profile?.completenessScore === "number") {
          setRealProfileCompletion(data.profile.completenessScore);
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

  // Fetch opportunities from backend when profile is complete enough
  useEffect(() => {
    if (profileCompletion < 20) {
      setIsLoading(false);
      return;
    }

    async function fetchOpportunities() {
      // Only show loading skeleton when there is nothing to display yet
      const url = buildOppsUrl(page, activeType, debouncedSearch, matchedFilter);
      const alreadyCached = cachedFetch.peek<any>(url);
      if (!alreadyCached) setIsLoading(true);

      try {
        const json = await cachedFetch<any>(url, {
          credentials: "include",
          ttl: 60_000,
        });

        setOpportunities(json.data || []);

        // Accumulate known types — never remove a type that was already visible
        if (json.data?.length) {
          setKnownTypes((prev) => {
            const next = new Set(prev);
            (json.data as any[]).forEach((opp) => {
              if (opp.type) next.add(opp.type as string);
            });
            return prev.length === next.size ? prev : Array.from(next);
          });
        }
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages);
          setTotal(json.pagination.total ?? 0);
          setHasNext(!!json.pagination.hasNext);
          setHasPrevious(!!json.pagination.hasPrevious);
        }
        if (json.meta) {
          setIsDeveloper(!!json.meta.isDeveloper);
        }

        // Seed saved status from backend userStatus
        if (json.data) {
          const saved = new Set<string>();
          json.data.forEach((opp: any) => {
            if (opp.userStatus === "saved" || opp.userStatus === "pursuing") {
              saved.add(opp.id);
            }
          });
          setSavedIds(saved);
        }
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
        // Preserve existing data on error when we have something to show
        if (opportunities.length === 0) setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileCompletion, page, activeType, debouncedSearch, matchedFilter]);

  const availableTypes = useMemo(
    () => ["All", ...knownTypes],
    [knownTypes]
  );

  const filteredOpportunities = opportunities;

  const hasActiveFilters =
    debouncedSearch.trim() !== "" ||
    activeType !== "All" ||
    matchedFilter;

  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isCurrentlySaved = savedIds.has(id);

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const method = isCurrentlySaved ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/api/opportunities/${id}/save`, {
        method,
        credentials: "include",
      });

      if (!res.ok) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlySaved) next.add(id);
          else next.delete(id);
          return next;
        });
      } else {
        cachedFetch.invalidate(`${API_URL}/api/opportunities/home`);
        cachedFetch.invalidatePrefix(`${API_URL}/api/opportunities?`);
        cachedFetch.invalidate(`${API_URL}/api/opportunities`);
      }
    } catch (err) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  // ── 1. PROFILE COMPLETION GATE (< 20%) ──────────────────────────────────
  if (profileCompletion < 20) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
            Opportunities
          </h1>
        </div>

        <div className="rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-5 transition-all">
          <div className="p-4 bg-muted rounded-full text-foreground">
            <Sparkles size={28} strokeWidth={1.5} />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="font-display text-xl font-medium text-foreground">
              Complete your profile first
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add a little more about yourself so Arch can start finding
              opportunities that fit you.
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

  // ── 2. MATCHING STATE — no results, no active filters ───────────────────
  // The matching engine ran and returned zero results (not caused by search or
  // type filters). Show an intentional state rather than implying Arch has no
  // opportunities.
  if (!isLoading && !hasError && opportunities.length === 0 && !hasActiveFilters) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
            Opportunities
          </h1>
        </div>
        <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="p-3 bg-muted/40 rounded-full">
            <Sparkles size={22} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <p className="text-sm font-medium text-foreground">
              Finding your opportunities
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Arch is matching opportunities to your profile. Your best-fit results will appear here as they become available.
            </p>
          </div>
          <Link
            href="/profile"
            className="text-xs font-medium text-foreground hover:opacity-70 flex items-center gap-1 transition-opacity mt-1"
          >
            <span>Strengthen your profile</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  // ── 3. FULL DASHBOARD (profile complete, results available or loading) ───
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
          Opportunities
        </h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search by title, organization, skills, or type..."
          className="w-full pl-11 pr-10 py-3.5 bg-card/50 backdrop-blur-2xl border border-border/50 rounded-full text-sm focus:outline-none focus:border-foreground/30 transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeType === type
                ? "bg-foreground text-background"
                : "bg-muted/30 backdrop-blur-2xl text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {type}
          </button>
        ))}

        {/* Matched pill — developer account only */}
        {isDeveloper && (
          <button
            onClick={() => {
              setMatchedFilter((prev) => !prev);
              setPage(1);
            }}
            className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              matchedFilter
                ? "bg-emerald-600 text-white"
                : "bg-muted/30 backdrop-blur-2xl text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            matched
          </button>
        )}
      </div>

      {/* Opportunity List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <OpportunityCardSkeleton key={i} />
            ))}
          </div>
        ) : hasError ? (
          <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-red-500">
              Failed to load opportunities. Please try again.
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          // Filtered/search empty state — opportunities exist but current
          // query/filters return nothing. Keep the full page layout intact.
          <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Search size={24} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No opportunities found
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              We couldn&apos;t find any opportunities matching your current{" "}
              {debouncedSearch && activeType !== "All"
                ? "search or filters"
                : debouncedSearch
                ? "search"
                : "filters"}
              .
            </p>
            <div className="flex items-center gap-2 mt-1">
              {debouncedSearch && activeType !== "All" ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveType("All");
                    setMatchedFilter(false);
                  }}
                  className="text-xs font-medium bg-muted px-4 py-2 rounded-full hover:bg-muted/80 transition-colors"
                >
                  Clear search &amp; filters
                </button>
              ) : (
                <>
                  {debouncedSearch && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs font-medium bg-muted px-4 py-2 rounded-full hover:bg-muted/80 transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                  {(activeType !== "All" || matchedFilter) && (
                    <button
                      onClick={() => {
                        setActiveType("All");
                        setMatchedFilter(false);
                      }}
                      className="text-xs font-medium bg-muted px-4 py-2 rounded-full hover:bg-muted/80 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                id={opp.id}
                title={opp.title}
                organization={opp.organizationName || opp.organization || "Unknown Organization"}
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
        )}
      </section>

      {/* Pagination */}
      {filteredOpportunities.length > 0 && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">{total}</span>
            {" opportunit"}{total === 1 ? "y" : "ies"}
            {" · Page "}
            <span className="font-medium text-foreground">{page}</span>
            {" of "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                cachedFetch.invalidatePrefix(`${API_URL}/api/opportunities?`);
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={!hasPrevious || isLoading}
              className="px-3 py-1.5 text-sm text-muted-foreground rounded-full transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              aria-label="Previous page"
            >
              ‹ Previous
            </button>
            <button
              onClick={() => {
                cachedFetch.invalidatePrefix(`${API_URL}/api/opportunities?`);
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={!hasNext || isLoading}
              className="px-3 py-1.5 text-sm text-muted-foreground rounded-full transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              aria-label="Next page"
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* Matching context message */}
      {filteredOpportunities.length > 0 && !isDeveloper && (
        <div className="pb-2 text-center">
          <p className="text-xs text-muted-foreground">
            These opportunities have been matched to your profile.
          </p>
        </div>
      )}
    </div>
  );
}
