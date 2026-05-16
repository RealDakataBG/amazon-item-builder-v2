export default function LandingScreen({ onNewConcept, onCreateVariants }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Listing Builder</span>
        </div>

        <button
          onClick={onNewConcept}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg transition-colors"
        >
          New Concept
        </button>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCreateVariants}
            className="flex-1 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
          >
            Create Variants
          </button>
          <button
            disabled
            className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-300 font-medium text-sm cursor-not-allowed"
          >
            Create Shotlist
          </button>
        </div>
      </div>
    </div>
  )
}
