function normalizeBlock(block = {}) {
  return {
    needed:      block.needed      ?? 'No',
    description: block.description ?? 'No',
    person:      block.person ?? block.actor ?? 'No',
    location:    block.location    ?? 'No',
  }
}

export function parseImageOutput(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```\s*(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    const raw = JSON.parse(cleaned)

    // Normalize keys — Claude sometimes returns snake_case variants
    const data = {
      text:             raw.text             ?? '',
      imageDescription: raw.imageDescription ?? raw.image_description ?? '',
      realPhoto:        normalizeBlock(raw.realPhoto ?? raw.real_photo),
      rendering3d:      normalizeBlock(raw.rendering3d ?? raw['3d_rendering'] ?? raw.rendering_3d),
    }

    if (!data.text && !data.imageDescription) {
      throw new Error('Missing required fields')
    }

    return { data, error: null }
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
