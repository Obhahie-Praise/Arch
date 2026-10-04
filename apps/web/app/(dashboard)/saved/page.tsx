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
  X,
  ChevronRight,
} from "lucide-react";
import { OpportunityCard } from "../../../components/opportunity-card";
import { OpportunityCardSkeleton } from "../../../components/skeletons";

const MOCK_PROFILE_COMPLETION: number | null = null;

export default function SavedPage() {
  const { data: session } = authClient.useSession();
  const [realProfileCompletion, setRealProfileCompletion] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("All");
  
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pursuingIds, setPursuingIds] = useState<Set<string>>(new Set());

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile completion
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

  // Fetch saved opportunities
  useEffect(() => {
    if (profileCompletion < 20) {
      setIsLoading(false);
      return;
    }

    async function fetchSavedOpportunities() {
      try {
        const apiUrl = API_URL;
        const json = await cachedFetch<any>(`${apiUrl}/api/opportunities/saved`, {
          credentials: "include",
          ttl: 60_000,
        });
        
        setOpportunities(json.data || []);
        
        if (json.data) {
          const saved = new Set<string>();
          const pursuing = new Set<string>();
          json.data.forEach((opp: any) => {
            saved.add(opp.id); // If it's returned here, it is saved/pursuing
            if (opp.userStatus === "pursuing") {
              pursuing.add(opp.id);
            }
          });
          setSavedIds(saved);
          setPursuingIds(pursuing);
        }
      } catch (err) {
        console.error("Failed to fetch saved opportunities:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSavedOpportunities();
  }, [profileCompletion]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    opportunities.forEach((opp) => {
      // only count if actually still saved in local state
      if (savedIds.has(opp.id)) types.add(opp.type);
    });
    return ["All", ...Array.from(types)] as string[];
  }, [opportunities, savedIds]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Must be currently saved locally (to handle optimistic un-saves hiding it immediately)
      if (!savedIds.has(opp.id)) return false;

      if (activeType !== "All" && opp.type !== activeType) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(query);
        const matchesOrg = opp.organizationName?.toLowerCase().includes(query);
        const matchesDesc = opp.description?.toLowerCase().includes(query);
        const matchesSkills = opp.skills?.some((s: string) =>
          s.toLowerCase().includes(query)
        );
        const matchesType = opp.type?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesOrg && !matchesDesc && !matchesSkills && !matchesType) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, searchQuery, activeType, savedIds]);

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
      const apiUrl = API_URL;
      const method = isCurrentlySaved ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/api/opportunities/${id}/save`, {
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
        cachedFetch.invalidate(`${apiUrl}/api/opportunities/home`);
        cachedFetch.invalidate(`${apiUrl}/api/opportunities/saved`);
        cachedFetch.invalidatePrefix(`${apiUrl}/api/opportunities?`);
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

  const togglePursue = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isCurrentlyPursuing = pursuingIds.has(id);
    
    setPursuingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const apiUrl = API_URL;
      const method = isCurrentlyPursuing ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/api/opportunities/${id}/pursue`, {
        method,
        credentials: "include",
      });
      
      if (!res.ok) {
        setPursuingIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyPursuing) next.add(id);
          else next.delete(id);
          return next;
        });
      } else {
        cachedFetch.invalidate(`${apiUrl}/api/opportunities/home`);
        cachedFetch.invalidate(`${apiUrl}/api/opportunities/saved`);
        cachedFetch.invalidate(`${apiUrl}/api/opportunities/pursuing`);
        cachedFetch.invalidatePrefix(`${apiUrl}/api/opportunities?`);
      }
    } catch (err) {
      setPursuingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyPursuing) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  if (profileCompletion < 20) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-medium text-foreground">Saved</h1>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-medium text-foreground">Saved</h1>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search saved opportunities..."
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

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeType === type
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </>
        ) : filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => (
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
              isPursuing={pursuingIds.has(opp.id)}
              onPursueToggle={togglePursue}
              chatHref={`/saved/${opp.id}/chat`}
            />
          ))
        ) : (
          <div className="border border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
            <Bookmark size={32} className="text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">
                No saved opportunities found
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery || activeType !== "All"
                  ? "Try adjusting your search or filters to see more results."
                  : "Opportunities you save will appear here. Start exploring your recommendations!"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}