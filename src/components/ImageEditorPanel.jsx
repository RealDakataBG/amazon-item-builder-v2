import { LOCATION_OPTIONS } from '../constants'
import CopyButton from './CopyButton'
import SideBySideField from './SideBySideField'
import RegenerateControls from './RegenerateControls'

const SELECT_CLASS = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer'

function ImageTypeSection({ label, block, onChange, disabled }) {
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
        disabled={disabled}
      />
      <div className="flex gap-2 flex-wrap mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">Model</span>
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

export default function ImageEditorPanel({ slotLabel, data, onChange, regenStatus, onRegenerate, history, onHistoryNav, onCommit }) {
  const { parsed, parseError, rawOutput, input } = data
  const isUncommitted = !!history && history.items.length > 1

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

      {/* Regenerate button + history navigation */}
      <RegenerateControls
        regenStatus={regenStatus}
        onRegenerate={onRegenerate}
        history={history}
        onNavigate={onHistoryNav}
        onCommit={onCommit}
      />

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
          disabled={isUncommitted}
        />
      </div>

      {/* Image Description */}
      <div className="mb-6">
        <SideBySideField
          label="Image Description"
          leftValue={parsed.imageDescription}
          onLeftChange={val => onChange('imageDescription', null, val)}
          disabled={isUncommitted}
        />
      </div>

      {/* Real Image */}
      <ImageTypeSection
        label="Real Image"
        block={parsed.realPhoto}
        onChange={(subfield, value) => onChange('realPhoto', subfield, value)}
        disabled={isUncommitted}
      />

      {/* 3D Rendering */}
      <ImageTypeSection
        label="3D Rendering"
        block={parsed.rendering3d}
        onChange={(subfield, value) => onChange('rendering3d', subfield, value)}
        disabled={isUncommitted}
      />
    </div>
  )
}
