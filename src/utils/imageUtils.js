export function parseImageOutput(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (!parsed.text || !parsed.imageDescription || !parsed.realPhoto || !parsed.rendering3d) {
      throw new Error('Missing required fields')
    }
    return { data: parsed, error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export function buildImageUserPrompt(imagePromptFromSheet, descriptionOutput, usp2Output) {
  return [
    imagePromptFromSheet,
    'Hier sind die Produktinformationen:',
    descriptionOutput,
    'Alleinstellungsmerkmale',
    usp2Output,
  ].join('\n')
}
