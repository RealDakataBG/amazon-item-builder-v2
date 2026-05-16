import { useState, useEffect } from 'react'
import ClientSelector from './components/ClientSelector'
import ProductSelector from './components/ProductSelector'
import ProgressTracker from './components/ProgressTracker'
import Sidebar from './components/Sidebar'
import EditorPanel from './components/EditorPanel'
import ImageEditorPanel from './components/ImageEditorPanel'
import { fetchProductData, fetchPromptSheet, fetchImagePrompts, fetchVideoPrompts, fetchProductVariants, extractSheetId, fetchListingConcept, fetchVisualsConcept } from './utils/sheets'
import { buildTitlePrompt, buildBulletsPrompt, buildDescriptionPrompt, buildKeywordsPrompt } from './utils/prompts'
import { parseImageOutput, buildImageUserPrompt } from './utils/imageUtils'
import { parseVideoScenesOutput, parseVideoScene5Output, buildVideoScenesPrompt, buildVideoScene5Prompt } from './utils/videoUtils'
import { SYSTEM_PROMPTS, IMAGE_SYSTEM_PROMPT, USP_SYSTEM_PROMPT, IMAGE_SLOTS, VIDEO_SYSTEM_PROMPT, VIDEO_SCENE5_SYSTEM_PROMPT, VIDEO_SCENE_SINGLE_SYSTEM_PROMPT, VIDEO_SLOTS, VARIANT_LISTING_SYSTEM_PROMPT, VARIANT_IMAGE_SYSTEM_PROMPT } from './constants'
import VideoEditorPanel from './components/VideoEditorPanel'
import VariantsModal from './components/VariantsModal'
import ConceptResultModal from './components/ConceptResultModal'
import LandingScreen from './components/LandingScreen'
import SheetUrlInputModal from './components/SheetUrlInputModal'
import ShotlistUrlInputModal from './components/ShotlistUrlInputModal'
import { callClaude } from './utils/claude'

