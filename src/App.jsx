import { useState, useEffect } from 'react'
import ClientSelector from './components/ClientSelector'
import ProductSelector from './components/ProductSelector'
import ProgressTracker from './components/ProgressTracker'
import Sidebar from './components/Sidebar'
import EditorPanel from './components/EditorPanel'
import ImageEditorPanel from './components/ImageEditorPanel'
import { fetchProductData, fetchPromptSheet, fetchImagePrompts, fetchVideoPrompts, fetchProductVariants } from './utils/sheets'
import { buildTitlePrompt, buildBulletsPrompt, buildDescriptionPrompt, buildKeywordsPrompt } from './utils/prompts'
import { parseImageOutput, buildImageUserPrompt } from './utils/imageUtils'
import { parseVideoScenesOutput, parseVideoScene5Output, buildVideoScenesPrompt, buildVideoScene5Prompt } from './utils/videoUtils'
import { SYSTEM_PROMPTS, IMAGE_SYSTEM_PROMPT, USP_SYSTEM_PROMPT, IMAGE_SLOTS, VIDEO_SYSTEM_PROMPT, VIDEO_SCENE5_SYSTEM_PROMPT, VIDEO_SCENE_SINGLE_SYSTEM_PROMPT, VIDEO_SLOTS } from './constants'
import VideoEditorPanel from './components/VideoEditorPanel'
import { callClaude } from './utils/claude'

const PHASE = { CLIENT_SELECT: 'CLIENT_SELECT', PRODUCT_SELECT: 'PRODUCT_SELECT', GENERATING: 'GENERATING', DONE: 'DONE' }

const INITIAL_STEPS = [
  { id: 'sheets',    label: 'Fetching product & prompt data',         status: 'pending', message: '' },
  { id: 'claude_3',  label: 'Generating Title, Bullets & Description', status: 'pending', message: '' },
  { id: 'claude_kw', label: 'Generating Backend Keywords',             status: 'pending', message: '' },
  { id: 'done',      label: 'Concept ready',                           status: 'pending', message: '' },
]

const INITIAL_IMAGE_STEPS = [
  { id: 'fetch_prompts', label: 'Fetching prompts & variants',           status: 'pending', message: '' },
  { id: 'usp1',          label: 'Analyzing product features (Step 1)',   status: 'pending', message: '' },
  { id: 'usp2',          label: 'Analyzing product features (Step 2)',   status: 'pending', message: '' },
  { id: 'concepts',      label: 'Generating 11 image concepts',          status: 'pending', message: '' },
  { id: 'video',         label: 'Generating 5 video scene concepts',     status: 'pending', message: '' },
  { id: 'done',          label: 'All concepts ready',                    status: 'pending', message: '' },
]

const INITIAL_VIDEO_SECTIONS = Array.from({ length: 5 }, () => ({
  input: '', rawOutput: '', parsed: null, parseError: null,
}))

const INITIAL_SECTIONS = {
  title:       { input: '', output: '' },
  bullets:     { input: '', output: '' },
  description: { input: '', output: '' },
  keywords:    { input: '', output: '' },
}

const INITIAL_IMAGE_SECTIONS = Array.from({ length: 11 }, () => ({
  input: '', rawOutput: '', parsed: null, parseError: null,
}))

