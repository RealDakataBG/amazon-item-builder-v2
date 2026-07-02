import { safeJsonParse } from './jsonUtils'

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
    const raw = safeJsonParse(rawText)

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

// Parses USP2 output into an array of 11 strings: indices 0-5 = Bild 1-6, indices 6-10 = Banner 1-5
export function parseUsp2Sections(rawText) {
  const result = Array(11).fill('')
  const chunks = rawText.split(/^(?=Bild\s+\d+|Banner\s+\d+)/im)
  for (const chunk of chunks) {
    const m = chunk.match(/^(Bild|Banner)\s+(\d+)/i)
    if (!m) continue
    const isBild = m[1].toLowerCase() === 'bild'
    const num = parseInt(m[2], 10)
    const idx = isBild ? num - 1 : 5 + num  // Bild 1→0 … Bild 6→5; Banner 1→6 … Banner 5→10
    if (idx >= 0 && idx < 11) {
      result[idx] = chunk.replace(/^[^\n]*\n/, '').trim()
    }
  }
  return result
}

export function buildImageUserPrompt(imagePromptFromSheet, descriptionOutput, uspSection) {
  return [
    imagePromptFromSheet,
    'Hier sind die Produktinformationen:',
    descriptionOutput,
    'Alleinstellungsmerkmale',
    uspSection,
  ].join('\n')
}
