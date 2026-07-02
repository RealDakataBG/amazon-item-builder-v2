export async function callClaude(systemPrompt, userPrompt, image = null) {
  const res = await fetch('/api/claude-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt, image }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Claude API error ${res.status}`)
  }
  const data = await res.json()
  return data.text
}

export async function callClaudeStructured(systemPrompt, userPrompt, schema) {
  const res = await fetch('/api/claude-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt, schema, maxTokens: 8192 }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Claude API error ${res.status}`)
  }
  const data = await res.json()
  return data.structured
}
