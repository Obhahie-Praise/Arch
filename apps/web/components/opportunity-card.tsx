import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, MapPin, Clock, Bookmark, MessageSquare, MoreHorizontal, Check } from "lucide-react";
import { formatDeadline } from "../lib/date";

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
  chatHref?: string;
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
  chatHref,
}: OpportunityCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const hasMenuActions = Boolean(onSaveToggle || saveHref || chatHref || onPursueToggle);

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
              <Clock size={12} /> {formatDeadline(deadline) ?? deadline}
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

      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 relative" ref={menuRef}>
        <Link
          href={`/opportunities/${id}`}
          className="px-4 py-2 border border-border rounded-full text-xs font-medium hover:bg-muted transition-colors"
        >
          Details
        </Link>

        {hasMenuActions && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-full transition-colors ${
              isMenuOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MoreHorizontal size={18} />
          </button>
        )}

        {isMenuOpen && hasMenuActions && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-lg shadow-black/5 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right duration-150">
            <div className="p-1.5 flex flex-col gap-0.5">
              
              {onSaveToggle ? (
                <button
                  onClick={(e) => {
                    onSaveToggle(id, e);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <Bookmark size={15} className={isSaved ? "fill-foreground text-foreground" : "text-muted-foreground"} />
                  <span>{isSaved ? "Unsave" : "Save"}</span>
                </button>
              ) : saveHref ? (
                <Link
                  href={saveHref}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <Bookmark size={15} className="text-muted-foreground" />
                  <span>Save</span>
                </Link>
              ) : null}

              {chatHref && (
                <Link
                  href={chatHref}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <MessageSquare size={15} className="text-muted-foreground" />
                  <span>Chat</span>
                </Link>
              )}

              {onPursueToggle && (
                <button
                  onClick={(e) => {
                    onPursueToggle(id, e);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted rounded-xl transition-colors text-left ${
                    isPursuing ? "text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 hover:bg-emerald-500/20" : "text-foreground"
                  }`}
                >
                  <Check size={15} strokeWidth={isPursuing ? 2.5 : 1.5} className={isPursuing ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"} />
                  <span>{isPursuing ? "Pursuing" : "Mark as pursuing"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
