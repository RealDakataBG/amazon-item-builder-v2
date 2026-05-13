import { useState } from 'react'
import { callClaude } from '../utils/claude'
import { EDIT_SYSTEM_PROMPT } from '../constants'
import CopyButton from './CopyButton'

export default function SideBySideField({ label, labelSuffix, leftValue, onLeftChange, leftMinHeight = 'min-h-32' }) {
  const [rightValue, setRightValue]       = useState('')
  const [aiLoading, setAiLoading]         = useState(false)
  const [pendingOutput, setPendingOutput] = useState(null)
  const [oldOutput, setOldOutput]         = useState('')
  const [viewingNew, setViewingNew]       = useState(true)

  const handleUseAI = async () => {
    if (!rightValue.trim() || aiLoading || pendingOutput !== null) return
    setAiLoading(true)
    try {
      const result = await callClaude(
        EDIT_SYSTEM_PROMPT,
        `Original text:\n${leftValue}\n\nChange request:\n${rightValue}`
      )
      setOldOutput(leftValue)
      setPendingOutput(result)
      setViewingNew(true)
    } catch {
      // keep existing values on error
    } finally {
      setAiLoading(false)
    }
  }

  const handleCommit = () => {
    onLeftChange(pendingOutput)
    setPendingOutput(null)
    setOldOutput('')
    setViewingNew(true)
    setRightValue('')
  }

  const handleDiscard = () => {
    setPendingOutput(null)
    setOldOutput('')
    setViewingNew(true)
  }

  const displayValue = pendingOutput !== null
    ? (viewingNew ? pendingOutput : oldOutput)
    : leftValue

  const handleTextareaChange = e => {
    if (pendingOutput !== null) {
      if (viewingNew) setPendingOutput(e.target.value)
    } else {
      onLeftChange(e.target.value)
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

        {/* Old / New nav + Commit / Discard — only when pending */}
        {pendingOutput !== null && (
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-xs font-medium">
              <button
                onClick={() => setViewingNew(false)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  !viewingNew ? 'text-gray-700 font-semibold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ← Old
              </button>
              <span className="text-gray-200">|</span>
              <button
                onClick={() => setViewingNew(true)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewingNew ? 'text-gray-700 font-semibold' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                New →
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDiscard}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleCommit}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              >
                Commit
              </button>
            </div>
          </div>
        )}

        <textarea
          value={displayValue}
          onChange={handleTextareaChange}
          readOnly={pendingOutput !== null && !viewingNew}
          className={`input-base text-sm leading-relaxed resize-y w-full ${leftMinHeight} ${
            pendingOutput !== null && !viewingNew ? 'opacity-60 bg-gray-50' : ''
          }`}
          spellCheck={false}
        />
      </div>

      {/* Right — Use AI */}
      <div className="w-56 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-300 font-medium">Edit request</span>
          <button
            onClick={handleUseAI}
            disabled={aiLoading || !rightValue.trim() || pendingOutput !== null}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
              aiLoading
                ? 'bg-purple-100 text-purple-400 cursor-wait'
                : !rightValue.trim() || pendingOutput !== null
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
        {rightValue && !aiLoading && pendingOutput === null && (
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
