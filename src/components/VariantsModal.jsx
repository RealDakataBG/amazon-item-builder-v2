import { useState } from 'react'

export default function VariantsModal({ variants, status, steps, variantResults = [], onClose, onGenerate }) {
  const [selected, setSelected] = useState(new Set())

  const toggle = num => setSelected(prev => {
    const next = new Set(prev)
    next.has(num) ? next.delete(num) : next.add(num)
    return next
  })

  const isRunning    = status === 'generating'
  const isDone       = status === 'done'
  const isError      = status === 'error'
  const showProgress = isRunning || isDone || isError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {showProgress ? 'Generating Variants' : 'Select Variants to Generate'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
            title="Minimize"
          >
            −
          </button>
        </div>

        {/* Body */}
        {showProgress ? (
          <div className="flex-1 overflow-y-auto p-6">

            {/* Loading — simple spinner + current step */}
            {isRunning && (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <svg className="animate-spin w-9 h-9 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  {steps.find(s => s.status === 'running')?.label ?? 'Processing…'}
                </p>
              </div>
            )}

            {/* Done — results */}
            {isDone && variantResults.length > 0 && (
              <div className="space-y-3">

                {/* Drive Folder — shared card */}
                {variantResults[0]?.driveUrl && (
                  <a
                    href={variantResults[0].driveUrl}
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

                {/* Per-variant Sheet rows */}
                <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {variantResults.map(r => (
                    <div key={r.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{r.label}</span>
                        <span className="text-sm text-gray-400">Variant {r.label}</span>
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
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </div>
                  ))}
                </div>

              </div>
            )}

            {isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-medium text-red-700">Generation failed</p>
                {steps.find(s => s.status === 'error')?.message && (
                  <p className="text-xs text-red-600 mt-1">{steps.find(s => s.status === 'error').message}</p>
                )}
              </div>
            )}

            {(isDone || isError) && (
              <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3 w-10 text-left"></th>
                  <th className="px-2 py-3 w-12 text-left">#</th>
                  <th className="px-2 py-3 text-left">Name</th>
                  <th className="px-2 py-3 pr-6 text-left">Specification</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => {
                  const isChecked = selected.has(v.number)
                  return (
                    <tr
                      key={v.number}
                      onClick={() => toggle(v.number)}
                      className={`cursor-pointer border-b border-gray-50 transition-colors ${isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(v.number)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-3 text-gray-400 font-mono text-xs">{v.number}</td>
                      <td className="px-2 py-3 font-medium text-gray-800">{v.name}</td>
                      <td className="px-2 py-3 pr-6 text-gray-500">{v.spec}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — only in picker view */}
        {!showProgress && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {selected.size === 0 ? 'No variants selected' : `${selected.size} variant${selected.size > 1 ? 's' : ''} selected`}
            </span>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="btn-outline px-4 py-1.5">Cancel</button>
              <button
                onClick={() => onGenerate(variants.filter(v => selected.has(v.number)))}
                disabled={selected.size === 0}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
