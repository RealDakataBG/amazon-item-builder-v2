export default function ProgressTracker({ steps, error, title = 'Generating your concept' }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">This takes 2–4 minutes. Please keep the window open.</p>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {step.status === 'pending' && (
                  <div className="w-3 h-3 rounded-full bg-gray-200 mt-0.5" />
                )}
                {step.status === 'running' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse mt-0.5" />
                )}
                {step.status === 'done' && (
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-0.5" />
                )}
                {step.status === 'error' && (
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.status === 'done'    ? 'text-gray-400 line-through' :
                  step.status === 'running' ? 'text-gray-900' :
                  step.status === 'error'   ? 'text-red-600' :
                  'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {step.message && step.status !== 'done' && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{step.message}</p>
                )}
              </div>
              {step.status === 'running' && (
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
