import React from "react";
import Link from "next/link";
import { Sparkles, MapPin, Clock, Bookmark } from "lucide-react";

export interface OpportunityCardProps {
  id: string;
  title: string;
  organization: string;
  type: string;
  matchScore?: number;
  location?: string;
  deadline?: string;
  tags: string[];
  isSaved?: boolean;
  onSaveToggle?: (id: string, e: React.MouseEvent) => void;
  saveHref?: string;
  isPursuing?: boolean;
  onPursueToggle?: (id: string, e: React.MouseEvent) => void;
}

export function OpportunityCard({
  id,
  title,
  organization,
  type,
  matchScore,
  location,
  deadline,
  tags,
  isSaved,
  onSaveToggle,
  saveHref,
  isPursuing,
  onPursueToggle,
}: OpportunityCardProps) {
  return (
    <div className="border border-border rounded-3xl p-5 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-foreground/40">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-base font-medium text-foreground">
            {title}
          </h3>
          <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full text-foreground font-medium">
            {type}
          </span>
          {matchScore && (
            <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Sparkles size={11} /> {matchScore}% Match
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
          <span className="font-medium text-foreground">{organization}</span>
          {location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {location}
            </span>
          )}
          {deadline && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {deadline}
            </span>
          )}
        </p>

        {tags && tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
        <Link
          href={`/opportunities/${id}`}
          className="px-4 py-2 border border-border rounded-full text-xs font-medium hover:bg-muted transition-colors"
        >
          Details
        </Link>

        {onSaveToggle ? (
          <button
            onClick={(e) => onSaveToggle(id, e)}
            className={`p-2 rounded-full text-xs font-medium transition-colors ${
              isSaved
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-foreground hover:text-background"
            }`}
          >
            <Bookmark
              size={16}
              strokeWidth={1.5}
              className={isSaved ? "fill-current" : ""}
            />
          </button>
        ) : saveHref ? (
          <Link
            href={saveHref}
            className="p-2 bg-foreground text-background rounded-full text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            <Bookmark size={16} strokeWidth={1.5} />
          </Link>
        ) : null}

        {onPursueToggle && (
          <button
            onClick={(e) => onPursueToggle(id, e)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              isPursuing
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-foreground hover:text-background"
            }`}
          >
            {isPursuing ? "Pursuing" : "Mark as Pursuing"}
          </button>
        )}
      </div>
    </div>
  );
}
