"use client";
import { API_URL } from "../../../../lib/api";
import { formatDeadline } from "../../../../lib/date";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
  AlertCircle,
  Building2,
  Calendar,
  Target,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import {
  DetailMetadataSkeleton,
  DetailMatchSkeleton,
  DetailContentSkeleton,
  OpportunityDetailSkeleton,
} from "../../../../components/skeletons";

interface OpportunityDetail {
  id: string;
  title: string;
  slug: string;
  organizationName: string;
  organizationUrl?: string | null;
  type: string;
  description?: string | null;
  applicationUrl?: string | null;
  sourceUrl: string;
  location?: string | null;
  isRemote: boolean;
  deadline?: string | null;
  eligibility: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  compensation?: Record<string, unknown> | null;
  fundingAmount?: Record<string, unknown> | null;
  matchScore?: number | null;
  matchReasons?: string[] | null;
  potentialMismatches?: string[] | null;
  userStatus?: string | null;
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const detailId = params.detail as string;

  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [loadingIdentity, setLoadingIdentity] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [loadingDescription, setLoadingDescription] = useState(true);

  useEffect(() => {
    setLoadingIdentity(true);
    setLoadingMetadata(true);
    setLoadingMatch(true);
    setLoadingDescription(true);
    setOpportunity(null);
    setNotFound(false);

    async function fetchDetail() {
      try {
        const apiUrl = API_URL;
        const res = await fetch(`${apiUrl}/api/opportunities/${detailId}`, {
          credentials: "include",
        });

        if (res.status === 404) {
          setNotFound(true);
          return;
        }

        if (!res.ok) {
          setNotFound(true);
          return;
        }

        const json = await res.json();
        const opp: OpportunityDetail = json.data;
        setOpportunity(opp);

        // Seed save status
        if (opp.userStatus === "saved" || opp.userStatus === "pursuing") {
          setIsSaved(true);
        }
      } catch {
        setNotFound(true);
      }
    }

    fetchDetail();

    // Progressive reveal — independent of data fetch completion
    const t1 = setTimeout(() => setLoadingIdentity(false), 200);
    const t2 = setTimeout(() => setLoadingMetadata(false), 400);
    const t3 = setTimeout(() => setLoadingMatch(false), 600);
    const t4 = setTimeout(() => setLoadingDescription(false), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [detailId]);

  const toggleSave = async () => {
    const wasAlreadySaved = isSaved;

    // Optimistic update
    setIsSaved((prev) => !prev);

    try {
      const apiUrl = API_URL;
      const method = wasAlreadySaved ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/api/opportunities/${detailId}/save`, {
        method,
        credentials: "include",
      });

      if (!res.ok) {
        // Revert on failure
        setIsSaved(wasAlreadySaved);
      }
    } catch {
      // Revert on error
      setIsSaved(wasAlreadySaved);
    }
  };

  if (loadingIdentity) {
    return <OpportunityDetailSkeleton />;
  }

  if (notFound || !opportunity) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back to opportunities
        </Link>
        <div className="rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle size={24} className="text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Opportunity not found</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            This opportunity may have been removed or the link is invalid.
          </p>
          <Link
            href="/opportunities"
            className="mt-4 px-6 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            View all opportunities
          </Link>
        </div>
      </div>
    );
  }

  // Derive a human-readable funding amount string if present
  const fundingDisplay =
    opportunity.fundingAmount && typeof opportunity.fundingAmount === "object"
      ? (opportunity.fundingAmount as { amount?: string; formatted?: string })?.formatted ||
        (opportunity.fundingAmount as { amount?: string })?.amount ||
        null
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Navigation */}
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-xs font-medium text-foreground">
              {opportunity.type}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-medium text-foreground leading-tight">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Building2 size={16} /> {opportunity.organizationName}
              </span>
              {opportunity.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} /> {opportunity.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleSave}
              className={`p-3 rounded-full transition-colors flex items-center justify-center ${
                isSaved
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-foreground hover:text-background"
              }`}
              aria-label={isSaved ? "Unsave opportunity" : "Save opportunity"}
            >
              <Bookmark
                size={20}
                strokeWidth={1.5}
                className={isSaved ? "fill-current" : ""}
              />
            </button>
            <a
              href={opportunity.applicationUrl || opportunity.sourceUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2"
            >
              Apply now <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {loadingMetadata ? (
          <DetailMetadataSkeleton />
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {opportunity.deadline && (
              <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Deadline:</span>{" "}
                  <span className="font-medium text-foreground">{formatDeadline(opportunity.deadline) ?? opportunity.deadline}</span>
                </span>
              </div>
            )}
            {fundingDisplay && (
              <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full text-sm">
                <DollarSign size={16} className="text-muted-foreground" />
                <span>
                  <span className="text-muted-foreground">Funding:</span>{" "}
                  <span className="font-medium text-foreground">{fundingDisplay}</span>
                </span>
              </div>
            )}
            {opportunity.isRemote && (
              <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full text-sm">
                <MapPin size={16} className="text-muted-foreground" />
                <span className="font-medium text-foreground">Remote</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Why it matches */}
      {loadingMatch ? (
        <DetailMatchSkeleton />
      ) : opportunity.matchScore ? (
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
            <Sparkles size={18} />
            <span>{opportunity.matchScore}% Match for you</span>
          </div>
          {opportunity.matchReasons && opportunity.matchReasons.length > 0 && (
            <ul className="space-y-2">
              {opportunity.matchReasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 size={16} className="text-emerald-500/70 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Main Content Grid */}
      {loadingDescription ? (
        <DetailContentSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Left Column - Description */}
          <div className="md:col-span-2 space-y-8">
            {opportunity.description && (
              <section className="space-y-4">
                <h2 className="font-display text-xl font-medium text-foreground">
                  About this opportunity
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p>{opportunity.description}</p>
                </div>
              </section>
            )}

            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-display text-xl font-medium text-foreground">
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {opportunity.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={15} className="text-muted-foreground/60 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {opportunity.eligibility && opportunity.eligibility.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-display text-xl font-medium text-foreground">Eligibility</h2>
                <div className="p-5 bg-card border border-border rounded-2xl space-y-2">
                  {opportunity.eligibility.map((item, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Meta */}
          <div className="space-y-6">
            {opportunity.skills && opportunity.skills.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-display text-base font-medium text-foreground flex items-center gap-2">
                  <Target size={16} /> Skills &amp; Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-muted rounded-lg text-xs text-muted-foreground font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="font-display text-base font-medium text-foreground flex items-center gap-2">
                <Calendar size={16} /> Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium text-foreground">
                    {opportunity.deadline ? (formatDeadline(opportunity.deadline) ?? opportunity.deadline) : "Ongoing"}
                  </span>
                </div>
              </div>
            </section>

            {/* Application Box */}
            <div className="p-5 bg-card border border-border rounded-2xl space-y-4 mt-8">
              <h3 className="font-medium text-foreground">Ready to apply?</h3>
              <p className="text-xs text-muted-foreground">
                Make sure to read all eligibility requirements before submitting your application.
              </p>
              <a
                href={opportunity.applicationUrl || opportunity.sourceUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                Apply on website <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
