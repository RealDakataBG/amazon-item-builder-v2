export function buildTitlePrompt({ titlePromptInstruction, productName, description, usp }) {
  return [
    `- ${titlePromptInstruction}`,
    `- Hier findest du die Infos zum dem Produkt um das es geht: Produktname: ${productName}, Beschreibung des Produktes: ${description}, Alleinstellungsmerkmale: ${usp}`,
    `- Gibt mir jetzt den Titel aus.`,
  ].join('\n')
}

export function buildBulletsPrompt({ bulletsPromptInstruction, productName, description, usp }) {
  return [
    `- ${bulletsPromptInstruction}`,
    `- Hier findest du die Infos zum dem Produkt um das es geht: Produktname: ${productName}, Beschreibung des Produktes: ${description}, Alleinstellungsmerkmale: ${usp}`,
    `- Wichtig: Benutze keine Sternchen (*) oder ** im Text und schreibe nichts fett / dick. Es soll also nirgendwo z.B. "**Wort**" stehen.`,
  ].join('\n')
}

export function buildDescriptionPrompt({ descriptionPromptInstruction, productName, description, usp }) {
  return [
    `- ${descriptionPromptInstruction}`,
    `- Hier findest du die Infos zum dem Produkt um das es geht: Produktname: ${productName}, Beschreibung des Produktes: ${description}, Alleinstellungsmerkmale: ${usp}`,
    `- Wichtig: Benutze keine Sternchen (*) oder ** im Text und schreibe nichts fett / dick. Es soll also nirgendwo z.B. "**Wort**" stehen.`,
  ].join('\n')
}

export function buildKeywordsPrompt({ keywordsPromptInstruction, titleResult, bulletsResult, descriptionResult }) {
  return [
    `- Hier sind die Bulletpoints, Titel und die Beschreibung des Produkts:`,
    `  - Title: ${titleResult}`,
    `  - Bullet Points: ${bulletsResult}`,
    `  - Description: ${descriptionResult}`,
    `  - ${keywordsPromptInstruction}`,
    `- Wichtig: Gib die Keywords NUR als eine einzige Zeile aus, alle Keywords hintereinander mit Leerzeichen getrennt. Kein Komma, keine Nummerierung, keine Überschriften, kein sonstiger Text – nur die Keywords.`,
  ].join('\n')
}
