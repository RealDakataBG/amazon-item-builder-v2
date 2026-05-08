import { useState } from 'react'
import { callClaude } from '../utils/claude'
import { EDIT_SYSTEM_PROMPT } from '../constants'

export default function UseAIBox({ label, targetValue, onAccept }) {
  const [request, setRequest] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!request.trim() || loading) return
    setLoading(true)
    try {
      const result = await callClaude(
        EDIT_SYSTEM_PROMPT,
        `Original text:\n${targetValue}\n\nChange request:\n${request}`
      )
      setRequest(result)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-400 truncate mr-2">{label}</span>
        <button
          onClick={handleRun}
          disabled={loading || !request.trim()}
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
            loading
              ? 'bg-purple-100 text-purple-400 cursor-wait'
              : !request.trim()
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
          }`}
        >
          {loading && (
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Use AI
        </button>
      </div>
      <textarea
        value={request}
        onChange={e => setRequest(e.target.value)}
        className="input-base text-sm leading-relaxed resize-y min-h-20 w-full"
        placeholder="Describe what you want changed…"
        spellCheck={false}
      />
      {request && !loading && (
        <button
          onClick={() => { onAccept(request); setRequest('') }}
          className="mt-1.5 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
        >
          ✓ Accept
        </button>
      )}
    </div>
  )
}
