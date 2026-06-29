import { SECTIONS } from '../constants'
import CopyButton from './CopyButton'
import SideBySideField from './SideBySideField'
import RegenerateControls from './RegenerateControls'

export default function EditorPanel({ section, inputText, outputText, onInputChange, onOutputChange, regenStatus, onRegenerate, history, onHistoryNav, onCommit, onUseAI }) {
  const sectionLabel = SECTIONS.find(s => s.id === section)?.label ?? section
  const isUncommitted = !!history && history.items.length > 1

  const byteCount = new TextEncoder().encode(outputText).length
  const keywordsSuffix = section === 'keywords' ? (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
      byteCount > 250
        ? 'bg-amber-50 text-amber-600'
        : 'bg-emerald-50 text-emerald-600'
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

      {/* Regenerate button + history navigation */}
      <RegenerateControls
        regenStatus={regenStatus}
        onRegenerate={onRegenerate}
        history={history}
        onNavigate={onHistoryNav}
        onCommit={onCommit}
      />

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
        disabled={isUncommitted}
        onUseAI={onUseAI}
      />
    </div>
  )
}
