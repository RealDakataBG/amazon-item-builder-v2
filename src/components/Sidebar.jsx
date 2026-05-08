import { SECTIONS, IMAGE_SLOTS, VIDEO_SLOTS } from '../constants'

export default function Sidebar({
  activeSection, onSectionChange,
  onNewConcept, onCreateConcept,
  generationDone, sections, conceptStatus,
  imageGenerating, imageStatus,
  activePanel, activeImageSlot,
  onCreateImages, onImageSlotChange,
  videoSections, activeVideoSlot, onVideoSlotChange,
  imageRegenStatus = {}, videoRegenStatus = {}, textRegenStatus = {},
  conceptCreationStatus = 'idle', onConceptCreation,
}) {
  const sectionLabel = text => (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1.5">{text}</p>
  )

  return (
    <div className="h-full flex flex-col select-none">

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">

        {/* Listing Text */}
        <div>
          {sectionLabel('Listing Text')}
          <div className="space-y-0.5">
            {SECTIONS.map(section => {
              const isDone = generationDone && sections?.[section.id]?.output
              const isActive = activePanel === 'text' && activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => generationDone && onSectionChange(section.id)}
                  disabled={!generationDone}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 ${
                    !generationDone
                      ? 'text-gray-300 cursor-not-allowed'
                      : isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{section.label}</span>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    {textRegenStatus[section.id] === 'loading' && (
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    )}
                    {textRegenStatus[section.id] === 'done' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    {isDone && !textRegenStatus[section.id] && (
                      <svg className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action buttons */}
        {generationDone && (
          <div className="space-y-1.5">
            {/* Create Concept */}
            <button
              onClick={onCreateConcept}
              disabled={conceptStatus === 'loading'}
              className={`relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                conceptStatus === 'loading'
                  ? 'bg-emerald-500 text-white cursor-wait'
                  : conceptStatus === 'done'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : conceptStatus === 'error'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {conceptStatus === 'loading' && (
                <span className="absolute inset-0 flex items-center justify-center bg-emerald-500">
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
              <span className={conceptStatus === 'loading' ? 'invisible' : ''}>
                {conceptStatus === 'done' ? 'Concept Created ✓' : conceptStatus === 'error' ? 'Retry' : 'Create Concept'}
              </span>
            </button>

            {/* Create Variants (disabled) */}
            <button
              disabled
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white opacity-50 cursor-not-allowed"
            >
              Create Variants
            </button>

            {/* Create Images */}
            <button
              onClick={onCreateImages}
              disabled={imageStatus === 'done'}
              className={`relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                imageStatus === 'done'
                  ? 'bg-orange-500 text-white opacity-60 cursor-not-allowed'
                  : imageGenerating
                  ? 'bg-orange-500 text-white cursor-wait'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {imageGenerating && (
                <span className="absolute inset-0 flex items-center justify-center bg-orange-500">
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
              <span className={imageGenerating ? 'invisible' : ''}>
                {imageStatus === 'done' ? 'Images Created ✓' : 'Create Images'}
              </span>
            </button>
          </div>
        )}

        {/* Image + Video sections */}
        {imageStatus === 'done' && (
          <div className="space-y-4">

            {/* Product Images */}
            <div>
              {sectionLabel('Product Images')}
              <div className="space-y-0.5">
                {IMAGE_SLOTS.filter(s => s.group === 'product').map(slot => {
                  const isActive = activePanel === 'image' && activeImageSlot === slot.id
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onImageSlotChange(slot.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{slot.label}</span>
                      {imageRegenStatus[slot.id] === 'loading' && (
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
                      )}
                      {imageRegenStatus[slot.id] === 'done' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* A+ Images */}
            <div>
              {sectionLabel('A+ Images')}
              <div className="space-y-0.5">
                {IMAGE_SLOTS.filter(s => s.group === 'aplus').map(slot => {
                  const isActive = activePanel === 'image' && activeImageSlot === slot.id
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onImageSlotChange(slot.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{slot.label}</span>
                      {imageRegenStatus[slot.id] === 'loading' && (
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
                      )}
                      {imageRegenStatus[slot.id] === 'done' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Video Scenes */}
            <div>
              {sectionLabel('Video Scenes')}
              <div className="space-y-0.5">
                {VIDEO_SLOTS.map(slot => {
                  const isActive = activePanel === 'video' && activeVideoSlot === slot.id
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onVideoSlotChange(slot.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{slot.label}</span>
                      {videoRegenStatus[slot.id] === 'loading' && (
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
                      )}
                      {videoRegenStatus[slot.id] === 'done' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Concept Creation */}
            <button
              onClick={onConceptCreation}
              disabled={conceptCreationStatus === 'loading' || conceptCreationStatus === 'done'}
              className={`relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                conceptCreationStatus === 'loading'
                  ? 'bg-purple-500 text-white cursor-wait'
                  : conceptCreationStatus === 'done'
                  ? 'bg-purple-500 text-white opacity-60 cursor-not-allowed'
                  : conceptCreationStatus === 'error'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              {conceptCreationStatus === 'loading' && (
                <span className="absolute inset-0 flex items-center justify-center bg-purple-500">
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
              <span className={conceptCreationStatus === 'loading' ? 'invisible' : ''}>
                {conceptCreationStatus === 'done'
                  ? 'Concept Created ✓'
                  : conceptCreationStatus === 'error'
                  ? 'Retry'
                  : 'Concept Creation'}
              </span>
            </button>

          </div>
        )}

      </nav>

      {/* New Concept */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button onClick={onNewConcept} className="btn-outline w-full justify-center">
          New Concept
        </button>
      </div>

    </div>
  )
}
