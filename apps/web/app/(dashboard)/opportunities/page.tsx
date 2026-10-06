"use client";
import { API_URL } from "../../../lib/api";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
import { cachedFetch } from "../../../lib/cache";
import {
  Sparkles,
  Bookmark,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  X,
  ChevronRight,
} from "lucide-react";
import { OpportunityCard } from "../../../components/opportunity-card";
import { OpportunityCardSkeleton } from "../../../components/skeletons";

// Reuse the mock profile completion for consistency with Home
const MOCK_PROFILE_COMPLETION: number | null = null;

export default function OpportunitiesPage() {
  const { data: session } = authClient.useSession();
  const [realProfileCompletion, setRealProfileCompletion] = useState<
    number | null
  >(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Real backend integration states
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  // knownTypes accumulates every opportunity type seen across all fetches so the
  // filter pills never disappear when a type filter narrows the result set.
  const [knownTypes, setKnownTypes] = useState<string[]>([]);
  // Developer-only: whether the Matched filter is currently active.
  const [matchedFilter, setMatchedFilter] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeType]);

  // Fetch actual completeness score from profile backend if mock override is null
  useEffect(() => {
    if (MOCK_PROFILE_COMPLETION !== null) return;
    async function checkCompleteness() {
      try {
        const apiUrl = API_URL;
        const data = await cachedFetch<any>(`${apiUrl}/api/profile`, {
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
      setIsLoading(true);
      try {
        const apiUrl = API_URL;
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "30",
        });
        
        if (activeType !== "All") {
          params.append("type", activeType);
        }
        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }
        // matchedFilter is only ever true when isDeveloper — the server also enforces this.
        if (matchedFilter) {
          params.append("matched", "true");
        }

        const json = await cachedFetch<any>(`${apiUrl}/api/opportunities?${params.toString()}`, {
          credentials: "include",
          ttl: 60_000,
        });
        
        setOpportunities(json.data || []);

        // Accumulate types seen so far — never remove a type that was already visible.
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
        
        // Seed the saved status from the backend userStatus
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
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOpportunities();
  }, [profileCompletion, page, activeType, debouncedSearch, matchedFilter]);

  // Filter pills use knownTypes so the complete pill set stays visible regardless
  // of which type filter is currently active.
  const availableTypes = useMemo(
    () => ["All", ...knownTypes],
    [knownTypes]
  );

  // Filter logic is now server-side, so we just use opportunities
  const filteredOpportunities = opportunities;

  // True when the user has narrowed the result set via search/filters.
  // Used to distinguish a "no results for this query" state from a genuine
  // "no opportunities exist for this user" state.
  const hasActiveFilters =
    debouncedSearch.trim() !== "" ||
    activeType !== "All" ||
    matchedFilter;

  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    const isCurrentlySaved = savedIds.has(id);
    
    // Optimistic UI update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    
    // Persist via backend API
    try {
      const apiUrl = API_URL;
      const method = isCurrentlySaved ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/api/opportunities/${id}/save`, {
        method,
        credentials: "include",
      });
      
      if (!res.ok) {
        // Revert on failure
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlySaved) next.add(id);
          else next.delete(id);
          return next;
        });
      } else {
        // Invalidate caches
        cachedFetch.invalidate(`${apiUrl}/api/opportunities/home`);
        cachedFetch.invalidatePrefix(`${apiUrl}/api/opportunities?`);
        cachedFetch.invalidate(`${apiUrl}/api/opportunities`);
      }
    } catch (err) {
      // Revert on error
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  // 1. PROFILE COMPLETION GATE (< 20%)
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

  // 1.5 TRUE EMPTY STATE — no opportunities available at all, no active filters.
  // When filters/search are active and return 0 results, we stay in the full
  // dashboard layout and show the inline list-level empty state instead.
  if (!isLoading && !hasError && opportunities.length === 0 && !hasActiveFilters) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
            Opportunities
          </h1>
        </div>
        <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Sparkles size={24} className="text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No opportunities available
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            We are currently sourcing new opportunities. Check back later.
          </p>
        </div>
      </div>
    );
  }

  // 2. FULL DASHBOARD (>= 20%)
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
          className="w-full pl-11 pr-10 py-3.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:border-foreground/30 transition-colors"
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

      {/* Dynamic Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeType === type
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
          // Filtered/search empty state — opportunities exist but the current
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
              />
            ))}
          </div>
        )}
      </section>

      {/* Pagination row — always rendered when there are results so the layout never jumps */}
      {filteredOpportunities.length > 0 && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
          {/* Left: total count + page position */}
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">{total}</span>
            {" opportunit"}{total === 1 ? "y" : "ies"}
            {" · Page "}
            <span className="font-medium text-foreground">{page}</span>
            {" of "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>

          {/* Right: navigation controls */}
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

      {/* Access-limit / Pro messaging — below pagination, outside the list, secondary */}
      {filteredOpportunities.length > 0 && !isDeveloper && (
        <div className="pb-2 text-center space-y-0.5">
          <p className="text-xs text-muted-foreground">
            Arch currently surfaces up to 30 opportunities for you.
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            Pro version coming soon — you&apos;ll be able to unlock more very soon.
          </p>
        </div>
      )}
    </div>
  );
}
