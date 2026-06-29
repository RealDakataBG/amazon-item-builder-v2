export default function RegenerateControls({ regenStatus, onRegenerate, history, onNavigate, onCommit }) {
  const showHistory = !!history && history.items.length > 1

  return (
    <div className="flex items-center gap-2 mb-6">
      <button
        onClick={onRegenerate}
        disabled={regenStatus === 'loading'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
      >
        {regenStatus === 'loading' ? (
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {regenStatus === 'loading' ? 'Regenerating…' : 'Regenerate'}
      </button>

      {showHistory && (
        <>
          <button
            onClick={() => onNavigate(-1)}
            disabled={history.index === 0}
            title="Previous generation"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate(1)}
            disabled={history.index === history.items.length - 1}
            title="Next generation"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <button
            onClick={onCommit}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            Commit
          </button>
        </>
      )}
    </div>
  )
}
