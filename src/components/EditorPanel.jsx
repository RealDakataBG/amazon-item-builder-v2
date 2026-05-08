import { SECTIONS } from '../constants'
import CopyButton from './CopyButton'
import SideBySideField from './SideBySideField'

export default function EditorPanel({ section, inputText, outputText, onInputChange, onOutputChange, regenStatus, onRegenerate }) {
  const sectionLabel = SECTIONS.find(s => s.id === section)?.label ?? section

  const byteCount = new TextEncoder().encode(outputText).length
  const keywordsSuffix = section === 'keywords' ? (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
      byteCount >= 200 && byteCount <= 250
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-amber-50 text-amber-600'
    }`}>
      {byteCount} / 250 B
    </span>
  ) : null

  return (
    <div className="relative h-full flex flex-col p-8 max-w-5xl">
      {/* Shimmer overlay while regenerating */}
      {regenStatus === 'loading' && (
        <div className="absolute inset-0 z-10 bg-white/70 animate-pulse rounded-xl pointer-events-auto" />
      )}

      <h1 className="text-xl font-semibold text-gray-900 mb-4">{sectionLabel}</h1>

      {/* Regenerate button */}
      <div className="mb-6">
        <button
          onClick={onRegenerate}
          disabled={regenStatus === 'loading'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
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
      </div>

      {/* Input — single column */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-muted">Input (Prompt)</span>
          <CopyButton text={inputText} />
        </div>
        <textarea
          value={inputText}
          onChange={e => onInputChange(e.target.value)}
          className="input-base font-mono text-xs leading-relaxed resize-y min-h-48"
          spellCheck={false}
        />
      </div>

      {/* Output — side-by-side */}
      <SideBySideField
        label="Output"
        labelSuffix={keywordsSuffix}
        leftValue={outputText}
        onLeftChange={onOutputChange}
        leftMinHeight="min-h-48"
      />
    </div>
  )
}