export default function App() {
  const [phase, setPhase] = useState(PHASE.CLIENT_SELECT)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeSection, setActiveSection] = useState('title')
  const [steps, setSteps] = useState(INITIAL_STEPS.map(s => ({ ...s })))
  const [sections, setSections] = useState(INITIAL_SECTIONS)
  const [error, setError] = useState(null)
  const [conceptStatus, setConceptStatus] = useState('idle')

  // Image generation state
  const [activePanel, setActivePanel]         = useState('text')
  const [activeImageSlot, setActiveImageSlot] = useState(null)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [imageSteps, setImageSteps]           = useState(INITIAL_IMAGE_STEPS.map(s => ({ ...s })))
  const [imageSections, setImageSections]     = useState(INITIAL_IMAGE_SECTIONS)
  const [imageStatus, setImageStatus]         = useState('idle')
  const [productDescription, setProductDescription] = useState('')

  // Video generation state
  const [videoSections, setVideoSections]     = useState(INITIAL_VIDEO_SECTIONS)
  const [activeVideoSlot, setActiveVideoSlot] = useState(null)

  // Per-slot regeneration status
  const [imageRegenStatus, setImageRegenStatus] = useState({})
  const [videoRegenStatus, setVideoRegenStatus] = useState({})

  useEffect(() => {
    if (conceptStatus === 'done' || conceptStatus === 'error') {
      const t = setTimeout(() => setConceptStatus('idle'), 10000)
      return () => clearTimeout(t)
    }
  }, [conceptStatus])

  const updateStep = (id, status, message = '') =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, message } : s))

  const updateImageStep = (id, status, message = '') =>
    setImageSteps(prev => prev.map(s => s.id === id ? { ...s, status, message } : s))

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
      setProductDescription(productData.description)

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
      const keywordsRaw = await callClaude(SYSTEM_PROMPTS.keywords, keywordsUserPrompt)
      const keywordsResult = keywordsRaw.replace(/\s*\(\d+\s*Bytes?\)\s*/gi, '').trim()
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
      setActivePanel('text')
      setPhase(PHASE.DONE)

    } catch (err) {
      setError(err.message)
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', message: err.message } : s))
    }
  }

  const handleCreateImages = () => {
    if (imageGenerating) {
      setActivePanel('imageProgress')
    } else if (imageStatus !== 'done') {
      runImageGeneration()
    }
  }

  const runImageGeneration = async () => {
    setImageGenerating(true)
    setActivePanel('imageProgress')
    setImageSteps(INITIAL_IMAGE_STEPS.map(s => ({ ...s })))

    try {
      // 1. Fetch all prompts and product variants in parallel
      updateImageStep('fetch_prompts', 'running')
      const [imagePromptData, videoPromptData, variants] = await Promise.all([
        fetchImagePrompts(),
        fetchVideoPrompts(),
        fetchProductVariants(selectedClient.clientSheetId, selectedProduct),
      ])
      updateImageStep('fetch_prompts', 'done')

      // 2. USP Step 1 (sequential)
      updateImageStep('usp1', 'running')
      const usp1Output = await callClaude(USP_SYSTEM_PROMPT, `${imagePromptData.usp1Prompt}\n${productDescription}`)
      updateImageStep('usp1', 'done')

      // 3. USP Step 2 (sequential, depends on USP1)
      updateImageStep('usp2', 'running')
      const usp2Output = await callClaude(USP_SYSTEM_PROMPT, `${imagePromptData.usp2Prompt}\n${usp1Output}`)
      updateImageStep('usp2', 'done')

      // 4. 11 parallel image concept calls
      updateImageStep('concepts', 'running')
      const allSheetPrompts = [...imagePromptData.productPrompts, ...imagePromptData.aplusPrompts]
      const results = await Promise.all(
        allSheetPrompts.map(sheetPrompt => {
          const userPrompt = buildImageUserPrompt(sheetPrompt, sections.description.output, usp2Output)
          return callClaude(IMAGE_SYSTEM_PROMPT, userPrompt).then(raw => ({ userPrompt, raw }))
        })
      )
      updateImageStep('concepts', 'done')

      // 5. Parse image outputs
      setImageSections(results.map(({ userPrompt, raw }) => {
        const { data, error } = parseImageOutput(raw)
        return { input: userPrompt, rawOutput: raw, parsed: data, parseError: error }
      }))

      // 6. Video scenes — scenes 1-4 and scene 5 in parallel
      updateImageStep('video', 'running')
      const videoScenesPrompt = buildVideoScenesPrompt(videoPromptData.scenesPrompt, sections.description.output, usp2Output)
      const videoScene5Prompt = buildVideoScene5Prompt(videoPromptData.scene5Prompt, sections.description.output, variants, usp2Output)
      const [rawScenes14, rawScene5] = await Promise.all([
        callClaude(VIDEO_SYSTEM_PROMPT, videoScenesPrompt),
        callClaude(VIDEO_SCENE5_SYSTEM_PROMPT, videoScene5Prompt),
      ])
      updateImageStep('video', 'done')
      updateImageStep('done', 'done')

      // 7. Parse video results
      const { data: scenes14, error: err14 } = parseVideoScenesOutput(rawScenes14)
      const { data: scene5data, error: err5 } = parseVideoScene5Output(rawScene5)
      const allScenes = [
        ...(scenes14 ?? Array(4).fill(null)),
        scene5data,
      ]
      setVideoSections(allScenes.map((parsed, i) => ({
        input:     i < 4 ? videoScenesPrompt : videoScene5Prompt,
        rawOutput: i < 4 ? rawScenes14       : rawScene5,
        parsed,
        parseError: i < 4 ? err14 : err5,
      })))
      setImageStatus('done')

    } catch (err) {
      setImageSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', message: err.message } : s))
      setImageStatus('error')
    } finally {
      setImageGenerating(false)
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
    setConceptStatus('idle')
    setImageSections(INITIAL_IMAGE_SECTIONS)
    setImageSteps(INITIAL_IMAGE_STEPS.map(s => ({ ...s })))
    setImageStatus('idle')
    setImageGenerating(false)
    setActivePanel('text')
    setActiveImageSlot(null)
    setProductDescription('')
    setVideoSections(INITIAL_VIDEO_SECTIONS)
    setActiveVideoSlot(null)
    setImageRegenStatus({})
    setVideoRegenStatus({})
    setPhase(PHASE.CLIENT_SELECT)
  }

  const handleCreateConcept = async () => {
    setConceptStatus('loading')
    try {
      const res = await fetch('https://hook.eu1.make.com/jjr7dru5kpneiucti9v9d7fc1wizkkiu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client:      selectedClient?.name ?? '',
          identifier:  Number(selectedClient?.identifier),
          drive_url:   selectedClient?.driveFolderUrl ?? '',
          sheet_id:    selectedClient?.clientSheetId ?? '',
          product:     selectedProduct,
          title:       sections.title.output,
          bullets:     sections.bullets.output,
          description: sections.description.output,
          keywords:    sections.keywords.output,
        }),
      })
      if (!res.ok) throw new Error(`Webhook error ${res.status}`)
      setConceptStatus('done')
    } catch (err) {
      setConceptStatus('error')
      setError(`Create concept failed: ${err.message}`)
    }
  }

  const handleRegenerateImage = async (slotIndex) => {
    setImageRegenStatus(prev => ({ ...prev, [slotIndex]: 'loading' }))
    try {
      const raw = await callClaude(IMAGE_SYSTEM_PROMPT, imageSections[slotIndex].input)
      const { data, error } = parseImageOutput(raw)
      setImageSections(prev => {
        const updated = [...prev]
        updated[slotIndex] = { ...updated[slotIndex], rawOutput: raw, parsed: data, parseError: error }
        return updated
      })
      setImageRegenStatus(prev => ({ ...prev, [slotIndex]: 'done' }))
    } catch {
      setImageRegenStatus(prev => ({ ...prev, [slotIndex]: null }))
    }
  }

  const handleRegenerateVideo = async (slotIndex) => {
    setVideoRegenStatus(prev => ({ ...prev, [slotIndex]: 'loading' }))
    try {
      const sysPrompt = slotIndex === 4 ? VIDEO_SCENE5_SYSTEM_PROMPT : VIDEO_SCENE_SINGLE_SYSTEM_PROMPT
      const raw = await callClaude(sysPrompt, videoSections[slotIndex].input)
      const { data, error } = parseVideoScene5Output(raw)
      setVideoSections(prev => {
        const updated = [...prev]
        updated[slotIndex] = { ...updated[slotIndex], rawOutput: raw, parsed: data, parseError: error }
        return updated
      })
      setVideoRegenStatus(prev => ({ ...prev, [slotIndex]: 'done' }))
    } catch {
      setVideoRegenStatus(prev => ({ ...prev, [slotIndex]: null }))
    }
  }

  const handleSectionChange = sectionId => {
    setActivePanel('text')
    setActiveSection(sectionId)
  }

  const handleImageSlotChange = index => {
    setActivePanel('image')
    setActiveImageSlot(index)
  }

  const handleVideoSlotChange = index => {
    setActivePanel('video')
    setActiveVideoSlot(index)
  }

  const handleSectionTextChange = (field, text) =>
    setSections(prev => ({ ...prev, [activeSection]: { ...prev[activeSection], [field]: text } }))

  const handleImageSectionChange = (slotIndex, field, subfield, value) => {
    setImageSections(prev => {
      const updated = [...prev]
      const slot = { ...updated[slotIndex] }
      if (field === 'input') {
        slot.input = value
      } else if (subfield) {
        slot.parsed = { ...slot.parsed, [field]: { ...slot.parsed[field], [subfield]: value } }
      } else {
        slot.parsed = { ...slot.parsed, [field]: value }
      }
      updated[slotIndex] = slot
      return updated
    })
  }

  const handleVideoSectionChange = (slotIndex, field, subfield, value) => {
    setVideoSections(prev => {
      const updated = [...prev]
      const slot = { ...updated[slotIndex] }
      if (field === 'input') {
        slot.input = value
      } else if (subfield) {
        slot.parsed = { ...slot.parsed, [field]: { ...slot.parsed[field], [subfield]: value } }
      } else {
        slot.parsed = { ...slot.parsed, [field]: value }
      }
      updated[slotIndex] = slot
      return updated
    })
  }

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
              onSectionChange={handleSectionChange}
              onNewConcept={handleNewConcept}
              onCreateConcept={handleCreateConcept}
              generationDone={phase === PHASE.DONE}
              sections={sections}
              conceptStatus={conceptStatus}
              imageGenerating={imageGenerating}
              imageStatus={imageStatus}
              imageSections={imageSections}
              activePanel={activePanel}
              activeImageSlot={activeImageSlot}
              onCreateImages={handleCreateImages}
              onImageSlotChange={handleImageSlotChange}
              videoSections={videoSections}
              activeVideoSlot={activeVideoSlot}
              onVideoSlotChange={handleVideoSlotChange}
              imageRegenStatus={imageRegenStatus}
              videoRegenStatus={videoRegenStatus}
            />
          </aside>

          <main className="flex-1 h-full overflow-y-auto">
            {phase === PHASE.GENERATING ? (
              <ProgressTracker steps={steps} error={error} title="Generating your concept" />
            ) : activePanel === 'imageProgress' ? (
              <ProgressTracker steps={imageSteps} error={null} title="Generating image concepts" />
            ) : activePanel === 'image' && activeImageSlot !== null ? (
              <ImageEditorPanel
                slotLabel={IMAGE_SLOTS[activeImageSlot].label}
                data={imageSections[activeImageSlot]}
                onChange={(field, subfield, value) => handleImageSectionChange(activeImageSlot, field, subfield, value)}
                regenStatus={imageRegenStatus[activeImageSlot] ?? null}
                onRegenerate={() => handleRegenerateImage(activeImageSlot)}
              />
            ) : activePanel === 'video' && activeVideoSlot !== null && videoSections[activeVideoSlot] ? (
              <VideoEditorPanel
                slotLabel={VIDEO_SLOTS[activeVideoSlot].label}
                data={videoSections[activeVideoSlot]}
                onChange={(field, subfield, value) => handleVideoSectionChange(activeVideoSlot, field, subfield, value)}
                regenStatus={videoRegenStatus[activeVideoSlot] ?? null}
                onRegenerate={() => handleRegenerateVideo(activeVideoSlot)}
              />
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