const PHASE = { LANDING: 'LANDING', CLIENT_SELECT: 'CLIENT_SELECT', PRODUCT_SELECT: 'PRODUCT_SELECT', GENERATING: 'GENERATING', DONE: 'DONE' }

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
  const [phase, setPhase] = useState(PHASE.LANDING)
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
  const [variantSteps, setVariantSteps] = useState([])
  const [variantResults, setVariantResults] = useState([])
  const [listingModal, setListingModal] = useState({ open: false, status: 'idle', results: [], errorMsg: null })
  const [visualsModal, setVisualsModal] = useState({ open: false, status: 'idle', results: [], errorMsg: null })
  const [generatedVariants, setGeneratedVariants] = useState([])
  const [shotlistStatus, setShotlistStatus] = useState('idle')
  const [shotlistResults, setShotlistResults] = useState([])
  const [showShotlistResults, setShowShotlistResults] = useState(false)
  const [showVariantResults, setShowVariantResults] = useState(false)

  // Standalone variants flow state
  const [flow, setFlow] = useState('none')
  const [showUrlInputModal, setShowUrlInputModal] = useState(false)
  const [standaloneListingUrl, setStandaloneListingUrl] = useState('')
  const [standaloneVisualsUrl, setStandaloneVisualsUrl] = useState('')
  const [urlInputLoading, setUrlInputLoading] = useState(false)
  const [urlInputError, setUrlInputError] = useState(null)
  const [selectedStandaloneVariants, setSelectedStandaloneVariants] = useState([])

  // Standalone shotlist flow state
  const [showShotlistUrlModal, setShowShotlistUrlModal]   = useState(false)
  const [shotlistRows, setShotlistRows]                   = useState([{ url: '', isBase: false }])
  const [shotlistSendStatus, setShotlistSendStatus]       = useState('idle')
  const [shotlistSendResults, setShotlistSendResults]     = useState([])
  const [shotlistSendProgress, setShotlistSendProgress]   = useState(0)
  const [shotlistSendError, setShotlistSendError]         = useState(null)

  // Image generation state
  const [activePanel, setActivePanel]         = useState('text')
  const [activeImageSlot, setActiveImageSlot] = useState(null)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [imageSteps, setImageSteps]           = useState(INITIAL_IMAGE_STEPS.map(s => ({ ...s })))
  const [imageSections, setImageSections]     = useState(INITIAL_IMAGE_SECTIONS)
  const [imageStatus, setImageStatus]         = useState('idle')
  const [productDescription, setProductDescription] = useState('')
  const [productSpec, setProductSpec]               = useState('')

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

  useEffect(() => {
    if (shotlistStatus === 'done' || shotlistStatus === 'error') {
      const t = setTimeout(() => setShotlistStatus('idle'), 10000)
      return () => clearTimeout(t)
    }
  }, [shotlistStatus])

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
      setProductSpec(productData.spec)

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
    if (flow === 'standaloneVariants') {
      fetchProductVariants(selectedClient.clientSheetId, tabName)
        .then(variantData => {
          setVariants(variantData)
          setPhase(PHASE.DONE)
          setShowVariantsModal(true)
        })
    } else if (flow === 'standaloneShotlist') {
      fetchProductData(selectedClient.clientSheetId, tabName)
        .then(data => {
          setProductSpec(data.spec)
          setPhase(PHASE.DONE)
          setShowShotlistUrlModal(true)
        })
    } else {
      runGeneration(selectedClient, tabName)
    }
  }

  const handleLandingNewConcept = () => { setFlow('newConcept'); setPhase(PHASE.CLIENT_SELECT) }
  const handleLandingVariants   = () => { setFlow('standaloneVariants'); setPhase(PHASE.CLIENT_SELECT) }
  const handleLandingShotlist   = () => { setFlow('standaloneShotlist'); setPhase(PHASE.CLIENT_SELECT) }

  const handleStandaloneVariantGenerate = async (selectedVariants) => {
    setUrlInputLoading(true)
    setUrlInputError(null)
    try {
      const listingId = extractSheetId(standaloneListingUrl)
      const visualsId = extractSheetId(standaloneVisualsUrl)
      if (!listingId) throw new Error('Invalid listing sheet URL')
      if (!visualsId) throw new Error('Invalid visuals sheet URL')

      const [listingData, visualsData] = await Promise.all([
        fetchListingConcept(listingId),
        fetchVisualsConcept(visualsId),
      ])

      const baseData = {
        sections: {
          title:       { input: '', output: listingData.title },
          bullets:     { input: '', output: listingData.bullets },
          description: { input: '', output: listingData.description },
          keywords:    { input: '', output: listingData.keywords },
        },
        imageSections: visualsData.images,
        videoSections: visualsData.videos,
      }

      setShowUrlInputModal(false)
      setVariantSteps([])
      setVariantResults([])
      setVariantStatus('idle')
      setShowVariantsModal(true)
      await handleGenerateVariants(selectedVariants, baseData)
    } catch (err) {
      setUrlInputError(err.message)
    } finally {
      setUrlInputLoading(false)
    }
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
    setProductSpec('')
    setVideoSections(INITIAL_VIDEO_SECTIONS)
    setActiveVideoSlot(null)
    setImageRegenStatus({})
    setVideoRegenStatus({})
    setTextRegenStatus({})
    setConceptCreationStatus('idle')
    setVariants([])
    setShowVariantsModal(false)
    setVariantStatus('idle')
    setVariantSteps([])
    setVariantResults([])
    setListingModal({ open: false, status: 'idle', results: [], errorMsg: null })
    setVisualsModal({ open: false, status: 'idle', results: [], errorMsg: null })
    setGeneratedVariants([])
    setShotlistStatus('idle')
    setShotlistResults([])
    setShowShotlistResults(false)
    setShowVariantResults(false)
    setFlow('none')
    setShowUrlInputModal(false)
    setStandaloneListingUrl('')
    setStandaloneVisualsUrl('')
    setUrlInputLoading(false)
    setUrlInputError(null)
    setSelectedStandaloneVariants([])
    setShowShotlistUrlModal(false)
    setShotlistRows([{ url: '', isBase: false }])
    setShotlistSendStatus('idle')
    setShotlistSendResults([])
    setShotlistSendProgress(0)
    setShotlistSendError(null)
    setPhase(PHASE.LANDING)
  }

  const handleCreateConcept = async () => {
    if (conceptStatus === 'done') {
      setListingModal(prev => ({ ...prev, open: true }))
      return
    }
    setConceptStatus('loading')
    setListingModal({ open: true, status: 'loading', results: [], errorMsg: null })
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
      const data = await res.json().catch(() => ({}))
      setConceptStatus('done')
      setListingModal({ open: true, status: 'done', errorMsg: null, results: [{ label: 'Base', driveUrl: data.drive_url ?? null, sheetUrl: data.sheet_url ?? null }] })
    } catch (err) {
      setConceptStatus('error')
      setListingModal({ open: true, status: 'error', results: [], errorMsg: err.message })
    }
  }

  const handleConceptCreation = async () => {
    if (conceptCreationStatus === 'done') {
      setVisualsModal(prev => ({ ...prev, open: true }))
      return
    }
    if (conceptCreationStatus === 'loading') return
    setConceptCreationStatus('loading')
    setVisualsModal({ open: true, status: 'loading', results: [], errorMsg: null })
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
      const data = await res.json().catch(() => ({}))
      setConceptCreationStatus('done')
      setVisualsModal({ open: true, status: 'done', errorMsg: null, results: [{ label: 'Base', driveUrl: data.drive_url ?? null, sheetUrl: data.sheet_url ?? null }] })
    } catch (err) {
      setConceptCreationStatus('error')
      setVisualsModal({ open: true, status: 'error', results: [], errorMsg: err.message })
    }
  }

  const handleGenerateVariants = async (selectedVariants, baseData = null) => {
    const sectionsRef      = baseData?.sections      ?? sections
    const imageSectionsRef = baseData?.imageSections ?? imageSections
    const videoSectionsRef = baseData?.videoSections ?? videoSections

    const upd = (id, status) =>
      setVariantSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s))

    // Build the full step list upfront
    const initialSteps = []
    selectedVariants.forEach((v, i) => {
      const label = `${v.name}`
      initialSteps.push({ id: `v${i}_listing`,      label: `${label} → Generate listing text`,  status: 'pending' })
      initialSteps.push({ id: `v${i}_images`,        label: `${label} → Generate image concepts`, status: 'pending' })
      initialSteps.push({ id: `v${i}_send_listing`,  label: `${label} → Send listing`,            status: 'pending' })
      initialSteps.push({ id: `v${i}_send_visuals`,  label: `${label} → Send visuals`,            status: 'pending' })
      if (i < selectedVariants.length - 1) {
        initialSteps.push({ id: `wait_${i}`, label: 'Generating concept sheet…', status: 'pending' })
      }
    })
    setVariantSteps(initialSteps)
    setVariantStatus('generating')

    try {
      for (let i = 0; i < selectedVariants.length; i++) {
        const v = selectedVariants[i]
        const variantCtx = `Variant name: ${v.name}\nVariant specification: ${v.spec}`

        upd(`v${i}_listing`, 'running')
        const [titleVar, bulletsVar, descVar] = await Promise.all([
          callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sectionsRef.title.output}\n\n${variantCtx}`),
          callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sectionsRef.bullets.output}\n\n${variantCtx}`),
          callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sectionsRef.description.output}\n\n${variantCtx}`),
        ])
        const kwVar = await callClaude(VARIANT_LISTING_SYSTEM_PROMPT, `Original:\n${sectionsRef.keywords.output}\n\n${variantCtx}`)
        upd(`v${i}_listing`, 'done')

        upd(`v${i}_images`, 'running')
        const imageVarResults = await Promise.all(
          imageSectionsRef.map(sec =>
            callClaude(VARIANT_IMAGE_SYSTEM_PROMPT, `Original concept (JSON):\n${sec.rawOutput}\n\n${variantCtx}`)
              .then(raw => parseImageOutput(raw))
          )
        )
        upd(`v${i}_images`, 'done')

        setGeneratedVariants(prev => [
          ...prev.filter(existing => existing.number !== v.number),
          {
            number: v.number,
            name:   v.name,
            spec:   v.spec,
            listing: { title: titleVar, bullets: bulletsVar, description: descVar, keywords: kwVar },
            images:  imageVarResults,
          }
        ])

        upd(`v${i}_send_listing`, 'running')
        const listingRes = await fetch('https://hook.eu1.make.com/jjr7dru5kpneiucti9v9d7fc1wizkkiu', {
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
        const listingData = await listingRes.json().catch(() => ({}))
        upd(`v${i}_send_listing`, 'done')

        await new Promise(r => setTimeout(r, 15000))

        upd(`v${i}_send_visuals`, 'running')
        const visualsRes = await fetch('https://hook.eu1.make.com/4a4tid8i1vianrffyo7fcchh14rrs367', {
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
              const p = videoSectionsRef[idx]?.parsed ?? {}
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
        const visualsData = await visualsRes.json().catch(() => ({}))
        upd(`v${i}_send_visuals`, 'done')

        setVariantResults(prev => {
          const newResult = {
            label:           v.number,
            listingDriveUrl: listingData.drive_url ?? null,
            listingSheetUrl: listingData.sheet_url ?? null,
            visualsDriveUrl: visualsData.drive_url ?? null,
            visualsSheetUrl: visualsData.sheet_url ?? null,
          }
          const merged = [...prev.filter(r => r.label !== v.number), newResult]
          return merged.sort((a, b) => Number(a.label) - Number(b.label))
        })

        if (i < selectedVariants.length - 1) {
          upd(`wait_${i}`, 'running')
          await new Promise(r => setTimeout(r, 15000))
          upd(`wait_${i}`, 'done')
        }
      }
      setVariantStatus('done')
    } catch (err) {
      setVariantStatus('error')
      setVariantSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', message: err.message } : s))
    }
  }

  const handleStandaloneShotlistGenerate = async () => {
    setShotlistSendStatus('sending')
    setShotlistSendResults([])
    setShotlistSendProgress(0)
    setShotlistSendError(null)

    const commonInfo = {
      client:     selectedClient?.name ?? '',
      identifier: selectedClient?.identifier ?? '',
      drive_url:  selectedClient?.driveFolderUrl ?? '',
      sheet_id:   selectedClient?.clientSheetId ?? '',
      product:    selectedProduct,
    }

    const buildImageShotlist = (images) =>
      IMAGE_SLOTS
        .map((slot, idx) => ({ slot, parsed: images[idx]?.parsed }))
        .filter(({ parsed }) => parsed?.realPhoto?.needed === 'Yes')
        .map(({ slot, parsed }) => ({
          id: slot.id, label: slot.label, group: slot.group,
          type: 'Foto',
          text:             parsed.text ?? '',
          imageDescription: parsed.imageDescription ?? '',
          realPhoto: {
            description: parsed.realPhoto.description ?? '',
            person:      parsed.realPhoto.person ?? '',
            location:    parsed.realPhoto.location ?? '',
          },
        }))

    try {
      for (let i = 0; i < shotlistRows.length; i++) {
        const row = shotlistRows[i]
        setShotlistSendProgress(i)

        const visualsId = extractSheetId(row.url)
        if (!visualsId) throw new Error(`Invalid URL in row ${i + 1}`)

        const visualsData = await fetchVisualsConcept(visualsId)
        const images = buildImageShotlist(visualsData.images)

        const payload = {
          ...commonInfo,
          variation: row.isBase ? 'base' : 'variant',
          spec:      row.isBase ? productSpec : 'variant',
          images,
          ...(row.isBase ? {
            videos: VIDEO_SLOTS.map((slot, idx) => {
              const p = visualsData.videos[idx]?.parsed ?? {}
              return {
                id: slot.id, label: slot.label,
                type: 'Video',
                text:             p.text ?? '',
                imageDescription: p.imageDescription ?? '',
                realVideo: {
                  description: p.realVideo?.description ?? '',
                  person:      p.realVideo?.person ?? '',
                  location:    p.realVideo?.location ?? '',
                },
              }
            })
          } : {})
        }

        const res = await fetch('https://hook.eu1.make.com/e6p32g9331kmxefczsfrta70t5v5oco4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))

        setShotlistSendResults(prev => [...prev, {
          isBase:   row.isBase,
          driveUrl: data.drive_url ?? null,
          sheetUrl: data.sheet_url ?? null,
        }])

        if (i < shotlistRows.length - 1) {
          await new Promise(r => setTimeout(r, 15000))
        }
      }
      setShotlistSendStatus('done')
    } catch (err) {
      setShotlistSendError(err.message)
      setShotlistSendStatus('error')
    }
  }

  const handleCreateShotlist = async () => {
    if (shotlistStatus === 'loading') return
    setShotlistStatus('loading')
    try {
      const commonInfo = {
        client:     selectedClient?.name ?? '',
        identifier: selectedClient?.identifier ?? '',
        drive_url:  selectedClient?.driveFolderUrl ?? '',
        sheet_id:   selectedClient?.clientSheetId ?? '',
        product:    selectedProduct,
      }

      const buildImageShotlist = (parsedImages) =>
        IMAGE_SLOTS
          .map((slot, i) => ({ slot, parsed: parsedImages[i] }))
          .filter(({ parsed }) => parsed?.realPhoto?.needed === 'Yes')
          .map(({ slot, parsed }) => ({
            id:    slot.id,
            label: slot.label,
            group: slot.group,
            type:  'Foto',
            text:             parsed.text ?? '',
            imageDescription: parsed.imageDescription ?? '',
            realPhoto: {
              description: parsed.realPhoto.description ?? '',
              person:      parsed.realPhoto.person ?? '',
              location:    parsed.realPhoto.location ?? '',
            },
          }))

      const baseImages = buildImageShotlist(imageSections.map(s => s.parsed))

      const baseVideos = VIDEO_SLOTS.map((slot, i) => {
        const p = videoSections[i]?.parsed ?? {}
        return {
          id:    slot.id,
          label: slot.label,
          type:  'Video',
          text:             p.text ?? '',
          imageDescription: p.imageDescription ?? '',
          realVideo: {
            description: p.realVideo?.description ?? '',
            person:      p.realVideo?.person ?? '',
            location:    p.realVideo?.location ?? '',
          },
        }
      })

      const alreadySent = new Set(shotlistResults.map(r => r.label))
      let sentCount = 0

      if (!alreadySent.has('base')) {
        const baseRes  = await fetch('https://hook.eu1.make.com/e6p32g9331kmxefczsfrta70t5v5oco4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...commonInfo, variation: 'base', spec: productSpec, images: baseImages, videos: baseVideos }),
        })
        const baseData = await baseRes.json().catch(() => ({}))
        setShotlistResults(prev => [
          ...prev.filter(r => r.label !== 'base'),
          { label: 'base', driveUrl: baseData.drive_url ?? null, sheetUrl: baseData.sheet_url ?? null },
        ])
        sentCount++
      }

      const sorted = [...generatedVariants].sort((a, b) => Number(a.number) - Number(b.number))
      for (const variant of sorted) {
        if (alreadySent.has(variant.number)) continue
        if (sentCount > 0) await new Promise(r => setTimeout(r, 15000))
        const variantImages = buildImageShotlist(variant.images.map(r => r?.data ?? null))
        const varRes  = await fetch('https://hook.eu1.make.com/e6p32g9331kmxefczsfrta70t5v5oco4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...commonInfo, variation: variant.number, spec: variant.spec ?? '', images: variantImages }),
        })
        const varData = await varRes.json().catch(() => ({}))
        setShotlistResults(prev => [
          ...prev.filter(r => r.label !== variant.number),
          { label: variant.number, driveUrl: varData.drive_url ?? null, sheetUrl: varData.sheet_url ?? null },
        ])
        sentCount++
      }

      setShotlistStatus('done')
      setShowShotlistResults(true)
    } catch {
      setShotlistStatus('error')
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
      {/* Landing screen */}
      {phase === PHASE.LANDING && (
        <LandingScreen
          onNewConcept={handleLandingNewConcept}
          onCreateVariants={handleLandingVariants}
          onCreateShotlist={handleLandingShotlist}
        />
      )}

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

      {/* Main split layout — only for newConcept flow */}
      {(phase === PHASE.GENERATING || phase === PHASE.DONE) && flow !== 'standaloneVariants' && (
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
            {phase === PHASE.DONE && imageStatus === 'done' && (
              <>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <button
                  onClick={() => {
                    if (variantStatus === 'done') setVariantStatus('idle')
                    setShowVariantsModal(true)
                  }}
                  disabled={variantStatus === 'generating'}
                  className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    variantStatus === 'generating'
                      ? 'bg-blue-500 text-white cursor-wait'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {variantStatus === 'generating' && (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Create Variants
                </button>
                {variantResults.length > 0 && (
                  <button
                    onClick={() => setShowVariantResults(true)}
                    title="View generated variants"
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </button>
                )}
              </>
            )}
            {phase === PHASE.DONE && imageStatus === 'done' && (
              <>
                <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
                <button
                  onClick={handleCreateShotlist}
                  disabled={shotlistStatus === 'loading'}
                  className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    shotlistStatus === 'loading'
                      ? 'bg-violet-500 text-white cursor-wait'
                      : shotlistStatus === 'done'
                      ? 'bg-violet-500 text-white opacity-75'
                      : shotlistStatus === 'error'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-violet-500 hover:bg-violet-600 text-white'
                  }`}
                >
                  {shotlistStatus === 'loading' && (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {shotlistStatus === 'done' ? 'Shotlist Sent ✓' : shotlistStatus === 'error' ? 'Retry Shotlist' : 'Create Shotlist'}
                </button>
                {shotlistResults.length > 0 && (
                  <button
                    onClick={() => setShowShotlistResults(true)}
                    title="View shotlist results"
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
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
              steps={variantSteps}
              variantResults={variantResults}
              onClose={() => setShowVariantsModal(false)}
              onGenerate={handleGenerateVariants}
            />
          )}

          {showVariantResults && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-[780px] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Generated Variants</h2>
                  <button
                    onClick={() => setShowVariantResults(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 flex gap-4">
                  {/* Listing column */}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Listing</p>
                    {variantResults[0]?.listingDriveUrl && (
                      <a href={variantResults[0].listingDriveUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-amber-800 flex-1">Drive Folder</span>
                        <svg className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                    <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                      {variantResults.map(r => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{r.label}</span>
                            <span className="text-sm text-gray-400">Variant {r.label}</span>
                          </div>
                          {r.listingSheetUrl ? (
                            <a href={r.listingSheetUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Google Sheet
                            </a>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-gray-100 flex-shrink-0" />

                  {/* Visuals column */}
                  <div className="flex-1 space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Visuals</p>
                    {variantResults[0]?.visualsDriveUrl && (
                      <a href={variantResults[0].visualsDriveUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-amber-800 flex-1">Drive Folder</span>
                        <svg className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                    <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                      {variantResults.map(r => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{r.label}</span>
                            <span className="text-sm text-gray-400">Variant {r.label}</span>
                          </div>
                          {r.visualsSheetUrl ? (
                            <a href={r.visualsSheetUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Google Sheet
                            </a>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showShotlistResults && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl w-[480px] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Shotlist Results</h2>
                  <button
                    onClick={() => setShowShotlistResults(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 space-y-3">
                  {shotlistResults.find(r => r.driveUrl)?.driveUrl && (
                    <a
                      href={shotlistResults.find(r => r.driveUrl).driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-amber-800 flex-1">Drive Folder</span>
                      <svg className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                  <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                    {shotlistResults.map(r => (
                      <div key={r.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                            {r.label === 'base' ? '✦' : r.label}
                          </span>
                          <span className="text-sm text-gray-400">{r.label === 'base' ? 'Base' : `Variant ${r.label}`}</span>
                        </div>
                        {r.sheetUrl ? (
                          <a
                            href={r.sheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Google Sheet
                          </a>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {listingModal.open && (
            <ConceptResultModal
              title="Create Concept | Listing"
              status={listingModal.status}
              results={listingModal.results}
              errorMsg={listingModal.errorMsg}
              onClose={() => setListingModal(prev => ({ ...prev, open: false }))}
            />
          )}

          {visualsModal.open && (
            <ConceptResultModal
              title="Concept Creation | Visuals"
              status={visualsModal.status}
              results={visualsModal.results}
              errorMsg={visualsModal.errorMsg}
              onClose={() => setVisualsModal(prev => ({ ...prev, open: false }))}
            />
          )}
        </>
      )}

      {/* Standalone shotlist flow — blank background with modal */}
      {flow === 'standaloneShotlist' && phase === PHASE.DONE && (
        <>
          <div className="flex-1 bg-gray-50" />
          {showShotlistUrlModal && (
            <ShotlistUrlInputModal
              rows={shotlistRows}
              onRowsChange={setShotlistRows}
              onGenerate={handleStandaloneShotlistGenerate}
              status={shotlistSendStatus}
              results={shotlistSendResults}
              progress={shotlistSendProgress}
              error={shotlistSendError}
              onClose={handleNewConcept}
            />
          )}
        </>
      )}

      {/* Standalone variants flow — blank background with modals */}
      {flow === 'standaloneVariants' && phase === PHASE.DONE && (
        <>
          <div className="flex-1 bg-gray-50" />

          {showVariantsModal && (
            <VariantsModal
              variants={variants}
              status={variantStatus}
              steps={variantSteps}
              variantResults={variantResults}
              onClose={handleNewConcept}
              onGenerate={(selected) => {
                setSelectedStandaloneVariants(selected)
                setShowVariantsModal(false)
                setShowUrlInputModal(true)
              }}
            />
          )}

          {showUrlInputModal && (
            <SheetUrlInputModal
              listingUrl={standaloneListingUrl}
              visualsUrl={standaloneVisualsUrl}
              onListingChange={setStandaloneListingUrl}
              onVisualsChange={setStandaloneVisualsUrl}
              onGenerate={() => handleStandaloneVariantGenerate(selectedStandaloneVariants)}
              loading={urlInputLoading}
              error={urlInputError}
              onClose={() => setShowUrlInputModal(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
