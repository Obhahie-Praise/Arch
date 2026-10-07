import React from "react";

export function MetricCardSkeleton() {
  return (
    <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl flex flex-col justify-between gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-muted/60 rounded"></div>
        <div className="p-2 bg-muted/60 rounded-full w-8 h-8"></div>
      </div>
      <div>
        <div className="h-8 w-16 bg-muted/60 rounded"></div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="border border-border/50 rounded-4xl p-6 bg-card/30 backdrop-blur-2xl flex flex-col justify-between gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted/60 rounded"></div>
          <div className="h-3 w-48 bg-muted/60 rounded"></div>
        </div>
        <div className="p-2 bg-muted/60 rounded-full w-8 h-8"></div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {[40, 70, 30, 90, 50, 80, 60].map((height, i) => (
          <div
            key={i}
            className="w-full bg-muted/60 rounded-t-sm"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="border border-border/50 rounded-4xl p-5 bg-card/30 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-5 bg-muted/60 rounded w-48"></div>
          <div className="h-5 bg-muted/60 rounded-full w-16"></div>
          <div className="h-5 bg-muted/60 rounded-full w-24"></div>
        </div>

        <div className="flex items-center gap-3 flex-wrap py-1">
          <div className="h-4 bg-muted/60 rounded w-32"></div>
          <div className="h-4 bg-muted/60 rounded w-24"></div>
          <div className="h-4 bg-muted/60 rounded w-20"></div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <div className="h-4 bg-muted/40 rounded-md w-16"></div>
          <div className="h-4 bg-muted/40 rounded-md w-20"></div>
          <div className="h-4 bg-muted/40 rounded-md w-14"></div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
        <div className="h-8 w-20 bg-muted/60 rounded-full"></div>
        <div className="h-8 w-8 bg-muted/60 rounded-full"></div>
      </div>
    </div>
  );
}

export function SavedItemSkeleton() {
  return (
    <div className="border border-border/50 rounded-4xl p-4 bg-card/30 backdrop-blur-2xl flex items-center justify-between gap-3 animate-pulse">
      <div className="space-y-1.5 flex-1">
        <div className="h-4 w-40 bg-muted/60 rounded"></div>
        <div className="h-3 w-56 bg-muted/60 rounded"></div>
      </div>
      <div className="h-6 w-16 bg-muted/60 rounded-full shrink-0"></div>
    </div>
  );
}

export function TimelineItemSkeleton() {
  return (
    <div className="relative pl-6 animate-pulse">
      <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-muted/60" />
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted/60 rounded"></div>
        <div className="h-4 w-48 bg-muted/60 rounded"></div>
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-muted/60 rounded"></div>
          <div className="h-3 w-20 bg-muted/60 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 w-20 bg-muted/60 rounded-full"></div>
        <div className="h-10 w-64 sm:w-96 bg-muted/60 rounded"></div>
        <div className="flex items-center gap-4">
          <div className="h-5 w-32 bg-muted/60 rounded"></div>
          <div className="h-5 w-24 bg-muted/60 rounded"></div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="h-11 w-11 bg-muted/60 rounded-full"></div>
        <div className="h-11 w-32 bg-muted/60 rounded-full"></div>
      </div>
    </div>
  );
}

export function DetailMetadataSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2 animate-pulse">
      <div className="h-10 w-40 bg-muted/60 rounded-full"></div>
      <div className="h-10 w-36 bg-muted/60 rounded-full"></div>
    </div>
  );
}

export function DetailMatchSkeleton() {
  return (
    <div className="p-6 bg-card/30 backdrop-blur-2xl border border-border/50 rounded-4xl space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-muted/60 rounded"></div>
      <div className="space-y-3">
        <div className="h-4 w-full sm:w-3/4 bg-muted/60 rounded"></div>
        <div className="h-4 w-full sm:w-2/3 bg-muted/60 rounded"></div>
      </div>
    </div>
  );
}

export function DetailContentSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 animate-pulse">
      {/* Left Column - Description */}
      <div className="md:col-span-2 space-y-8">
        <section className="space-y-4">
          <div className="h-6 w-48 bg-muted/60 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/60 rounded"></div>
            <div className="h-4 w-full bg-muted/60 rounded"></div>
            <div className="h-4 w-11/12 bg-muted/60 rounded"></div>
            <div className="h-4 w-full bg-muted/60 rounded"></div>
            <div className="h-4 w-3/4 bg-muted/60 rounded"></div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="h-6 w-32 bg-muted/60 rounded"></div>
          <div className="h-24 w-full bg-muted/60 rounded-2xl"></div>
        </section>
      </div>

      {/* Right Column - Meta */}
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="h-5 w-32 bg-muted/60 rounded"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-16 bg-muted/60 rounded-lg"></div>
            <div className="h-6 w-20 bg-muted/60 rounded-lg"></div>
            <div className="h-6 w-14 bg-muted/60 rounded-lg"></div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="h-5 w-24 bg-muted/60 rounded"></div>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted/60 rounded"></div>
            <div className="h-4 w-full bg-muted/60 rounded"></div>
          </div>
        </section>

        <div className="h-32 w-full bg-muted/60 rounded-2xl mt-8"></div>
      </div>
    </div>
  );
}

export function OpportunityDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-4">
      {/* Back button */}
      <div className="h-5 w-24 bg-muted/60 rounded animate-pulse"></div>

      <div className="space-y-6">
        <DetailHeaderSkeleton />
        <DetailMetadataSkeleton />
      </div>

      <DetailMatchSkeleton />
      <DetailContentSkeleton />
    </div>
  );
}
