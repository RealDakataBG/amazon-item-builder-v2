export default function ConceptResultModal({ title, status, results, errorMsg, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <svg className="animate-spin w-9 h-9 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-400">Sending to Make.com…</p>
            </div>
          )}

          {status === 'done' && results.length > 0 && (
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 w-16 flex-shrink-0">{r.label}</span>
                  {r.driveUrl ? (
                    <a
                      href={r.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-400 hover:bg-amber-500 text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Drive Folder
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg text-sm text-gray-300 bg-gray-50">No Drive URL</span>
                  )}
                  {r.sheetUrl ? (
                    <a
                      href={r.sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Google Sheet
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg text-sm text-gray-300 bg-gray-50">No Sheet URL</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-700">Webhook failed</p>
              {errorMsg && <p className="text-xs text-red-600 mt-1">{errorMsg}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
