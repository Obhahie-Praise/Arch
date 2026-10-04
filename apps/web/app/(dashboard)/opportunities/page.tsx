"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { authClient } from "../../../lib/auth-client";
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
const MOCK_PROFILE_COMPLETION: number | null = 20; // Set < 20 to test completion gate

export default function OpportunitiesPage() {
  const { data: session } = authClient.useSession();
  const [realProfileCompletion, setRealProfileCompletion] = useState<
    number | null
  >(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Real backend integration states
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch actual completeness score from profile backend if mock override is null
  useEffect(() => {
    if (MOCK_PROFILE_COMPLETION !== null) return;
    async function checkCompleteness() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const res = await fetch(`${apiUrl}/api/profile`, {
          credentials: "include",
        });
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

  // Fetch opportunities from backend when profile is complete enough
  useEffect(() => {
    if (profileCompletion < 20) {
      setIsLoading(false);
      return;
    }

    async function fetchOpportunities() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const res = await fetch(`${apiUrl}/api/opportunities`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setOpportunities(json.data || []);
          
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
        }
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOpportunities();
  }, [profileCompletion]);

  // Derived state for available filter pills based on current data
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    opportunities.forEach((opp) => {
      // Uppercase first letter to match mock style if needed, but wait, type might be lowercase 'job', 'grant' etc
      types.add(opp.type);
    });
    return ["All", ...Array.from(types)] as string[];
  }, [opportunities]);

  // Filter logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Type filter
      if (activeType !== "All" && opp.type !== activeType) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(query);
        const matchesOrg = opp.organizationName?.toLowerCase().includes(query);
        const matchesDesc = opp.description?.toLowerCase().includes(query);
        const matchesSkills = opp.skills?.some((s: string) =>
          s.toLowerCase().includes(query)
        );
        const matchesType = opp.type?.toLowerCase().includes(query);

        if (
          !matchesTitle &&
          !matchesOrg &&
          !matchesDesc &&
          !matchesSkills &&
          !matchesType
        ) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, searchQuery, activeType]);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
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
          <h1 className="font-display text-3xl font-medium text-foreground">
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

  // 2. FULL DASHBOARD (>= 20%)
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-medium text-foreground">
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
      </div>

      {/* Opportunity List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <OpportunityCardSkeleton key={i} />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          // Empty state: No data at all
          <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Sparkles size={24} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No opportunities available
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              We are currently sourcing new opportunities. Check back later.
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          // Empty state: No search/filter results
          <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Search size={24} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No opportunities match your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveType("All");
              }}
              className="text-xs font-medium bg-muted px-4 py-2 rounded-full hover:bg-muted/80 transition-colors mt-2"
            >
              Clear filters
            </button>
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

      {/* 30-opportunity limit notice */}
      {filteredOpportunities.length > 0 && (
        <div className="pt-6 pb-2 text-center space-y-1">
          <p className="text-xs font-medium text-foreground">
            Arch currently surfaces up to 30 opportunities for you each week.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Upgrade to Pro to unlock a higher weekly limit.
          </p>
        </div>
      )}
    </div>
  );
}
