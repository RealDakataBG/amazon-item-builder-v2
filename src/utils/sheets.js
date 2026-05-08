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
  const values = await fetchRange(IDENTIFIER_SHEET_ID, 'A2:D200')
  return values
    .filter(row => row[0])
    .map(row => ({
      name: row[0] ?? '',
      identifier: row[1] ?? '',
      clientSheetId: row[2] ?? '',
      driveFolderUrl: row[3] ?? '',
    }))
}

export async function fetchProductData(clientSheetId, tabName) {
  // B2:E6 — row offset 0=row2, col offset 0=B
  // B2=[0][0], B3=[1][0], D6=[4][2], E6=[4][3]
  const values = await fetchRange(clientSheetId, `'${tabName}'!B2:E6`)
  return {
    productName:   values?.[0]?.[0] ?? '',
    competitorUrl: values?.[1]?.[0] ?? '',
    description:   values?.[4]?.[2] ?? '',
    usp:           values?.[4]?.[3] ?? '',
  }
}

export async function fetchPromptSheet() {
  // B1:B7 — row offset 0=B1, row offset 2=B3, row offset 4=B5, row offset 6=B7
  const values = await fetchRange(PROMPT_SHEET_ID, "'Text'!B1:B7")
  return {
    titlePrompt:       values?.[0]?.[0] ?? '',
    bulletsPrompt:     values?.[2]?.[0] ?? '',
    descriptionPrompt: values?.[4]?.[0] ?? '',
    keywordsPrompt:    values?.[6]?.[0] ?? '',
  }
}

export async function fetchImagePrompts() {
  const [featureRows, productRows, aplusRows] = await Promise.all([
    fetchRange(PROMPT_SHEET_ID, "'Feature assignment'!B1:B3"),
    fetchRange(PROMPT_SHEET_ID, "'Product Images'!B1:B11"),
    fetchRange(PROMPT_SHEET_ID, "'A+ Images'!B1:B9"),
  ])
  return {
    usp1Prompt:     featureRows?.[0]?.[0] ?? '',
    usp2Prompt:     featureRows?.[2]?.[0] ?? '',
    productPrompts: [0,2,4,6,8,10].map(i => productRows?.[i]?.[0] ?? ''),
    aplusPrompts:   [0,2,4,6,8].map(i => aplusRows?.[i]?.[0] ?? ''),
  }
}

export async function fetchVideoPrompts() {
  const values = await fetchRange(PROMPT_SHEET_ID, "'Video'!B1:B3")
  return {
    scenesPrompt: values?.[0]?.[0] ?? '',
    scene5Prompt: values?.[2]?.[0] ?? '',
  }
}

export async function fetchProductVariants(clientSheetId, tabName) {
  const values = await fetchRange(clientSheetId, `'${tabName}'!B7:B100`)
  return values.filter(row => row[0]).map(row => row[0])
}
