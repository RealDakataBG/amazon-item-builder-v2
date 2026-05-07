export const IDENTIFIER_SHEET_ID = '1JCyL-0hvxqyyoJB-85oE5PXPoJnpIzSTC6v-YBx9zD8'
export const PROMPT_SHEET_ID = '1KPMY6ysX_1zFSj9hucM-UsFErvcCFbQzxSE-E8mb59A'

export const SYSTEM_PROMPTS = {
  title: `You are an expert Amazon listing copywriter specializing in product titles. When given product information and specifications, generate optimized Amazon product titles that are clear, keyword-rich, and conversion-focused.
Return only the title. No explanation or commentary unless asked.`,

  bullets: `You are an expert Amazon listing copywriter specializing in product bullet points. When given product information and specifications, write compelling bullet points that highlight key features and benefits in a clear, conversion-focused way.
Return only the bullet points. No explanation or commentary unless asked.`,

  description: `You are an expert Amazon listing copywriter specializing in product descriptions. When given product information and specifications, write an engaging product description that informs, persuades, and converts browsers into buyers.
Return only the description. No explanation or commentary unless asked.`,

  keywords: `You are an expert Amazon listing copywriter specializing in backend search keywords. When given product information and specifications, generate a comprehensive set of relevant search keywords optimized for Amazon's search algorithm.
Return only the keywords. No explanation or commentary unless asked.`,
}

export const SECTIONS = [
  { id: 'title',       label: 'Title' },
  { id: 'bullets',     label: 'Bullet Points' },
  { id: 'description', label: 'Description' },
  { id: 'keywords',    label: 'Keywords' },
]

export const IMAGE_SYSTEM_PROMPT = `You are an expert Amazon product image concept creator.
Return ONLY raw JSON — no markdown, no code fences, no explanation, no trailing text.
Use EXACTLY these camelCase key names:
{
  "text": "<short description in German>",
  "imageDescription": "<short description in German>",
  "realPhoto": {
    "needed": "Yes or No",
    "description": "<German description, or No if needed is No>",
    "person": "Yes or No",
    "location": "<Studio|Bedroom|Kitchen|Outdoors city|Outdoors nature|Office|Living room|Bathroom|Workshop / Werkstatt|Car|No>"
  },
  "rendering3d": {
    "needed": "Yes or No",
    "description": "<German description, or No if needed is No>",
    "person": "Yes or No",
    "location": "<Studio|Bedroom|Kitchen|Outdoors city|Outdoors nature|Office|Living room|Bathroom|Workshop / Werkstatt|Car|No>"
  }
}
If needed is "No", every other field in that block must also be "No".`

export const USP_SYSTEM_PROMPT = `You are an expert product analyst. Analyze the product information and output the result. Return only the analysis, no commentary.`

export const IMAGE_SLOTS = [
  { id: 0,  label: 'Product Image 1', group: 'product' },
  { id: 1,  label: 'Product Image 2', group: 'product' },
  { id: 2,  label: 'Product Image 3', group: 'product' },
  { id: 3,  label: 'Product Image 4', group: 'product' },
  { id: 4,  label: 'Product Image 5', group: 'product' },
  { id: 5,  label: 'Product Image 6', group: 'product' },
  { id: 6,  label: 'A+ Image 1',      group: 'aplus' },
  { id: 7,  label: 'A+ Image 2',      group: 'aplus' },
  { id: 8,  label: 'A+ Image 3',      group: 'aplus' },
  { id: 9,  label: 'A+ Image 4',      group: 'aplus' },
  { id: 10, label: 'A+ Image 5',      group: 'aplus' },
]

export const LOCATION_OPTIONS = [
  'Studio', 'Bedroom', 'Kitchen', 'Outdoors city', 'Outdoors nature',
  'Office', 'Living room', 'Bathroom', 'Workshop / Werkstatt', 'Car',
]
