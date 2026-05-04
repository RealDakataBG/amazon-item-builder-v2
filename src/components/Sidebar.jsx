import { SECTIONS } from '../constants'

export default function Sidebar({ clientName, productName, activeSection, onSectionChange, onNewConcept, onCreateConcept, generationDone, sections, conceptStatus }) {
  return (
    <div className="h-full flex flex-col p-4 select-none">
      {/* App branding */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Listing Builder</span>
        </div>
      </div>

      {/* Client & product info */}
      {clientName && (
        <div className="mb-4">
          <p className="label-muted mb-1">Client</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{clientName}</p>
        </div>
      )}
      {productName && (
        <div className="mb-4">
          <p className="label-muted mb-1">Product</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{productName}</p>
        </div>
      )}

      {(clientName || productName) && (
        <div className="border-t border-gray-200 my-2" />
      )}

      {/* Section navigation */}
      <nav className="flex-1 space-y-0.5 mt-2">
        {SECTIONS.map(section => {
          const isDone = generationDone && sections?.[section.id]?.output
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              onClick={() => generationDone && onSectionChange(section.id)}
              disabled={!generationDone}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 ${
                !generationDone
                  ? 'text-gray-300 cursor-not-allowed'
                  : isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{section.label}</span>
              {isDone && (
                <svg className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </nav>

      {/* Create Concept + New Concept buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        {generationDone && (
          <button
            onClick={onCreateConcept}
            disabled={conceptStatus === 'loading' || conceptStatus === 'done'}
            className={`w-full justify-center flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              conceptStatus === 'done'
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : conceptStatus === 'error'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : conceptStatus === 'loading'
                ? 'bg-emerald-500 text-white cursor-wait opacity-80'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {conceptStatus === 'loading' && (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {conceptStatus === 'done' ? 'Concept Created' : conceptStatus === 'error' ? 'Retry' : 'Create Concept'}
          </button>
        )}
        <button onClick={onNewConcept} className="btn-outline w-full justify-center">
          New Concept
        </button>
      </div>
    </div>
  )
}
