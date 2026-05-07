import { useState } from 'react'
import { LOCATION_OPTIONS } from '../constants'

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

const SELECT_CLASS = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer'

// onChange(subfield, value) — block name is already baked in by the caller
function ImageTypeSection({ label, block, onChange }) {
  const handleNeededChange = val => {
    onChange('needed', val)
    if (val === 'No') {
      onChange('description', 'No')
      onChange('person', 'No')
      onChange('location', 'No')
    }
  }

  return (
    <div className="mb-6">
      <span className="label-muted block mb-2">{label}</span>
      <textarea
        value={block.description}
        onChange={e => onChange('description', e.target.value)}
        className="input-base text-sm leading-relaxed resize-y min-h-20 mb-2"
        spellCheck={false}
        placeholder="No"
      />
      <div className="flex gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">Needed</span>
          <select
            value={block.needed}
            onChange={e => handleNeededChange(e.target.value)}
            className={SELECT_CLASS}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">Person</span>
          <select
            value={block.person}
            onChange={e => onChange('person', e.target.value)}
            className={SELECT_CLASS}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">Location</span>
          <select
            value={block.location}
            onChange={e => onChange('location', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="No">No</option>
            {LOCATION_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function ImageEditorPanel({ slotLabel, data, onChange }) {
  const { parsed, parseError, rawOutput, input } = data

  if (!parsed) {
    return (
      <div className="h-full flex flex-col p-8 max-w-4xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">{slotLabel}</h1>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-medium text-amber-700">Could not parse Claude's response</p>
          {parseError && <p className="text-xs text-amber-600 mt-1">{parseError}</p>}
          {rawOutput && <p className="text-xs text-gray-500 mt-2 font-mono whitespace-pre-wrap break-all">{rawOutput}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">{slotLabel}</h1>

      {/* Input prompt */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-muted">Input (Prompt)</span>
          <CopyButton text={input} />
        </div>
        <textarea
          value={input}
          onChange={e => onChange('input', null, e.target.value)}
          className="input-base font-mono text-xs leading-relaxed resize-y min-h-32"
          spellCheck={false}
        />
      </div>

      {/* Text */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-muted">Text</span>
          <CopyButton text={parsed.text} />
        </div>
        <textarea
          value={parsed.text}
          onChange={e => onChange('text', null, e.target.value)}
          className="input-base text-sm leading-relaxed resize-y min-h-20"
          spellCheck={false}
        />
      </div>

      {/* Image Description */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-muted">Image Description</span>
          <CopyButton text={parsed.imageDescription} />
        </div>
        <textarea
          value={parsed.imageDescription}
          onChange={e => onChange('imageDescription', null, e.target.value)}
          className="input-base text-sm leading-relaxed resize-y min-h-20"
          spellCheck={false}
        />
      </div>

      {/* Real Image */}
      <ImageTypeSection
        label="Real Image"
        block={parsed.realPhoto}
        onChange={(subfield, value) => onChange('realPhoto', subfield, value)}
      />

      {/* 3D Rendering */}
      <ImageTypeSection
        label="3D Rendering"
        block={parsed.rendering3d}
        onChange={(subfield, value) => onChange('rendering3d', subfield, value)}
      />
    </div>
  )
}
