export function buildTitlePrompt({ titlePromptInstruction, productName, description, usp, reviewsText }) {
  return [
    `- ${titlePromptInstruction}`,
    `- Hier findest du die Infos zum dem Produkt um das es geht: Produktname: ${productName}, Beschreibung des Produktes: ${description}, Alleinstellungsmerkmale: ${usp}`,
    `- Dies sind Rezensionen von Konkurrenzprodukten. Analysieren Sie diese und identifizieren Sie die häufigsten Kritikpunkte. Nutzen Sie diese wiederkehrenden Punkte, um Probleme aufzuzeigen, die bei unserem Produkt nicht auftreten – jedoch nur, wenn dies anhand der von mir bereitgestellten Produktinformationen faktisch korrekt ist. Erfinden Sie keine Vorteile oder Funktionen.\nHier sind die Rezensionen der Konkurrenzprodukte:\n${reviewsText}`,
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

export function buildDescriptionPrompt({ descriptionPromptInstruction, productName, description, usp, reviewsText }) {
  return [
    `- ${descriptionPromptInstruction}`,
    `- Hier findest du die Infos zum dem Produkt um das es geht: Produktname: ${productName}, Beschreibung des Produktes: ${description}, Alleinstellungsmerkmale: ${usp}`,
    `- Nutze die folgenden Rezensionen eines Mitbewerberprodukts, um relevante Kundenbedürfnisse und Kritikpunkte zu identifizieren.\n  1. Analyse\n  - Ermittele, welche Eigenschaften des Mitbewerberprodukts häufig gelobt werden.\n  - Ermittele, welche Punkte häufig kritisiert werden.\n  2. Umsetzung in der Produktbeschreibung\n  - Nutze diese Erkenntnisse für die Beschreibung unseres Produkts.\n  - Verwende ausschließlich echte Eigenschaften und Spezifikationen unseres Produkts (keine erfundenen Vorteile oder Funktionen).\n  - Hebe gezielt die Stärken hervor, die für Kunden wichtig sind.\n  - Zeige, wo unser Produkt mögliche Schwächen des Mitbewerbers ausgleicht (nur wenn dies tatsächlich zutrifft).\n  3. Ziel\n  - Schreibe eine Beschreibung, die die wichtigsten Kundenbedürfnisse anspricht.\n  - Baue Vertrauen auf, indem du konkret auf Wünsche und Bedenken der Kunden eingehst.`,
    `- Hier folgen die Rezensionen:\n${reviewsText}`,
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
  ].join('\n')
}
