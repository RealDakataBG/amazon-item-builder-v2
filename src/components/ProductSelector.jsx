import { useEffect, useState } from 'react'
import { fetchSheetTabs } from '../utils/sheets'

export default function ProductSelector({ clientSheetId, clientName, onSelect, onBack }) {
  const [tabs, setTabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!clientSheetId) {
      setError('No spreadsheet ID found for this client.')
      setLoading(false)
      return
    }
    fetchSheetTabs(clientSheetId)
      .then(setTabs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [clientSheetId])

  const filtered = tabs.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-2xl mx-4 my-16 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to clients
          </button>
          <p className="label-muted mb-1">{clientName}</p>
          <h1 className="text-2xl font-bold text-gray-900">Select a Product</h1>
          <p className="text-sm text-gray-500 mt-1">Each tab in the client spreadsheet represents one product.</p>
        </div>

        <div className="px-8 py-6">
          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base pl-9"
              autoFocus
            />
          </div>

          {/* States */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-3 text-sm text-gray-500">Loading products...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-700">Failed to load products</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No products found{search ? ` for "${search}"` : '.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filtered.map((tab, i) => (
                    <button
                      key={`${tab.sheetId}-${i}`}
                      onClick={() => onSelect(tab.title)}
                      className="card text-left group"
                    >
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 mt-0.5 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                          {tab.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 text-right">
                {filtered.length} of {tabs.length} products
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
