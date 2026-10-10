"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  /**
   * Controls how the card's action control is rendered.
   *
   * - `"bookmark"` — A single bookmark icon button that directly saves/unsaves
   *   the opportunity. Used on Home (Recent Matches) and Opportunities.
   * - `"menu"` — The existing three-dot dropdown with Save, Chat, and Pursuing
   *   actions. Used on the Saved page. This is the default to preserve backward
   *   compatibility.
   */
  actionMode?: "bookmark" | "menu";
}

interface DropdownPortalProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Renders the dropdown menu directly on document.body via a portal so it
 * escapes every stacking context in the component tree (overflow-y-auto on
 * <main>, backdrop-filter on cards, etc.).  Position is calculated from the
 * trigger button's bounding rect on every open and on scroll/resize.
 */
function DropdownPortal({ anchorRef, isOpen, onClose, children }: DropdownPortalProps) {
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [anchorRef]);

  // Reposition whenever the menu opens
  useEffect(() => {
    if (isOpen) reposition();
  }, [isOpen, reposition]);

  // Keep position accurate while the scroll container moves
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen, reposition]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (typeof window === "undefined" || !coords) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      role="menu"
      aria-hidden={!isOpen}
      style={{
        position: "fixed",
        top: coords.top,
        right: coords.right,
        zIndex: 9999,
        willChange: "transform, opacity",
      }}
      className={[
        "w-48",
        "bg-card/90 backdrop-blur-2xl border border-border rounded-2xl shadow-lg shadow-black/10 overflow-hidden",
        "transition-all duration-150 ease-out origin-top-right",
        isOpen
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
      ].join(" ")}
    >
      {children}
    </div>,
    document.body,
  );
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
  actionMode = "menu",
}: OpportunityCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // In bookmark mode we show the bookmark icon directly; in menu mode we show
  // the three-dot dropdown. Only render any action controls when there is at
  // least one action available.
  const hasAnyAction = Boolean(onSaveToggle || saveHref || chatHref || onPursueToggle);
  const showBookmark = actionMode === "bookmark" && Boolean(onSaveToggle);
  const showMenu = actionMode === "menu" && hasAnyAction;

  return (
    <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200 hover:border-foreground/40">
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

      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
        <Link
          href={`/opportunities/${id}`}
          className="px-4 py-2 border border-border rounded-full text-xs font-medium hover:bg-muted transition-colors duration-150"
        >
          Details
        </Link>

        {/* ── Bookmark mode ─────────────────────────────────────────────── */}
        {showBookmark && (
          <button
            onClick={(e) => onSaveToggle!(id, e)}
            aria-label={isSaved ? "Remove from saved" : "Save opportunity"}
            aria-pressed={isSaved}
            className={`p-2 rounded-full transition-colors duration-150 ${
              isSaved
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Bookmark
              size={18}
              className={isSaved ? "fill-foreground" : ""}
            />
          </button>
        )}

        {/* ── Menu mode (three-dot dropdown) ────────────────────────────── */}
        {showMenu && (
          <button
            ref={triggerRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Open actions menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            className={`p-2 rounded-full transition-colors duration-150 ${
              isMenuOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MoreHorizontal size={18} />
          </button>
        )}

        {showMenu && (
          <DropdownPortal anchorRef={triggerRef} isOpen={isMenuOpen} onClose={closeMenu}>
            <div className="p-1.5 flex flex-col gap-0.5">
              {onSaveToggle ? (
                <button
                  role="menuitem"
                  onClick={(e) => {
                    onSaveToggle(id, e);
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors duration-100 text-left"
                >
                  <Bookmark
                    size={15}
                    className={isSaved ? "fill-foreground text-foreground" : "text-muted-foreground"}
                  />
                  <span>{isSaved ? "Unsave" : "Save"}</span>
                </button>
              ) : saveHref ? (
                <Link
                  role="menuitem"
                  href={saveHref}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors duration-100 text-left"
                >
                  <Bookmark size={15} className="text-muted-foreground" />
                  <span>Save</span>
                </Link>
              ) : null}

              {chatHref && (
                <Link
                  role="menuitem"
                  href={chatHref}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors duration-100 text-left"
                >
                  <MessageSquare size={15} className="text-muted-foreground" />
                  <span>Chat</span>
                </Link>
              )}

              {onPursueToggle && (
                <button
                  role="menuitem"
                  onClick={(e) => {
                    onPursueToggle(id, e);
                    closeMenu();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted rounded-xl transition-colors duration-100 text-left ${
                    isPursuing
                      ? "text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 hover:bg-emerald-500/20"
                      : "text-foreground"
                  }`}
                >
                  <Check
                    size={15}
                    strokeWidth={isPursuing ? 2.5 : 1.5}
                    className={isPursuing ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
                  />
                  <span>{isPursuing ? "Pursuing" : "Mark as pursuing"}</span>
                </button>
              )}
            </div>
          </DropdownPortal>
        )}
      </div>
    </div>
  );
}
