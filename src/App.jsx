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
import { SYSTEM_PROMPTS, IMAGE_SYSTEM_PROMPT, USP_SYSTEM_PROMPT, IMAGE_SLOTS, VIDEO_SYSTEM_PROMPT, VIDEO_SCENE5_SYSTEM_PROMPT, VIDEO_SCENE_SINGLE_SYSTEM_PROMPT, VIDEO_SLOTS, VARIANT_LISTING_SYSTEM_PROMPT, VARIANT_IMAGE_SYSTEM_PROMPT } from './constants'
import VideoEditorPanel from './components/VideoEditorPanel'
import VariantsModal from './components/VariantsModal'
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
  const [conceptCreationStatus, setConceptCreationStatus] = useState('idle')
  const [variants, setVariants] = useState([])
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [variantStatus, setVariantStatus] = useState('idle')
  const [variantProgress, setVariantProgress] = useState('')

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
  const [textRegenStatus, setTextRegenStatus]   = useState({})

  useEffect(() => {
    if (conceptStatus === 'done' || conceptStatus === 'error') {
      const t = setTimeout(() => setConceptStatus('idle'), 10000)
      return () => clearTimeout(t)
    }
  }, [conceptStatus])

  useEffect(() => {
    if (conceptCreationStatus === 'done' || conceptCreationStatus === 'error') {
      const t = setTimeout(() => setConceptCreationStatus('idle'), 10000)
      return () => clearTimeout(t)
    }
  }, [conceptCreationStatus])

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
      const [imagePromptData, videoPromptData, variantData] = await Promise.all([
        fetchImagePrompts(),
        fetchVideoPrompts(),
        fetchProductVariants(selectedClient.clientSheetId, selectedProduct),
      ])
      setVariants(variantData)
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
      const videoScene5Prompt = buildVideoScene5Prompt(videoPromptData.scene5Prompt, sections.description.output, variantData.map(v => v.name), usp2Output)
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
    setTextRegenStatus({})
    setConceptCreationStatus('idle')
    setVariants([])
    setShowVariantsModal(false)
    setVariantStatus('idle')
    setVariantProgress('')
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
          variation:   'base',
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

  const handleConceptCreation = async () => {
    if (conceptCreationStatus === 'loading') return
    setConceptCreationStatus('loading')
    try {
      const payload = {
        client:     selectedClient?.name ?? '',
        identifier: selectedClient?.identifier ?? '',
        drive_url:  selectedClient?.driveFolderUrl ?? '',
        sheet_id:   selectedClient?.clientSheetId ?? '',
        product:    selectedProduct,
        variation:  'base',
        images: IMAGE_SLOTS.map((slot, i) => {
          const s = imageSections[i] ?? {}
          const p = s.parsed ?? {}
          return {
            id:               slot.id,
            label:            slot.label,
            group:            slot.group,
            text:             p.text ?? '',
            imageDescription: p.imageDescription ?? '',
            realPhoto: {
              needed:      p.realPhoto?.needed ?? '',
              description: p.realPhoto?.description ?? '',
              person:      p.realPhoto?.person ?? '',
              location:    p.realPhoto?.location ?? '',
            },
            rendering3d: {
              needed:      p.rendering3d?.needed ?? '',
              description: p.rendering3d?.description ?? '',
              person:      p.rendering3d?.person ?? '',
              location:    p.rendering3d?.location ?? '',
            },
          }
        }),
        videos: VIDEO_SLOTS.map((slot, i) => {
          const s = videoSections[i] ?? {}
          const p = s.parsed ?? {}
          return {
            id:               slot.id,
            label:            slot.label,
            text:             p.text ?? '',
            imageDescription: p.imageDescription ?? '',
            realVideo: {
              description: p.realVideo?.description ?? '',
              person:      p.realVideo?.person ?? '',
              location:    p.realVideo?.location ?? '',
            },
            rendering3d: {
              needed:      p.rendering3d?.needed ?? '',
              description: p.rendering3d?.description ?? '',
              person:      p.rendering3d?.person ?? '',
              location:    p.rendering3d?.location ?? '',
            },
          }
        }),
      }
      const res = await fetch('https://hook.eu1.make.com/4a4tid8i1vianrffyo7fcchh14rrs367', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Webhook error ${res.status}`)
      setConceptCreationStatus('done')
    } catch {
      setConceptCreationStatus('error')
    }
  }

  const handleGenerateVariants = async (selectedVariants) => {
    setVariantStatus('generating')
    try {
      for (let i = 0; i < selectedVariants.length; i++) {
        const v = selectedVariants[i]
        const variantCtx = `Variant name: ${v.name}\nVariant specification: ${v.spec}`

        setVariantProgress(`Variant ${i + 1}/${selectedVariants.length}: generating listing…`)
        const [titleVar, bulletsVar, descVar] = await Promise.all([
          callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sections.title.output}\n\n${variantCtx}`),
          callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sections.bullets.output}\n\n${variantCtx}`),
          callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sections.description.output}\n\n${variantCtx}`),
        ])
        const kwVar = await callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sections.keywords.output}\n\n${variantCtx}`)

        setVariantProgress(`Variant ${i + 1}/${selectedVariants.length}: generating images…`)
        const imageVarResults = await Promise.all(
          imageSections.map(sec =>
            callClaude(VARIANT_IMAGE_SYSTEM_PROMPT, `Original concept (JSON):\n${sec.rawOutput}\n\n${variantCtx}`)
              .then(raw => parseImageOutput(raw))
          )
        )

        setVariantProgress(`Variant ${i + 1}/${selectedVariants.length}: sending listing…`)
        await fetch('https://hook.eu1.make.com/jjr7dru5kpneiucti9v9d7fc1wizkkiu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client:      selectedClient?.name ?? '',
            identifier:  Number(selectedClient?.identifier),
            drive_url:   selectedClient?.driveFolderUrl ?? '',
            sheet_id:    selectedClient?.clientSheetId ?? '',
            product:     selectedProduct,
            variation:   v.number,
            title:       titleVar,
            bullets:     bulletsVar,
            description: descVar,
            keywords:    kwVar,
          }),
        })

        await new Promise(r => setTimeout(r, 15000))

        setVariantProgress(`Variant ${i + 1}/${selectedVariants.length}: sending visuals…`)
        await fetch('https://hook.eu1.make.com/4a4tid8i1vianrffyo7fcchh14rrs367', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client:     selectedClient?.name ?? '',
            identifier: selectedClient?.identifier ?? '',
            drive_url:  selectedClient?.driveFolderUrl ?? '',
            sheet_id:   selectedClient?.clientSheetId ?? '',
            product:    selectedProduct,
            variation:  v.number,
            images: IMAGE_SLOTS.map((slot, idx) => {
              const p = imageVarResults[idx]?.data ?? {}
              return {
                id: slot.id, label: slot.label, group: slot.group,
                text:             p.text ?? '',
                imageDescription: p.imageDescription ?? '',
                realPhoto:   { needed: p.realPhoto?.needed ?? '', description: p.realPhoto?.description ?? '', person: p.realPhoto?.person ?? '', location: p.realPhoto?.location ?? '' },
                rendering3d: { needed: p.rendering3d?.needed ?? '', description: p.rendering3d?.description ?? '', person: p.rendering3d?.person ?? '', location: p.rendering3d?.location ?? '' },
              }
            }),
            videos: VIDEO_SLOTS.map((slot, idx) => {
              const p = videoSections[idx]?.parsed ?? {}
              return {
                id: slot.id, label: slot.label,
                text:             p.text ?? '',
                imageDescription: p.imageDescription ?? '',
                realVideo:   { description: p.realVideo?.description ?? '', person: p.realVideo?.person ?? '', location: p.realVideo?.location ?? '' },
                rendering3d: { needed: p.rendering3d?.needed ?? '', description: p.rendering3d?.description ?? '', person: p.rendering3d?.person ?? '', location: p.rendering3d?.location ?? '' },
              }
            }),
          }),
        })

        if (i < selectedVariants.length - 1) {
          setVariantProgress(`Waiting 15s before next variant…`)
          await new Promise(r => setTimeout(r, 15000))
        }
      }
      setVariantStatus('done')
      setVariantProgress('All variants generated and sent.')
    } catch (err) {
      setVariantStatus('error')
      setVariantProgress(`Error: ${err.message}`)
    }
  }

  const handleRegenerateText = async (sectionId) => {
    setTextRegenStatus(prev => ({ ...prev, [sectionId]: 'loading' }))
    try {
      const raw = await callClaude(SYSTEM_PROMPTS[sectionId], sections[sectionId].input)
      const output = sectionId === 'keywords'
        ? raw.replace(/\s*\(\d+\s*Bytes?\)\s*/gi, '').trim()
        : raw
      setSections(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], output } }))
      setTextRegenStatus(prev => ({ ...prev, [sectionId]: 'done' }))
    } catch {
      setTextRegenStatus(prev => ({ ...prev, [sectionId]: null }))
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
    if (textRegenStatus[sectionId] === 'done') {
      setTextRegenStatus(prev => ({ ...prev, [sectionId]: null }))
    }
  }

  const handleImageSlotChange = index => {
    setActivePanel('image')
    setActiveImageSlot(index)
    if (imageRegenStatus[index] === 'done') {
      setImageRegenStatus(prev => ({ ...prev, [index]: null }))
    }
  }

  const handleVideoSlotChange = index => {
    setActivePanel('video')
    setActiveVideoSlot(index)
    if (videoRegenStatus[index] === 'done') {
      setVideoRegenStatus(prev => ({ ...prev, [index]: null }))
    }
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
    <div className="h-screen flex flex-col bg-white overflow-hidden">
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
          {/* Top header bar */}
          <header className="flex-shrink-0 h-12 border-b border-gray-200 bg-white flex items-center px-5 gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Listing Builder</span>
            </div>
            {selectedClient?.name && (
              <>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 flex-shrink-0">Client</span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{selectedClient.name}</span>
                </div>
              </>
            )}
            {selectedProduct && (
              <>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 flex-shrink-0">Product</span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{selectedProduct}</span>
                </div>
              </>
            )}
            {phase === PHASE.DONE && (
              <>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <button
                  onClick={() => setShowVariantsModal(true)}
                  disabled={imageStatus !== 'done'}
                  className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    imageStatus !== 'done'
                      ? 'bg-blue-500 text-white opacity-50 cursor-not-allowed'
                      : variantStatus === 'generating'
                      ? 'bg-blue-500 text-white cursor-wait'
                      : variantStatus === 'done'
                      ? 'bg-blue-600 text-white opacity-75 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {variantStatus === 'generating' && (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {variantStatus === 'done' ? 'Variants Created ✓' : 'Create Variants'}
                </button>
              </>
            )}
          </header>

          {/* Sidebar + main */}
          <div className="flex-1 flex overflow-hidden">
          <aside className="w-60 flex-shrink-0 h-full border-r border-gray-200 bg-gray-50">
            <Sidebar
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
              textRegenStatus={textRegenStatus}
              conceptCreationStatus={conceptCreationStatus}
              onConceptCreation={handleConceptCreation}
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
                regenStatus={textRegenStatus[activeSection] ?? null}
                onRegenerate={() => handleRegenerateText(activeSection)}
              />
            )}
          </main>
          </div>

          {showVariantsModal && (
            <VariantsModal
              variants={variants}
              status={variantStatus}
              progress={variantProgress}
              onClose={() => setShowVariantsModal(false)}
              onGenerate={handleGenerateVariants}
            />
          )}
        </>
      )}
    </div>
  )
}
