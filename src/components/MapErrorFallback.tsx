'use client'

// A plain onClick handler can't be passed as a prop from the server-rendered
// city page into <ErrorBoundary fallback={...}> - functions crossing a
// Server->Client Component boundary aren't serializable unless they're
// Server Actions. Wrapping the interactive bit in its own real Client
// Component sidesteps that: the server only ever passes a component
// reference (<MapErrorFallback />), never a raw function.
export default function MapErrorFallback() {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Map failed to load</h3>
      <p className="text-red-700 dark:text-red-300 mb-4">
        The map didn't load. Shop listings above aren't affected.
      </p>
      <button onClick={() => window.location.reload()} className="btn-secondary">
        Try again
      </button>
    </div>
  )
}
