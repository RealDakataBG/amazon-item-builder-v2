import { SECTIONS, IMAGE_SLOTS, VIDEO_SLOTS } from '../constants'

export default function Sidebar({
  clientName, productName,
  activeSection, onSectionChange,
  onNewConcept, onCreateConcept,
  generationDone, sections, conceptStatus,
  imageGenerating, imageStatus, imageSections,
  activePanel, activeImageSlot,
  onCreateImages, onImageSlotChange,
  videoSections, activeVideoSlot, onVideoSlotChange,
  imageRegenStatus = {}, videoRegenStatus = {}, textRegenStatus = {},
  conceptCreationStatus = 'idle', onConceptCreation,
}) {
  return (
    <div className="h-full flex flex-col p-4 select-none">
      {/* App branding */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Listing Builder</span>
        </div>
      </div>

      {/* Client & product info */}
      {clientName && (
        <div className="mb-4">
          <p className="label-muted mb-1">Client</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{clientName}</p>
        </div>
      )}
      {productName && (
        <div className="mb-4">
          <p className="label-muted mb-1">Product</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{productName}</p>
        </div>
      )}

      {(clientName || productName) && (
        <div className="border-t border-gray-200 my-2" />
      )}

      {/* Section navigation — scrollable */}
      <nav className="flex-1 space-y-0.5 mt-2 overflow-y-auto">
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

        {/* Action buttons + image slots — shown when text generation is done */}
        {generationDone && (
          <div className="pt-2 space-y-1.5">
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

            {/* Create Images (orange) */}
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

            {/* Image slots — only shown after generation completes */}
            {imageStatus === 'done' && (
              <div className="border-t border-gray-200 mt-3 mb-1 pt-1">
                <p className="label-muted px-1 mb-1">Product Images</p>
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

                <p className="label-muted px-1 mt-3 mb-1">A+ Images</p>
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

                <p className="label-muted px-1 mt-3 mb-1">Video Scenes</p>
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
                {/* Concept Creation */}
                <div className="border-t border-gray-200 mt-3 pt-3">
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
              </div>
            )}
          </div>
        )}
      </nav>

      {/* New Concept button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button onClick={onNewConcept} className="btn-outline w-full justify-center">
          New Concept
        </button>
      </div>
    </div>
  )
}
