import { LOCATION_OPTIONS } from '../constants'
import CopyButton from './CopyButton'
import SideBySideField from './SideBySideField'

const SELECT_CLASS = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer'

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
    <div className="mb-8 pt-5 border-t border-gray-100">
      <span className="text-sm font-semibold text-gray-700 block mb-3">{label}</span>
      <div className="flex gap-2 mb-4">
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
      </div>
      <SideBySideField
        label="Description"
        leftValue={block.description}
        onLeftChange={val => onChange('description', val)}
      />
      <div className="flex gap-2 flex-wrap mt-2">
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

export default function ImageEditorPanel({ slotLabel, data, onChange, regenStatus, onRegenerate }) {
  const { parsed, parseError, rawOutput, input } = data

  if (!parsed) {
    return (
      <div className="h-full flex flex-col p-8 max-w-5xl">
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
    <div className="relative h-full flex flex-col p-8 max-w-5xl">
      {/* Shimmer overlay while regenerating */}
      {regenStatus === 'loading' && (
        <div className="absolute inset-0 z-10 bg-white/70 animate-pulse rounded-xl pointer-events-auto" />
      )}

      <h1 className="text-xl font-semibold text-gray-900 mb-4">{slotLabel}</h1>

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

      {/* Input prompt — single column */}
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
        <SideBySideField
          label="Text"
          leftValue={parsed.text}
          onLeftChange={val => onChange('text', null, val)}
        />
      </div>

      {/* Image Description */}
      <div className="mb-6">
        <SideBySideField
          label="Image Description"
          leftValue={parsed.imageDescription}
          onLeftChange={val => onChange('imageDescription', null, val)}
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
