import { useState } from 'react'
import ClientSelector from './components/ClientSelector'
import ProductSelector from './components/ProductSelector'
import ProgressTracker from './components/ProgressTracker'
import Sidebar from './components/Sidebar'
import EditorPanel from './components/EditorPanel'
import { fetchProductData, fetchPromptSheet } from './utils/sheets'
import { buildTitlePrompt, buildBulletsPrompt, buildDescriptionPrompt, buildKeywordsPrompt } from './utils/prompts'
import { SYSTEM_PROMPTS } from './constants'

const PHASE = { CLIENT_SELECT: 'CLIENT_SELECT', PRODUCT_SELECT: 'PRODUCT_SELECT', GENERATING: 'GENERATING', DONE: 'DONE' }

const INITIAL_STEPS = [
  { id: 'sheets',    label: 'Fetching product & prompt data',         status: 'pending', message: '' },
  { id: 'claude_3',  label: 'Generating Title, Bullets & Description', status: 'pending', message: '' },
  { id: 'claude_kw', label: 'Generating Backend Keywords',             status: 'pending', message: '' },
  { id: 'done',      label: 'Concept ready',                           status: 'pending', message: '' },
]

const INITIAL_SECTIONS = {
  title:       { input: '', output: '' },
  bullets:     { input: '', output: '' },
  description: { input: '', output: '' },
  keywords:    { input: '', output: '' },
}

export default function App() {
  const [phase, setPhase] = useState(PHASE.CLIENT_SELECT)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeSection, setActiveSection] = useState('title')
  const [steps, setSteps] = useState(INITIAL_STEPS.map(s => ({ ...s })))
  const [sections, setSections] = useState(INITIAL_SECTIONS)
  const [error, setError] = useState(null)

  const updateStep = (id, status, message = '') =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, message } : s))

  const callClaude = async (systemPrompt, userPrompt) => {
    const res = await fetch('/api/claude-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Claude API error ${res.status}`)
    }
    const data = await res.json()
    return data.text
  }

  const runGeneration = async (client, productTab) => {
    setPhase(PHASE.GENERATING)
    setSteps(INITIAL_STEPS.map(s => ({ ...s })))
    setError(null)

    try {
      // 1. Fetch sheets in parallel
      updateStep('sheets', 'running')
      const [productData, promptData] = await Promise.all([
        fetchProductData(client.clientSheetId, productTab),
        fetchPromptSheet(),
      ])
      updateStep('sheets', 'done')

      // 2. Build the three user prompts
      const sharedArgs = {
        productName: productData.productName,
        description: productData.description,
        usp:         productData.usp,
      }
      const titleUserPrompt       = buildTitlePrompt({ ...sharedArgs, titlePromptInstruction:       promptData.titlePrompt })
      const bulletsUserPrompt     = buildBulletsPrompt({ ...sharedArgs, bulletsPromptInstruction:     promptData.bulletsPrompt })
      const descriptionUserPrompt = buildDescriptionPrompt({ ...sharedArgs, descriptionPromptInstruction: promptData.descriptionPrompt })

      // 3. Three parallel Claude calls
      updateStep('claude_3', 'running')
      const [titleResult, bulletsResult, descriptionResult] = await Promise.all([
        callClaude(SYSTEM_PROMPTS.title,       titleUserPrompt),
        callClaude(SYSTEM_PROMPTS.bullets,     bulletsUserPrompt),
        callClaude(SYSTEM_PROMPTS.description, descriptionUserPrompt),
      ])
      updateStep('claude_3', 'done')

      // 4. Sequential keywords call (needs the other three outputs)
      updateStep('claude_kw', 'running')
      const keywordsUserPrompt = buildKeywordsPrompt({
        keywordsPromptInstruction: promptData.keywordsPrompt,
        titleResult,
        bulletsResult,
        descriptionResult,
      })
      const keywordsResult = await callClaude(SYSTEM_PROMPTS.keywords, keywordsUserPrompt)
      updateStep('claude_kw', 'done')
      updateStep('done', 'done')

      // 5. Populate sections and show the editor
      setSections({
        title:       { input: titleUserPrompt,       output: titleResult },
        bullets:     { input: bulletsUserPrompt,     output: bulletsResult },
        description: { input: descriptionUserPrompt, output: descriptionResult },
        keywords:    { input: keywordsUserPrompt,    output: keywordsResult },
      })
      setActiveSection('title')
      setPhase(PHASE.DONE)

    } catch (err) {
      setError(err.message)
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', message: err.message } : s))
    }
  }

  const handleClientSelect = client => {
    setSelectedClient(client)
    setPhase(PHASE.PRODUCT_SELECT)
  }

  const handleProductSelect = tabName => {
    setSelectedProduct(tabName)
    runGeneration(selectedClient, tabName)
  }

  const handleNewConcept = () => {
    setSelectedClient(null)
    setSelectedProduct(null)
    setSections(INITIAL_SECTIONS)
    setSteps(INITIAL_STEPS.map(s => ({ ...s })))
    setError(null)
    setPhase(PHASE.CLIENT_SELECT)
  }

  const handleSectionTextChange = (field, text) =>
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], [field]: text } }))

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Client selection modal */}
      {phase === PHASE.CLIENT_SELECT && (
        <ClientSelector onSelect={handleClientSelect} />
      )}

      {/* Product selection modal */}
      {phase === PHASE.PRODUCT_SELECT && (
        <ProductSelector
          clientSheetId={selectedClient?.clientSheetId}
          clientName={selectedClient?.name}
          onSelect={handleProductSelect}
          onBack={() => setPhase(PHASE.CLIENT_SELECT)}
        />
      )}

      {/* Main split layout — visible during generation and after */}
      {(phase === PHASE.GENERATING || phase === PHASE.DONE) && (
        <>
          <aside className="w-60 flex-shrink-0 h-full border-r border-gray-200 bg-gray-50">
            <Sidebar
              clientName={selectedClient?.name}
              productName={selectedProduct}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onNewConcept={handleNewConcept}
              generationDone={phase === PHASE.DONE}
              sections={sections}
            />
          </aside>

          <main className="flex-1 h-full overflow-y-auto">
            {phase === PHASE.GENERATING ? (
              <ProgressTracker steps={steps} error={error} />
            ) : (
              <EditorPanel
                section={activeSection}
                inputText={sections[activeSection].input}
                outputText={sections[activeSection].output}
                onInputChange={text => handleSectionTextChange('input', text)}
                onOutputChange={text => handleSectionTextChange('output', text)}
              />
            )}
          </main>
        </>
      )}
    </div>
  )
}
