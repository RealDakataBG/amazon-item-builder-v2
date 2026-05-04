export function normalizeGermanChars(str) {
  return str
    .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
    .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
    .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
}

export function sanitizeTaskName(str) {
  return str
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 60)
}

export function appendRandomNumber(str) {
  return str + (Math.floor(Math.random() * 1000) + 1)
}

export function ensureHttps(url) {
  const trimmed = url.trim()
  if (trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('http://')) return 'https://' + trimmed.slice(7)
  return 'https://' + trimmed
}

export function extractAndFormatReviews(items) {
  const reviews = items?.[0]?.return?.fixturesInfo?.[0]?.reviews ?? []
  return reviews
    .slice(0, 15)
    .map((r, i) =>
      `Review ${i + 1} (${r.rating ?? '?'}/5 Sterne):\n"${r.reviewTitle ?? ''}"\n${r.reviewBody ?? ''}`
    )
    .join('\n\n')
}

export function buildApifyTaskBody(template, processedName, competitorUrl) {
  const jsonStr = JSON.stringify(template)
    .replace(/\{1\}/g, processedName)
    .replace(/\{2\}/g, competitorUrl)
  return JSON.parse(jsonStr)
}
