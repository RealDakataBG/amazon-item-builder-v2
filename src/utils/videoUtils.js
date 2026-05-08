function normalizeVideoBlock(block = {}) {
  return {
    description: block.description ?? '',
    person:      block.person ?? block.actor ?? 'No',
    location:    block.location ?? 'Studio',
  }
}

function normalizeRenderingBlock(block = {}) {
  return {
    needed:      block.needed      ?? 'No',
    description: block.description ?? 'No',
    person:      block.person ?? block.actor ?? 'No',
    location:    block.location    ?? 'No',
  }
}

function normalizeScene(raw) {
  return {
    text:             raw.text             ?? '',
    imageDescription: raw.imageDescription ?? raw.image_description ?? '',
    realVideo:        normalizeVideoBlock(raw.realVideo ?? raw.real_video),
    rendering3d:      normalizeRenderingBlock(raw.rendering3d ?? raw['3d_rendering'] ?? raw.rendering_3d),
  }
}

export function parseVideoScenesOutput(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```\s*(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    const raw = JSON.parse(cleaned)
    let arr
    if (Array.isArray(raw)) {
      arr = raw
    } else if (raw && typeof raw === 'object') {
      // Handle {scene_1: {...}, scene_2: {...}, ...} format
      arr = Object.values(raw)
    } else {
      arr = [raw]
    }
    return { data: arr.map(normalizeScene), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export function parseVideoScene5Output(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```\s*(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    const raw = JSON.parse(cleaned)
    const obj = Array.isArray(raw) ? raw[0] : raw
    return { data: normalizeScene(obj), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export function buildVideoScenesPrompt(scenesPrompt, descriptionOutput, usp2Output) {
  return [
    scenesPrompt,
    'Hier sind die Produktinformationen:',
    descriptionOutput,
    'Alleinstellungsmerkmale',
    usp2Output,
  ].join('\n')
}

export function buildVideoScene5Prompt(scene5Prompt, descriptionOutput, variants, usp2Output) {
  return [
    scene5Prompt,
    'Hier sind die Produktinformationen:',
    descriptionOutput,
    'Hier sind die Varianten:',
    variants.join('\n'),
    'Alleinstellungsmerkmale',
    usp2Output,
  ].join('\n')
}
