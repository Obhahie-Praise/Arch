import React from 'react'

const OpportuntiesPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner & Subtle Local Storage Status */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-medium text-foreground">
            Opportunities
          </h1>
          <p className="text-muted-foreground text-sm">
            Discover jobs, grants, hackathons, fellowships, and more, matched to what you’re looking for.
          </p>
        </div>
      </div>
    </div>
  )
}

export default OpportuntiesPage