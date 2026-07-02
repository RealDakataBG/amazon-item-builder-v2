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

import { safeJsonParse } from './jsonUtils'

export function parseVideoScenesOutput(rawText) {
  try {
    const raw = safeJsonParse(rawText)
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
    const raw = safeJsonParse(rawText)
    // Unwrap {scene_5: {...}} wrapper if present
    let obj
    if (Array.isArray(raw)) {
      obj = raw[0]
    } else if (raw && typeof raw === 'object') {
      const keys = Object.keys(raw)
      obj = (keys.length === 1 && /^scene_/i.test(keys[0])) ? raw[keys[0]] : raw
    } else {
      obj = raw
    }
    return { data: normalizeScene(obj), error: null }
  } catch (e) {
    return { data: null, error: e.message }
  }
}

export function buildVideoScenesPrompt(scenesPrompt, descriptionOutput) {
  return [
    scenesPrompt,
    'Hier sind die Produktinformationen:',
    descriptionOutput,
  ].join('\n')
}

export function buildVideoScene5Prompt(scene5Prompt, descriptionOutput, variants) {
  return [
    scene5Prompt,
    'Hier sind die Produktinformationen:',
    descriptionOutput,
    'Hier sind die Varianten:',
    variants.join('\n'),
  ].join('\n')
}
