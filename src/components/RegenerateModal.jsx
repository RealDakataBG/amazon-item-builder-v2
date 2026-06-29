import { useState, useRef } from 'react'
import { fileToBase64 } from '../utils/imageUpload'

export default function RegenerateModal({ isOpen, onClose, onSubmit, status, error }) {
  const [promptText, setPromptText] = useState('')
  const [image, setImage]           = useState(null) // { base64, mediaType, previewUrl }
  const [fileError, setFileError]   = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const reset = () => {
    setPromptText('')
    setImage(null)
    setFileError(null)
    setIsDragOver(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setFileError('Please choose an image file.')
      return
    }
    setFileError(null)
    try {
      const { base64, mediaType, previewUrl } = await fileToBase64(file)
      setImage({ base64, mediaType, previewUrl })
    } catch (err) {
      setFileError(err.message)
    }
  }

  const handleDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const canSubmit = promptText.trim() && status !== 'loading'

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(promptText.trim(), image ? { base64: image.base64, mediaType: image.mediaType } : null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Regenerate</h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            −
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Image drop zone */}
          <div>
            <span className="label-muted block mb-2">Reference image (optional)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {image ? (
              <div className="relative rounded-xl border border-gray-200 overflow-hidden">
                <img src={image.previewUrl} alt="Reference" className="w-full max-h-48 object-contain bg-gray-50" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white text-sm leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isDragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5" />
                </svg>
                <span className="text-xs text-gray-400 text-center">Click to upload or drag an image here</span>
              </div>
            )}
            {fileError && <p className="text-xs text-red-600 mt-1.5">{fileError}</p>}
          </div>

          {/* Prompt textarea */}
          <div>
            <span className="label-muted block mb-2">Change request</span>
            <textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Describe what you want changed…"
              className="input-base text-sm leading-relaxed resize-y w-full min-h-24"
              spellCheck={false}
            />
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={handleClose} className="btn-outline px-4 py-1.5">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'loading' && (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {status === 'loading' ? 'Submitting…' : 'Submit'}
          </button>
        </div>

      </div>
    </div>
  )
}
