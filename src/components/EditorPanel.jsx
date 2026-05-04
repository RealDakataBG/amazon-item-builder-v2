import { useState } from 'react'
import { SECTIONS } from '../constants'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-500">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export default function EditorPanel({ section, inputText, outputText, onInputChange, onOutputChange }) {
  const sectionLabel = SECTIONS.find(s => s.id === section)?.label ?? section

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{sectionLabel}</h1>

      {/* Input */}
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

      {/* Output */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label-muted">Output (Claude)</span>
          <CopyButton text={outputText} />
        </div>
        <textarea
          value={outputText}
          onChange={e => onOutputChange(e.target.value)}
          className="input-base text-sm leading-relaxed resize-y min-h-48"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
