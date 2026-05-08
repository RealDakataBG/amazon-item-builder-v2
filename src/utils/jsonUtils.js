function extractJsonStr(str) {
  const stripped = str
    .replace(/^```\s*(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  const firstBrace   = stripped.indexOf('{')
  const firstBracket = stripped.indexOf('[')

  let start, end
  if (firstBrace === -1 && firstBracket === -1) return stripped

  if (firstBrace === -1 || (firstBracket !== -1 && firstBracket < firstBrace)) {
    start = firstBracket
    end   = stripped.lastIndexOf(']')
  } else {
    start = firstBrace
    end   = stripped.lastIndexOf('}')
  }

  if (end <= start) return stripped
  return stripped.slice(start, end + 1)
}

function fixUnescapedQuotes(str) {
  let result   = ''
  let inString = false
  let escaped  = false

  for (let i = 0; i < str.length; i++) {
    const c = str[i]

    if (escaped) { result += c; escaped = false; continue }
    if (c === '\\') { result += c; escaped = true; continue }

    if (c === '"') {
      if (!inString) {
        inString = true
        result += c
      } else {
        // Lookahead past whitespace to find the next meaningful character
        let j = i + 1
        while (j < str.length && ' \t\r\n'.includes(str[j])) j++
        const next = j < str.length ? str[j] : ''
        if (':,}]'.includes(next) || j >= str.length) {
          inString = false
          result += c
        } else {
          // Unescaped " inside a string value — escape it
          result += '\\"'
        }
      }
      continue
    }

    result += c
  }
  return result
}

export function safeJsonParse(rawText) {
  const cleaned = extractJsonStr(rawText)
  try {
    return JSON.parse(cleaned)
  } catch {
    return JSON.parse(fixUnescapedQuotes(cleaned))
  }
}
