export async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch('/api/claude-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Claude API error ${res.status}`)
  }
  const data = await res.json()
  return data.text
}
