export default function SheetUrlInputModal({ listingUrl, visualsUrl, onListingChange, onVisualsChange, onGenerate, loading, error, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[520px] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Paste Concept Sheet URLs</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
              Listing Sheet URL
            </label>
            <input
              type="url"
              value={listingUrl}
              onChange={e => onListingChange(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="input-base w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
              Visuals Sheet URL
            </label>
            <input
              type="url"
              value={visualsUrl}
              onChange={e => onVisualsChange(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="input-base w-full text-sm"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline px-4 py-1.5">Cancel</button>
          <button
            onClick={onGenerate}
            disabled={loading || !listingUrl.trim() || !visualsUrl.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Reading sheets…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}
