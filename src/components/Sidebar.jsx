import { useState } from 'react'
import { SECTIONS, IMAGE_SLOTS, VIDEO_SLOTS } from '../constants'

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

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
  const [step1Open, setStep1Open] = useState(true)
  const [step2Open, setStep2Open] = useState(true)
  const [listingTextOpen, setListingTextOpen] = useState(true)
  const [productImagesOpen, setProductImagesOpen] = useState(true)
  const [aplusImagesOpen, setAplusImagesOpen] = useState(true)
  const [videoScenesOpen, setVideoScenesOpen] = useState(true)

  return (
    <div className="h-full flex flex-col select-none">

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-2">

        {/* STEP 1 — LISTING */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setStep1Open(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 1 | Listing</span>
            <ChevronIcon open={step1Open} />
          </button>

          {step1Open && (
            <div className="px-2 py-2 space-y-1">

              {/* Listing Text group */}
              <div>
                <button
                  onClick={() => setListingTextOpen(o => !o)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Listing Text</span>
                  <ChevronIcon open={listingTextOpen} />
                </button>

                {listingTextOpen && (
                  <div className="space-y-0.5 mt-0.5">
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
                )}
              </div>

              {/* Step 1 action buttons */}
              {generationDone && (
                <div className="pt-1.5 border-t border-gray-100 mt-1">
                  {/* Create Concept */}
                  <button
                    onClick={onCreateConcept}
                    disabled={conceptStatus === 'loading'}
                    className={`relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors overflow-hidden ${
                      conceptStatus === 'loading'
                        ? 'bg-emerald-500 text-white cursor-wait'
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
                </div>
              )}

            </div>
          )}
        </div>

        {/* STEP 2 — VISUALS */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setStep2Open(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 2 | Visuals</span>
            <ChevronIcon open={step2Open} />
          </button>

          {step2Open && (
            <div className="px-2 py-2 space-y-1">

              {/* Create Images */}
              {generationDone && (
                <div className="pb-2 border-b border-gray-100">
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

              {/* Image + Video slot groups */}
              {imageStatus === 'done' && (
                <div className="space-y-1 pt-1">

                  {/* Product Images group */}
                  <div>
                    <button
                      onClick={() => setProductImagesOpen(o => !o)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Product Images</span>
                      <ChevronIcon open={productImagesOpen} />
                    </button>

                    {productImagesOpen && (
                      <div className="space-y-0.5 mt-0.5">
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
                    )}
                  </div>

                  {/* A+ Images group */}
                  <div>
                    <button
                      onClick={() => setAplusImagesOpen(o => !o)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">A+ Images</span>
                      <ChevronIcon open={aplusImagesOpen} />
                    </button>

                    {aplusImagesOpen && (
                      <div className="space-y-0.5 mt-0.5">
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
                    )}
                  </div>

                  {/* Video Scenes group */}
                  <div>
                    <button
                      onClick={() => setVideoScenesOpen(o => !o)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Video Scenes</span>
                      <ChevronIcon open={videoScenesOpen} />
                    </button>

                    {videoScenesOpen && (
                      <div className="space-y-0.5 mt-0.5">
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
                    )}
                  </div>

                  {/* Concept Creation */}
                  <div className="border-t border-gray-100 pt-1.5">
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
        </div>

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
