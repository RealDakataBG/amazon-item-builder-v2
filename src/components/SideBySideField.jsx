import { useState } from 'react'
import { callClaude } from '../utils/claude'
import { EDIT_SYSTEM_PROMPT } from '../constants'
import CopyButton from './CopyButton'

export default function SideBySideField({ label, labelSuffix, leftValue, onLeftChange, leftMinHeight = 'min-h-32' }) {
  const [rightValue, setRightValue] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const handleUseAI = async () => {
    if (!rightValue.trim() || aiLoading) return
    setAiLoading(true)
    try {
      const result = await callClaude(
        EDIT_SYSTEM_PROMPT,
        `Original text:\n${leftValue}\n\nChange request:\n${rightValue}`
      )
      setRightValue(result)
    } catch {
      // keep existing value on error
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex gap-4">
      {/* Left — output */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="label-muted">{label}</span>
            {labelSuffix}
          </div>
          <CopyButton text={leftValue} />
        </div>
        <textarea
          value={leftValue}
          onChange={e => onLeftChange(e.target.value)}
          className={`input-base text-sm leading-relaxed resize-y w-full ${leftMinHeight}`}
          spellCheck={false}
        />
      </div>

      {/* Right — Use AI */}
      <div className="w-56 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-300 font-medium">Edit request</span>
          <button
            onClick={handleUseAI}
            disabled={aiLoading || !rightValue.trim()}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
              aiLoading
                ? 'bg-purple-100 text-purple-400 cursor-wait'
                : !rightValue.trim()
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
          >
            {aiLoading && (
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Use AI
          </button>
        </div>
        <textarea
          value={rightValue}
          onChange={e => setRightValue(e.target.value)}
          className="input-base text-sm leading-relaxed resize-y min-h-20 w-full"
          placeholder="Describe what you want changed…"
          spellCheck={false}
        />
        {rightValue && !aiLoading && (
          <button
            onClick={() => { onLeftChange(rightValue); setRightValue('') }}
            className="mt-1.5 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
          >
            ✓ Accept
          </button>
        )}
      </div>
    </div>
  )
}
