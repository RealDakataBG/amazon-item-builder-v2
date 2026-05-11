import { useState } from 'react'

export default function VariantsModal({ variants, status, progress, onClose, onGenerate }) {
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
            disabled={isRunning}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {showProgress ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4">
            {isRunning && (
              <svg className="animate-spin w-9 h-9 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isDone && (
              <svg className="w-9 h-9 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isError && (
              <svg className="w-9 h-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
            <p className="text-sm text-gray-600 text-center max-w-xs">{progress}</p>
            {(isDone || isError) && (
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Close
              </button>
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
              <button
                onClick={onClose}
                className="btn-outline px-4 py-1.5"
              >
                Cancel
              </button>
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
