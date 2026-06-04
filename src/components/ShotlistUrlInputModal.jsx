export default function ShotlistUrlInputModal({
  rows, onRowsChange,
  onGenerate, status, results, progress, error,
  onClose,
}) {
  const addRow    = () => onRowsChange([...rows, { url: '', isBase: false }])
  const removeRow = i  => onRowsChange(rows.filter((_, idx) => idx !== i))
  const setUrl    = (i, val) => onRowsChange(rows.map((r, idx) => idx === i ? { ...r, url: val } : r))
  const setBase   = (i, val) => onRowsChange(rows.map((r, idx) => idx === i ? { ...r, isBase: val } : r))

  const canGenerate = rows.every(r => r.url.trim())
  const isSending   = status === 'sending'
  const isDone      = status === 'done'
  const isError     = status === 'error'
  const showProgress = isSending || isDone || isError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[560px] max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {showProgress ? 'Creating Shotlist' : 'Paste Visuals Sheet URLs'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            −
          </button>
        </div>

        {/* Input view */}
        {!showProgress && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 w-5 flex-shrink-0 text-right">{i + 1}</span>
                <input
                  type="url"
                  value={row.url}
                  onChange={e => setUrl(i, e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="input-base flex-1 text-sm"
                />
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={row.isBase}
                    onChange={e => setBase(i, e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                  Base
                </label>
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0 text-base leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <button
                onClick={addRow}
                className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
              >
                + Add row
              </button>
            </div>
          </div>
        )}

        {/* Sending view */}
        {isSending && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-4">
            <svg className="animate-spin w-9 h-9 text-violet-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Processing {progress + 1} of {rows.length}…
            </span>
          </div>
        )}

        {/* Done view */}
        {isDone && results.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {results[0]?.driveUrl && (
              <a
                href={results[0].driveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-amber-800 flex-1">Drive Folder</span>
                <svg className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-400">{r.isBase ? 'Base' : 'Variant'}</span>
                  </div>
                  {r.sheetUrl ? (
                    <a
                      href={r.sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Google Sheet
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error view */}
        {isError && (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-700">Failed to send shotlist</p>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {status === 'idle' && (
            <>
              <button onClick={onClose} className="btn-outline px-4 py-1.5">Cancel</button>
              <button
                onClick={onGenerate}
                disabled={!canGenerate}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Generate
              </button>
            </>
          )}
          {(isDone || isError) && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
