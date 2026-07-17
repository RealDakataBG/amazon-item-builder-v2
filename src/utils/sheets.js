import { IDENTIFIER_SHEET_ID, PROMPT_SHEET_ID } from '../constants'

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const key = () => import.meta.env.VITE_GOOGLE_API_KEY

async function fetchRange(spreadsheetId, range) {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${key()}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Sheets API error on "${range}": ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  return data.values || []
}

export async function fetchSheetTabs(spreadsheetId) {
  const url = `${BASE}/${spreadsheetId}?fields=sheets.properties&key=${key()}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Sheets metadata error: ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  return data.sheets.map(s => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }))
}

export async function fetchIdentifierSheet() {
  const values = await fetchRange(IDENTIFIER_SHEET_ID, 'A2:G200')
  return values
    .filter(row => row[0])
    .map(row => ({
      name:              row[0] ?? '',
      identifier:        row[1] ?? '',
      clientSheetId:     row[2] ?? '',
      driveFolderUrl:    row[3] ?? '',
      visualsFolderId:   row[4] || row[3] || '',
      shotlistFolderId:  row[5] || row[3] || '',
      listingFolderId:   row[6] || row[3] || '',
    }))
}

export async function fetchProductData(clientSheetId, tabName) {
  // B2:E6 — row offset 0=row2, col offset 0=B
  // B2=[0][0], B3=[1][0], C6=[4][1], D6=[4][2], E6=[4][3]
  const values = await fetchRange(clientSheetId, `'${tabName}'!B2:E6`)
  return {
    productName:   values?.[0]?.[0] ?? '',
    competitorUrl: values?.[1]?.[0] ?? '',
    spec:          values?.[4]?.[1] ?? '',
    description:   values?.[4]?.[2] ?? '',
    usp:           values?.[4]?.[3] ?? '',
  }
}

export async function fetchPromptSheet() {
  // B2:C8 — user prompts in col B (rows 0,2,4,6 = B2,B4,B6,B8), system prompts in col C
  const values = await fetchRange(PROMPT_SHEET_ID, "'Text'!B2:C8")
  return {
    titlePrompt:             values?.[0]?.[0] ?? '',
    bulletsPrompt:           values?.[2]?.[0] ?? '',
    descriptionPrompt:       values?.[4]?.[0] ?? '',
    keywordsPrompt:          values?.[6]?.[0] ?? '',
    titleSystemPrompt:       values?.[0]?.[1] ?? '',
    bulletsSystemPrompt:     values?.[2]?.[1] ?? '',
    descriptionSystemPrompt: values?.[4]?.[1] ?? '',
    keywordsSystemPrompt:    values?.[6]?.[1] ?? '',
  }
}

export async function fetchImagePrompts() {
  const [featureRows, productRows, aplusRows] = await Promise.all([
    fetchRange(PROMPT_SHEET_ID, "'Feature assignment'!B2:C4"),
    fetchRange(PROMPT_SHEET_ID, "'Product Images'!B2:C12"),
    fetchRange(PROMPT_SHEET_ID, "'A+ Images'!B2:C10"),
  ])
  return {
    usp1Prompt:           featureRows?.[0]?.[0] ?? '',
    usp2Prompt:           featureRows?.[2]?.[0] ?? '',
    usp1SystemPrompt:     featureRows?.[0]?.[1] ?? '',
    usp2SystemPrompt:     featureRows?.[2]?.[1] ?? '',
    productPrompts:       [0,2,4,6,8,10].map(i => productRows?.[i]?.[0] ?? ''),
    productSystemPrompts: [0,2,4,6,8,10].map(i => productRows?.[i]?.[1] ?? ''),
    aplusPrompts:         [0,2,4,6,8].map(i => aplusRows?.[i]?.[0] ?? ''),
    aplusSystemPrompts:   [0,2,4,6,8].map(i => aplusRows?.[i]?.[1] ?? ''),
  }
}

export async function fetchVideoPrompts() {
  // B2:C4 — user prompts in col B (rows 0,2 = B2,B4), system prompts in col C
  const values = await fetchRange(PROMPT_SHEET_ID, "'Video'!B2:C4")
  return {
    scenesPrompt:       values?.[0]?.[0] ?? '',
    scene5Prompt:       values?.[2]?.[0] ?? '',
    scenesSystemPrompt: values?.[0]?.[1] ?? '',
    scene5SystemPrompt: values?.[2]?.[1] ?? '',
  }
}

export async function fetchEditSystemPrompt() {
  const values = await fetchRange(PROMPT_SHEET_ID, "'Use AI'!B2")
  return values?.[0]?.[0] ?? ''
}

export async function fetchVariantsSystemPrompts() {
  const values = await fetchRange(PROMPT_SHEET_ID, "'Variants'!B2:B4")
  return {
    listingSystemPrompt: values?.[0]?.[0] ?? '',
    imageSystemPrompt:   values?.[2]?.[0] ?? '',
  }
}

export async function fetchPropListSystemPrompt() {
  const values = await fetchRange(PROMPT_SHEET_ID, "'Prop List'!B2")
  return values?.[0]?.[0] ?? ''
}

export async function fetchRegenerateSystemPrompts() {
  const values = await fetchRange(PROMPT_SHEET_ID, "'Regenerate'!B2:B4")
  return {
    textSystemPrompt:  values?.[0]?.[0] ?? '',
    imageSystemPrompt: values?.[2]?.[0] ?? '',
  }
}

export function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match?.[1] ?? null
}

export async function fetchListingConcept(sheetId) {
  const tabs = await fetchSheetTabs(sheetId)
  const tab  = tabs[0].title
  const [d6, c14, c18, c23] = await Promise.all([
    fetchRange(sheetId, `'${tab}'!D6`),
    fetchRange(sheetId, `'${tab}'!C14`),
    fetchRange(sheetId, `'${tab}'!C18`),
    fetchRange(sheetId, `'${tab}'!C23`),
  ])
  return {
    title:       d6?.[0]?.[0]  ?? '',
    bullets:     c14?.[0]?.[0] ?? '',
    description: c18?.[0]?.[0] ?? '',
    keywords:    c23?.[0]?.[0] ?? '',
  }
}

export async function fetchVisualsConcept(sheetId) {
  const tabs = await fetchSheetTabs(sheetId)
  const tab  = tabs[0].title

  const [imageRange, videoRange] = await Promise.all([
    fetchRange(sheetId, `'${tab}'!A4:G78`),
    fetchRange(sheetId, `'${tab}'!A82:G114`),
  ])

  const cell = (range, row, col) => range?.[row]?.[col] ?? ''

  const images = Array.from({ length: 11 }, (_, n) => {
    const base = n * 7
    const parsed = {
      text:             cell(imageRange, base,     3),
      imageDescription: cell(imageRange, base + 1, 3),
      realPhoto: {
        needed:      cell(imageRange, base + 3, 1),
        description: cell(imageRange, base + 3, 3),
        person:      cell(imageRange, base + 3, 5),
        location:    cell(imageRange, base + 3, 6),
      },
      rendering3d: {
        needed:      cell(imageRange, base + 4, 1),
        description: cell(imageRange, base + 4, 3),
        person:      cell(imageRange, base + 4, 5),
        location:    cell(imageRange, base + 4, 6),
      },
    }
    return { input: '', rawOutput: JSON.stringify(parsed), parsed, parseError: null }
  })

  const videos = Array.from({ length: 5 }, (_, n) => {
    const base = n * 7
    const parsed = {
      text:             cell(videoRange, base,     3),
      imageDescription: cell(videoRange, base + 1, 3),
      realVideo: {
        description: cell(videoRange, base + 3, 3),
        person:      cell(videoRange, base + 3, 5),
        location:    cell(videoRange, base + 3, 6),
      },
      rendering3d: {
        needed:      cell(videoRange, base + 4, 1),
        description: cell(videoRange, base + 4, 3),
        person:      cell(videoRange, base + 4, 5),
        location:    cell(videoRange, base + 4, 6),
      },
    }
    return { input: '', rawOutput: '', parsed, parseError: null }
  })

  return { images, videos }
}

export async function fetchProductVariants(clientSheetId, tabName) {
  const values = await fetchRange(clientSheetId, `'${tabName}'!A7:C100`)
  return values
    .filter(row => row[1])
    .map(row => ({
      number: (row[0] ?? '').replace(/\D/g, ''),
      name:   row[1] ?? '',
      spec:   row[2] ?? '',
    }))
}
