import { useState } from 'react'

const WEBHOOK = 'https://hook.eu1.make.com/ain25ortipzjoyhkdkdi112df5h6y24i'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen]           = useState(false)
  const [name, setName]               = useState('')
  const [subject, setSubject]         = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus]           = useState('idle')
  const [errorMsg, setErrorMsg]       = useState('')

  const canSend = name.trim() && subject.trim() && description.trim() && status !== 'sending'

  const handleClose = () => {
    if (status === 'done') {
      setName('')
      setSubject('')
      setDescription('')
      setStatus('idle')
      setErrorMsg('')
    }
    setIsOpen(false)
  }

  const handleSend = async () => {
    if (!canSend) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), subject: subject.trim(), description: description.trim() }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <>
      {/* Expanded panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[480px]">

          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b rounded-t-2xl ${status === 'done' ? 'border-emerald-100 bg-emerald-50' : 'border-gray-100 bg-white'}`}>
            <span className="text-sm font-semibold text-gray-900">Send Feedback</span>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Sending state */}
          {status === 'sending' && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
              <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">Sending…</span>
            </div>
          )}

          {/* Done state */}
          {status === 'done' && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 bg-emerald-50 rounded-b-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-800">Thank you for your feedback!</p>
              <p className="text-xs text-emerald-600">Your message has been sent.</p>
            </div>
          )}

          {/* Form — idle or error */}
          {(status === 'idle' || status === 'error') && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div>
                  <label className="label-muted block mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-base w-full text-sm"
                  />
                </div>
                <div>
                  <label className="label-muted block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Bug report, idea, question…"
                    className="input-base w-full text-sm"
                  />
                </div>
                <div>
                  <label className="label-muted block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your feedback…"
                    className="input-base w-full text-sm min-h-28 resize-none"
                    spellCheck={false}
                  />
                </div>
                {status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-600">{errorMsg}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end px-5 py-4 border-t border-gray-100">
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bubble */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Send feedback"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
          </svg>
        )}
      </button>
    </>
  )
}
