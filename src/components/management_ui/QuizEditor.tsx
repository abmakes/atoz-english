'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import QuizForm, { QuizFormHandle } from "@/components/management_ui/forms/QuizForm"
import UploadForm from "@/components/management_ui/forms/UploadForm"
import PromptImportForm from "@/components/management_ui/forms/PromptImportForm"
import QuizSetupForm from "@/components/management_ui/forms/QuizSetupForm"
import AIGenerationForm, {
  type AIGenerationDraftBrief,
} from "@/components/management_ui/forms/AIGenerationForm"
import DownloadButton from "@/components/management_ui/DownloadButton"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuestionType } from '@/types/question_types'
import QuizFinalizeForm from "@/components/management_ui/forms/QuizFinalizeForm"
import { useCustomToast } from '@/components/ui/CustomToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles, Upload, Pencil, ArrowRight, Check, ArrowLeft, Plus, ClipboardCopy } from 'lucide-react'
import {
  clearWorkingDraft,
  deleteQuizDraft,
  draftHasContent,
  getQuizDraft,
  getWorkingDraftId,
  upsertQuizDraft,
  type DraftGenerationBrief,
  type QuizDraftSnapshot,
} from '@/lib/quiz-draft-storage'
import {
  hasAnswersTooLongForSplashDash,
  SPLASH_DASH_MAX_ANSWER_LENGTH,
} from '@/lib/game-mode-eligibility'
import {
  CEFR_LEVELS,
  QUESTION_STYLE_OPTIONS,
  SENTENCE_FORM_OPTIONS,
  VOCABULARY_FOCUS_OPTIONS,
  normalizeCefrLevel,
  normalizeDiscoveryTags,
  type CefrLevelId,
  type QuestionStyle,
  type SentenceForm,
  type VocabularyFocus,
} from '@/lib/taxonomy/quiz-taxonomy'
import { mergeApprovedQuestions } from '@/lib/ai/review-commit'

function hydrateGenerationBrief(
  draft: DraftGenerationBrief,
  fallbackTags: string[]
): AIGenerationDraftBrief {
  const level =
    (draft.level && normalizeCefrLevel(draft.level)) ||
    (CEFR_LEVELS.find((candidate) => candidate.id === draft.level)?.id as CefrLevelId | undefined) ||
    'A1'

  return {
    teacherNotes: draft.teacherNotes ?? '',
    modelSentence: draft.modelSentence ?? '',
    selectedTags: draft.selectedTags ?? fallbackTags,
    level,
    sentenceForms: (draft.sentenceForms ?? []).filter((value): value is SentenceForm =>
      (SENTENCE_FORM_OPTIONS as readonly string[]).includes(value)
    ),
    questionStyles: (draft.questionStyles ?? []).filter((value): value is QuestionStyle =>
      (QUESTION_STYLE_OPTIONS as readonly string[]).includes(value)
    ),
    vocabularyFocus: (VOCABULARY_FOCUS_OPTIONS as readonly string[]).includes(
      draft.vocabularyFocus ?? ''
    )
      ? (draft.vocabularyFocus as VocabularyFocus)
      : 'Mixed',
    numberOfQuestions: draft.numberOfQuestions ?? 10,
    lessonSummary: draft.lessonSummary,
    keyVocabulary: draft.keyVocabulary,
    sentencePatterns: draft.sentencePatterns,
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a quiz question with all its properties
 * Used for both creating new questions and editing existing ones
 */
export interface Question {
  id?: string; // Optional: only for existing questions during an edit
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl: string;
  imageFile: File | null;
  imageMetadata?: {
    pixabayId: number;
    pixabayUser: string;
    tags: string[];
    searchTerm: string;
    width: number;
    height: number;
  };
  type: QuestionType; // Ensure type is always present
}

/**
 * Contains the basic quiz setup information (title, description, cover image, etc.)
 * This data is collected in the first step of quiz creation/editing
 */
export interface QuizSetupData {
  title: string;
  description: string;
  coverImageUrl: string;
  coverImageFile: File | null;
  quizType: QuestionType;
  tags: string[];
}

/**
 * Contains all the game settings and configuration options
 * This data is configured in the final step before publishing/updating
 */
export interface QuizSettingsData {
  theme?: string; // Example setting
  // Add other settings as needed
  powerUps?: string[]; // For selected power-up IDs
  gameMode?: 'basic' | 'boosted';
  guessOptions?: string;
  timeLimit?: string;
  music?: boolean;
  soundEffects?: boolean;
}

/**
 * Props for the QuizEditor component
 * Determines whether we're in 'create' or 'edit' mode
 */
interface QuizEditorProps {
  mode: 'create' | 'edit';
  quizId?: string;
  /** Resume a specific local draft (from Profile → Drafts) */
  resumeDraftId?: string;
  initialData?: {
    quizSetup: QuizSetupData;
    questions: Question[];
    settings: QuizSettingsData;
  };
  onSuccess?: (quizId: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * QuizEditor - Centralized component for creating and editing quizzes
 * 
 * This component handles the entire three-step workflow:
 * 1. Setup: Basic quiz information (title, description, cover image, tags)
 * 2. Content: Adding/editing questions and quiz content
 * 3. Publish: Final settings and publishing/updating the quiz
 * 
 * It works in two modes:
 * - 'create': For new quizzes
 * - 'edit': For updating existing quizzes (pre-populated with initial data)
 */
export default function QuizEditor({ mode, quizId, resumeDraftId, initialData, onSuccess }: QuizEditorProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Current step in the quiz creation/editing process
  const [creationStep, setCreationStep] = useState<'setup' | 'content' | 'publish'>('setup')
  
  // Toast notifications for user feedback
  const { addToast } = useCustomToast()
  
  // Reference to the QuizForm component for triggering validation
  const quizFormRef = useRef<QuizFormHandle>(null);

  // Quiz setup data (title, description, cover image, type, tags)
  const [quizSetupData, setQuizSetupData] = useState<QuizSetupData>(() => {
    const setup = initialData?.quizSetup || {
      title: '',
      description: '',
      coverImageUrl: '/images/placeholder.webp',
      coverImageFile: null,
      quizType: QuestionType.MULTIPLE_CHOICE,
      tags: [],
    }
    return {
      ...setup,
      tags: normalizeDiscoveryTags(setup.tags || []),
    }
  })

  // List of questions for the quiz
  const [questionsList, setQuestionsList] = useState<Question[]>(
    initialData?.questions || []
  )

  // Quiz settings and configuration options
  const [quizSettings, setQuizSettings] = useState<QuizSettingsData>(
    initialData?.settings || {
      theme: 'default',
      powerUps: [],
    }
  )

  // Current view in the content step (manual edit or CSV upload)
  const [contentView, setContentView] = useState<'create' | 'upload'>('create')
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [generationBrief, setGenerationBrief] = useState<AIGenerationDraftBrief | null>(null)
  /** Bumped when discarding so the AI modal remounts with empty notes/vocabulary. */
  const [aiFormKey, setAiFormKey] = useState(0)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatusMessage, setPublishStatusMessage] = useState('')

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const draftHydrated = useRef(false)
  const publishCompletedRef = useRef(false)
  const workingDraftId = getWorkingDraftId(mode, quizId)

  const buildDraftSnapshot = useCallback((): QuizDraftSnapshot => {
    return {
      id: resumeDraftId || workingDraftId,
      mode,
      quizId,
      updatedAt: new Date().toISOString(),
      creationStep,
      contentView,
      quizSetup: {
        title: quizSetupData.title,
        description: quizSetupData.description,
        coverImageUrl: quizSetupData.coverImageUrl,
        quizType: quizSetupData.quizType,
        tags: quizSetupData.tags,
      },
      questions: questionsList.map((q) => ({
        id: q.id,
        question: q.question,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
        imageUrl: q.imageUrl,
        imageMetadata: q.imageMetadata,
        type: q.type,
      })),
      settings: quizSettings,
      generationBrief: generationBrief
        ? {
            teacherNotes: generationBrief.teacherNotes,
            modelSentence: generationBrief.modelSentence,
            selectedTags: generationBrief.selectedTags,
            level: generationBrief.level,
            sentenceForms: generationBrief.sentenceForms,
            questionStyles: generationBrief.questionStyles,
            vocabularyFocus: generationBrief.vocabularyFocus,
            numberOfQuestions: generationBrief.numberOfQuestions,
            lessonSummary: generationBrief.lessonSummary,
            keyVocabulary: generationBrief.keyVocabulary,
            sentencePatterns: generationBrief.sentencePatterns,
          }
        : undefined,
    }
  }, [
    resumeDraftId,
    workingDraftId,
    mode,
    quizId,
    creationStep,
    contentView,
    quizSetupData,
    questionsList,
    quizSettings,
    generationBrief,
  ])

  const persistDraft = useCallback((reason: 'auto' | 'manual' | 'pre-submit' = 'auto') => {
    if (publishCompletedRef.current) return
    const snapshot = buildDraftSnapshot()
    if (!draftHasContent(snapshot) && reason === 'auto') return
    upsertQuizDraft(snapshot)
    setDraftSavedAt(snapshot.updatedAt)
    if (reason === 'manual') {
      addToast('Draft saved on this device.', { variant: 'success', position: 'top-center' })
    }
  }, [buildDraftSnapshot, addToast])

  // Restore local draft once on mount (create, or edit with matching draft)
  useEffect(() => {
    if (draftHydrated.current) return
    draftHydrated.current = true

    const draftId = resumeDraftId || workingDraftId
    const draft = getQuizDraft(draftId)
    if (!draft || !draftHasContent(draft)) {
      if (mode === 'edit' && initialData && (initialData.questions?.length ?? 0) > 0) {
        setCreationStep('content')
      }
      return
    }

    // Don't overwrite a fresh edit load with a stale draft unless resuming explicitly
    if (mode === 'edit' && !resumeDraftId && initialData) {
      // Prefer newer local draft if user had unsaved edits
      const draftTime = new Date(draft.updatedAt).getTime()
      // Always restore edit drafts — they represent unsaved work
      if (Number.isNaN(draftTime)) return
    }

    setQuizSetupData({
      title: draft.quizSetup.title,
      description: draft.quizSetup.description,
      coverImageUrl: draft.quizSetup.coverImageUrl || '/images/placeholder.webp',
      coverImageFile: null,
      quizType: draft.quizSetup.quizType,
      tags: normalizeDiscoveryTags(draft.quizSetup.tags || []),
    })
    setQuestionsList(
      draft.questions.map((q) => ({
        ...q,
        imageFile: null,
        imageUrl: q.imageUrl || '/images/placeholder.webp',
      }))
    )
    setQuizSettings(draft.settings || { theme: 'default', powerUps: [] })
    if (draft.generationBrief) {
      setGenerationBrief(
        hydrateGenerationBrief(draft.generationBrief, draft.quizSetup.tags || [])
      )
    }
    setCreationStep(draft.creationStep || 'setup')
    // Legacy drafts may still store `ai-generation` as a content tab.
    const storedView = draft.contentView as string
    if (storedView === 'ai-generation') {
      setContentView('create')
      setAiModalOpen(true)
    } else {
      setContentView(storedView === 'upload' ? 'upload' : 'create')
    }
    setDraftSavedAt(draft.updatedAt)
    addToast('Restored your saved draft from this device.', {
      variant: 'info',
      position: 'top-center',
    })
  }, [mode, quizId, resumeDraftId, workingDraftId, initialData, addToast])

  // Debounced autosave — keeps partial work if publish fails or the tab closes
  useEffect(() => {
    if (!draftHydrated.current || publishCompletedRef.current) return
    const timer = window.setTimeout(() => {
      persistDraft('auto')
    }, 800)
    return () => window.clearTimeout(timer)
  }, [persistDraft])

  // Warn before leaving with unsaved/in-progress work
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (publishCompletedRef.current) return
      if (!draftHasContent(buildDraftSnapshot())) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [buildDraftSnapshot])

  // ============================================================================
  // EFFECTS & INITIALIZATION
  // ============================================================================
  
  // (edit-mode step init moved into draft hydrate effect above)

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handles completion of the setup step
   * Moves to content step and initializes first question if needed
   */
  const handleSetupComplete = (data: QuizSetupData) => {
    setQuizSetupData(data)
    // Do not seed an empty question — wait until Manual / Upload / AI adds content.
    setCreationStep('content')
  }

  const handleSetupAiGenerate = (data: QuizSetupData) => {
    setQuizSetupData(data)
    setContentView('create')
    setCreationStep('content')
    setAiModalOpen(true)
    addToast('Title, description, and tags are ready — refine notes and generate.', {
      variant: 'success',
      position: 'top-center',
    })
  }

  /**
   * Callback for QuizForm to update cover image in quizSetupData
   * This allows the cover image to be changed from the content step
   */
  const handleQuizCoverImageChangeInContentStep = (newImageUrl: string, newImageFile?: File | null) => {
    setQuizSetupData(prevData => ({
      ...prevData,
      coverImageUrl: newImageUrl,
      coverImageFile: newImageFile || null, 
    }));
  };

  /**
   * Updates the questions list when questions are modified
   */
  const handleQuestionsListChange = (updatedQuestions: Question[]) => {
    setQuestionsList(updatedQuestions);
  };

  /**
   * Adds new questions to the existing list.
   * Replaces a single empty stub question when present.
   */
  const handleAddQuestions = (newQuestions: Question[]) => {
    setQuestionsList((prevQuestions) =>
      mergeApprovedQuestions(prevQuestions, newQuestions)
    )
    setContentView('create')
    setAiModalOpen(false)
    setUploadModalOpen(false)
    setPromptModalOpen(false)
  }

  const handleAiTagsSync = (tags: string[]) => {
    setQuizSetupData((prev) => ({
      ...prev,
      tags: normalizeDiscoveryTags(tags),
    }))
  }
  
  /**
   * Validates all questions and moves to the publish step
   * Performs comprehensive validation before allowing progression
   */
  const handleQuestionsConfirmed = () => {
    console.log("Questions confirmed.");

    // Validate quiz setup data
    if (!quizSetupData.title) {
      addToast("Please enter a quiz title before proceeding.", { variant: 'error', position: 'top-center' });
      return;
    }
    if (!quizSetupData.description) {
      addToast("Please enter a quiz description before proceeding.", { variant: 'error', position: 'top-center' });
      return;
    }

    // Validate that at least one question exists
    if (questionsList.length === 0) {
      addToast("Please add at least one question before proceeding to settings.", { variant: 'warning', position: 'top-center' });
      return;
    }

    // Validate individual questions and answers
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      
      // Check question text
      if (!q.question.trim()) {
        addToast(`Question ${i + 1} text cannot be empty.`, { variant: 'error', position: 'top-center' });
        return;
      }
      
      // For multiple choice and sorting questions, check all answer fields
      if ([QuestionType.MULTIPLE_CHOICE, QuestionType.SORTING].includes(q.type)) {
        if (q.answers.some(ans => !ans.trim())) {
          addToast(`All answer fields for question ${i + 1} must be filled.`, { variant: 'error', position: 'top-center' });
          return;
        }
      }
      
      // Check correct answer (except for matching questions which have complex structure)
      if (!q.correctAnswer.trim() && q.type !== QuestionType.MATCHING) {
         addToast(`Correct answer for question ${i + 1} must be specified.`, { variant: 'error', position: 'top-center' });
         return;
      }
      
      // Special validation for matching questions
      if (q.type === QuestionType.MATCHING) {
        try {
          const pairs = JSON.parse(q.correctAnswer);
          if (!Array.isArray(pairs) || pairs.length === 0) {
            addToast(`Please provide at least one pair for matching question ${i + 1}.`, { variant: 'error', position: 'top-center' });
            return;
          }
          for (const pair of pairs) {
            if (!pair.prompt || !pair.prompt.trim() || !pair.answer || !pair.answer.trim()) {
              addToast(`Both parts of each pair must be filled for matching question ${i + 1}.`, { variant: 'error', position: 'top-center' });
              return;
            }
          }
        } catch (e) {
          console.error("Error parsing correct answer for matching question:", e);
          addToast(`Correct answer format for matching question ${i + 1} is invalid.`, { variant: 'error', position: 'top-center' });
          return;
        }
      }
    }

    // All validation passed, move to publish step
    setCreationStep('publish');
  };

  /**
   * Toggles tags on/off in the quiz setup data
   */
  const handleTagToggle = (tag: string) => {
    setQuizSetupData(prevData => {
      const newTags = prevData.tags.includes(tag)
        ? prevData.tags.filter(t => t !== tag)
        : [...prevData.tags, tag];
      return { ...prevData, tags: newTags };
    });
  };

  const handleSelectedTagsChange = (tags: string[]) => {
    setQuizSetupData((prevData) => ({ ...prevData, tags }))
  };

  /**
   * Triggers the QuizForm validation and moves to publish step
   * Falls back to direct validation if the form ref is not available
   */
  const handleGoToPublishStep = () => {
    if (quizFormRef.current) {
      quizFormRef.current.triggerSubmit(); 
    } else {
      console.warn("QuizForm ref not available. Proceeding to publish step directly, but this might skip validation.");
      handleQuestionsConfirmed();
    }
  };

  // ============================================================================
  // FINAL SUBMISSION HANDLING
  // ============================================================================
  
  /**
   * Checks if a URL is already a stored blob URL
   */
  const isBlobUrl = (url: string): boolean => {
    return url.includes('blob.vercel-storage.com') || 
           url.includes('blob:') || 
           url.startsWith('/api/images/') ||
           url.includes('vercel-storage.com');
  };
  
  /**
   * Downloads and stores Pixabay images before quiz submission
   * Returns updated questions with blob URLs instead of Pixabay URLs
   */
  const downloadPixabayImages = async (questions: Question[]): Promise<Question[]> => {
    const pixabayQuestions = questions.filter(q => 
      q.imageUrl && q.imageUrl.includes('pixabay.com') && !isBlobUrl(q.imageUrl)
    );

    if (pixabayQuestions.length === 0) {
      console.log('No new Pixabay images to download - all images already stored');
      return questions; // No new Pixabay images to download
    }

    if (pixabayQuestions.length > 0) {
      addToast(`Saving ${pixabayQuestions.length} new image(s)...`, { 
        variant: 'info', 
        position: 'top-center' 
      });
    }

    const updatedQuestions = [...questions];
    
    for (let i = 0; i < pixabayQuestions.length; i++) {
      const question = pixabayQuestions[i];
      const questionIndex = questions.findIndex(q => q === question);
      
      try {
        // First, check if the image already exists in the database
        console.log(`Checking if image exists in database for question ${questionIndex}:`, question.imageUrl);
        
        const checkResponse = await fetch('/api/images/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalUrl: question.imageUrl
          })
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          
          if (checkResult.exists) {
            console.log(`Image already exists in database for question ${questionIndex}:`, checkResult.image.blobUrl);
            // Update the question with the existing blob URL
            updatedQuestions[questionIndex] = {
              ...question,
              imageUrl: checkResult.image.blobUrl
            };
            continue; // Skip to next image
          }
        } else {
          console.warn(`Failed to check image existence for question ${questionIndex}, proceeding with download`);
        }

        // Image doesn't exist, proceed with download
        const pixabayId = question.imageMetadata?.pixabayId || extractPixabayIdFromUrl(question.imageUrl) || Date.now();
        const pixabayUser = question.imageMetadata?.pixabayUser || 'unknown';
        const searchTerm = question.imageMetadata?.searchTerm || 'quiz-image';
        const tags = question.imageMetadata?.tags || [];
        const width = question.imageMetadata?.width || 640;
        const height = question.imageMetadata?.height || 360;
        
        console.log(`Downloading new image for question ${questionIndex}:`, {
          imageUrl: question.imageUrl,
          pixabayId: pixabayId,
          pixabayUser: pixabayUser,
          searchTerm: searchTerm,
          tags: tags
        });
        
        const response = await fetch('/api/images/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: question.imageUrl,
            pixabayId: pixabayId,
            pixabayUser: pixabayUser,
            searchTerm: searchTerm,
            tags: tags,
            width: width,
            height: height,
            mimeType: 'image/jpeg'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log(`Successfully downloaded new image for question ${questionIndex}:`, result.image.blobUrl);
            // Update the question with the blob URL
            updatedQuestions[questionIndex] = {
              ...question,
              imageUrl: result.image.blobUrl
            };
          } else {
            console.error(`Failed to download image for question ${questionIndex}:`, result);
          }
        } else {
          const errorText = await response.text();
          console.error(`Image download failed for question ${questionIndex}:`, response.status, errorText);
        }
      } catch (error) {
        console.error('Failed to process Pixabay image:', error);
        // Keep the original URL if processing fails
      }
    }

    return updatedQuestions;
  };

  /**
   * Downloads and stores Pixabay cover image if needed
   */
  const downloadPixabayCoverImage = async (quizSetup: QuizSetupData): Promise<QuizSetupData> => {
    if (!quizSetup.coverImageUrl || 
        !quizSetup.coverImageUrl.includes('pixabay.com') || 
        isBlobUrl(quizSetup.coverImageUrl)) {
      console.log('Cover image already stored or not a Pixabay image');
      return quizSetup; // Not a Pixabay image or already stored
    }

    try {
      // First, check if the cover image already exists in the database
      console.log('Checking if cover image exists in database:', quizSetup.coverImageUrl);
      
      const checkResponse = await fetch('/api/images/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: quizSetup.coverImageUrl
        })
      });

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
          console.log('Cover image already exists in database:', checkResult.image.blobUrl);
          return {
            ...quizSetup,
            coverImageUrl: checkResult.image.blobUrl
          };
        }
      } else {
        console.warn('Failed to check cover image existence, proceeding with download');
      }

      // Image doesn't exist, proceed with download
      const pixabayId = extractPixabayIdFromUrl(quizSetup.coverImageUrl) || Date.now();
      
      const response = await fetch('/api/images/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: quizSetup.coverImageUrl,
          pixabayId: pixabayId,
          pixabayUser: 'unknown',
          searchTerm: 'quiz-cover',
          tags: [],
          width: 640,
          height: 360,
          mimeType: 'image/jpeg'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return {
            ...quizSetup,
            coverImageUrl: result.image.blobUrl
          };
        }
      }
    } catch (error) {
      console.error('Failed to process Pixabay cover image:', error);
    }

    return quizSetup; // Return original if processing fails
  };

  /**
   * Extracts Pixabay ID from a Pixabay URL
   */
  const extractPixabayIdFromUrl = (url: string): number | null => {
    try {
      // Pixabay URLs can have different formats:
      // 1. Old numeric format: https://pixabay.com/get/g72961fda043125f195b4b61537b54c2fce831421ca0a4f36ba1f5afe5f3f6c2a47440fc4d6b7ace24589658ebe9240ce_640.jpg
      // 2. New alphanumeric format: https://pixabay.com/get/gae422aa..._640.jpg
      
      // Try to extract numeric ID from old format
      const numericMatch = url.match(/\/(\d+)_\d+\.jpg$/);
      if (numericMatch) {
        return parseInt(numericMatch[1], 10);
      }
      
      // Try to extract numeric ID from /get/g pattern
      const getNumericMatch = url.match(/\/get\/g(\d+)/);
      if (getNumericMatch) {
        return parseInt(getNumericMatch[1], 10);
      }
      
      // For new alphanumeric format, we can't extract a numeric ID
      // Instead, we'll use a hash of the URL as a fallback ID
      if (url.includes('pixabay.com/get/')) {
        // Create a simple hash from the URL to use as a unique identifier
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
          const char = url.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash); // Return positive number
      }
      
      console.warn('Could not extract Pixabay ID from URL:', url);
      return null;
    } catch (error) {
      console.error('Error extracting Pixabay ID:', error);
      return null;
    }
  };
  
  /**
   * Handles the final submission for both create and edit modes
   * Prepares FormData and sends to appropriate API endpoint
   */
  const handleFinalQuizSubmit = async (finalizedData: {
    quizSetup: QuizSetupData;
    questions: Question[];
    settings: QuizSettingsData;
  }) => {
    if (isPublishing || publishCompletedRef.current) return

    const action = mode === 'create' ? 'Publishing' : 'Updating';
    setIsPublishing(true)
    setPublishStatusMessage('Preparing your quiz…')
    addToast(`${action} your quiz...`, { variant: 'info', position: 'top-center' });
    setIsPublishing(true)

    const { quizSetup, questions, settings } = finalizedData;
    setQuizSettings(settings);
    persistDraft('pre-submit');

    try {
      setPublishStatusMessage('Downloading and storing images…')
      const updatedQuestions = await downloadPixabayImages(questions);
      const updatedQuizSetup = await downloadPixabayCoverImage(quizSetup);
      
      const formData = new FormData();
      
      formData.append('title', updatedQuizSetup.title);
      formData.append('description', updatedQuizSetup.description || '');
      formData.append('quizType', updatedQuizSetup.quizType);
      formData.append('tags', JSON.stringify(updatedQuizSetup.tags));

      if (updatedQuizSetup.coverImageFile) {
        formData.append('quizImageFile', updatedQuizSetup.coverImageFile);
      } else {
        formData.append('quizImageUrl', updatedQuizSetup.coverImageUrl);
      }

      updatedQuestions.forEach((q, index) => {
        if (q.id) {
          formData.append(`questions[${index}][id]`, q.id);
        }
        
        formData.append(`questions[${index}][question]`, q.question);
        formData.append(`questions[${index}][correctAnswer]`, q.correctAnswer);
        formData.append(`questions[${index}][type]`, q.type);
        formData.append(`questions[${index}][answers]`, JSON.stringify(q.answers));
        
        if (q.imageFile) {
          formData.append(`questions[${index}][imageFile]`, q.imageFile);
        } else if (q.imageUrl) {
          formData.append(`questions[${index}][imageUrl]`, q.imageUrl);
        }
      });

      const defaultSettings = {
        theme: settings.theme ?? 'default',
        powerUps: settings.powerUps ?? [],
        gameMode: settings.gameMode ?? 'basic',
        guessOptions: settings.guessOptions ?? 'zero',
        timeLimit: settings.timeLimit ?? 'fifteen',
        music: settings.music ?? true,
        soundEffects: settings.soundEffects ?? true,
      };
      formData.append('defaultSettings', JSON.stringify(defaultSettings));

      if (mode === 'edit' && !quizId) {
        throw new Error('Quiz ID is required for editing');
      }
      
      const url = mode === 'create' ? '/api/quizzes' : `/api/quizzes/${quizId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      setPublishStatusMessage(
        mode === 'create' ? 'Saving quiz to the server…' : 'Updating quiz…'
      )
      
      const response = await fetch(url, {
        method,
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${mode === 'create' ? 'create' : 'update'} quiz`);
      }
      
      const result = await response.json();
      console.log(`Quiz ${mode === 'create' ? 'created' : 'updated'} successfully:`, result);

      // Stop autosave before clearing so a stay-on-page tick cannot recreate drafts
      publishCompletedRef.current = true
      clearWorkingDraft(mode, quizId)
      deleteQuizDraft(getWorkingDraftId(mode, quizId))
      if (resumeDraftId) {
        deleteQuizDraft(resumeDraftId)
      }
      setDraftSavedAt(null)
      setGenerationBrief(null)
      setAiFormKey((key) => key + 1)
      setPublishStatusMessage('Done — redirecting…')
      
      const successMessage = mode === 'create' ? 'Quiz Published Successfully!' : 'Quiz Updated Successfully!';
      addToast(successMessage, { variant: 'success', position: 'top-center' });
      
      const publishedId = result.data?.id as string | undefined
      if (onSuccess && publishedId) {
        onSuccess(publishedId);
      } else {
        setIsPublishing(false)
        setPublishStatusMessage('')
      }
    } catch (error) {
      console.error(`Failed to ${mode === 'create' ? 'submit' : 'update'} quiz:`, error);
      persistDraft('pre-submit');
      setIsPublishing(false)
      setPublishStatusMessage('')
      addToast(
        `Error ${mode === 'create' ? 'submitting' : 'updating'} quiz: ${error instanceof Error ? error.message : 'Unknown error'}. Your draft was kept on this device.`,
        { variant: 'error', position: 'top-center' }
      );
      throw error
    }
  };

  // Define the steps for the progress indicator
  const stepDetails = [
    { id: 'setup', number: 1, title: 'Quiz Setup' },
    { id: 'content', number: 2, title: mode === 'create' ? 'Create Questions' : 'Edit Questions' },
    { id: 'publish', number: 3, title: mode === 'create' ? 'Review & Publish' : 'Review & Update' },
  ];
  
  const stepOrder = stepDetails.map(s => s.id);
  const currentActiveStepIndex = stepOrder.indexOf(creationStep);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className='flex flex-col h-[calc(100vh-120px)] px-2 lg:px-6'>
      <div className="container h-full w-full mx-auto flex flex-col items-center">
        
        {/* ========================================================================
         * PROGRESS INDICATOR
         * Shows the current step and allows navigation between steps
         * ======================================================================== */}
        <div className="flex w-full sm:w-auto justify-center space-x-2 sm:space-x-4 grandstander font-semibold bg-[--text-color] rounded-full border-2 border-[--border-dark] shadow-[4px_4px_0px_0px_#1F6E91] mb-6">

          {stepDetails.map((step, index) => {
            // Determine the status of each step for styling
            let status: 'active' | 'completed' | 'pending';
            if (index < currentActiveStepIndex) {
              status = 'completed';
            } else if (index === currentActiveStepIndex) {
              status = 'active';
            } else {
              status = 'pending';
            }

            // Dynamic classes based on step status
            const isActive = status === 'active';
            let stepContainerClasses = `flex gap-2 p-0.5 text-justify items-center rounded-full ${isActive ? 'bg-white min-w-32 sm:min-w-56 flex-1 sm:flex-none' : 'min-w-12 sm:min-w-56 flex-none'}`; 
            let iconClasses = 'rounded-full text-xl font-bold pt-1 flex items-center justify-center h-8 w-8 flex-shrink-0'; 
            let titleClasses = 'px-2 pt-1 whitespace-nowrap'; 
            let iconContent: React.ReactNode | number = step.number;

            switch (status) {
              case 'active':
                iconClasses += ' text-[--text-color] font-bold text-xl px-3 bg-white rounded-full border-2 border-[--primary-accent]'; 
                titleClasses += ' text-[--text-color] font-bold text-lg';
                break;
              case 'completed':
                stepContainerClasses += ' bg-[--text-color]';
                iconClasses += ' bg-white text-[--accent-success] font-bold text-xl rounded-full'; 
                titleClasses += ' text-[--primary-accent]'; 
                iconContent = <Check size={20} strokeWidth={4} absoluteStrokeWidth className='text-[--primary-accent]' />;
                break;
              case 'pending':
                stepContainerClasses += ' bg-[--text-color]';
                iconClasses += ' bg-white text-[--text-color]'; 
                titleClasses += ' text-[--primary-accent]';
                break;
            }
            
            if (step.id === 'settings') {
                titleClasses += ' text-nowrap';
            }

            // Mobile: Hide text for non-active steps, Desktop: Show all text
            const titleClassesWithResponsive = `${titleClasses} ${isActive ? 'block' : 'hidden sm:block'}`;

            return (
              <div key={step.id} className={stepContainerClasses}>
                <span className={iconClasses}>{iconContent}</span>
                <span className={titleClassesWithResponsive}>{step.title}</span>
              </div>
            );
          })}

        </div>

        {/* ========================================================================
         * STEP 1: QUIZ SETUP
         * Collects basic quiz information (title, description, cover image, type, tags)
         * ======================================================================== */}
        { creationStep === 'setup' && (
          <div className="w-full max-w-screen-lg flex-grow">
            <QuizSetupForm 
              initialData={quizSetupData} 
              onSetupComplete={handleSetupComplete}
              onAiGenerate={handleSetupAiGenerate}
              selectedTags={quizSetupData.tags}
              onTagToggle={handleTagToggle}
              onSelectedTagsChange={handleSelectedTagsChange}
            />
          </div>
        )}

        {/* ========================================================================
         * STEP 2: CONTENT CREATION
         * Main area for adding/editing questions and quiz content
         * ======================================================================== */}
        { creationStep === 'content' && (
          <div className="max-w-screen-xl w-full flex flex-col flex-grow gap-4 mt-6">
            {hasAnswersTooLongForSplashDash(questionsList) && (
              <div
                role="status"
                className="w-full rounded-lg border-2 border-[#1E5167] bg-amber-50 px-4 py-3 text-[--text-color] shadow-[3px_3px_0px_0px_#1E5167] grandstander"
              >
                <p className="font-bold text-base mb-0.5">Long answers limit game modes</p>
                <p className="text-sm inclusive-sans font-normal text-slate-700">
                  Keep each answer at {SPLASH_DASH_MAX_ANSWER_LENGTH} characters or fewer if you want
                  this quiz playable in Splash Dash as well as Team Quiz. Longer answers still
                  work in Team Quiz.
                </p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row flex-grow gap-6 lg:gap-4">
            {/* SIDEBAR - Quiz Information and Navigation */}
            <div className="basis-1/4 mb-4 flex h-full min-h-0 flex-col gap-4 grandstander items-center border border-[--border-dark] bg-white p-5 text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg lg:mb-0">
              <div className="flex w-full flex-col items-center gap-1 text-center">
                <h2 className="w-full text-xl font-bold leading-tight">
                  {quizSetupData.title || 'Quiz Title'}
                </h2>
                <p className="text-sm font-bold text-slate-700">
                  Questions: {questionsList.length}
                </p>
              </div>

              {quizSetupData.coverImageUrl && (
                <Image
                  src={
                    quizSetupData.coverImageFile
                      ? URL.createObjectURL(quizSetupData.coverImageFile)
                      : quizSetupData.coverImageUrl
                  }
                  alt={quizSetupData.title || 'Quiz cover image'}
                  width={300}
                  height={200}
                  className="hidden h-auto w-full rounded-lg object-cover aspect-[16/9] lg:block"
                />
              )}

              <p className="w-full text-center text-sm text-slate-700">
                {quizSetupData.description || 'No description yet.'}
              </p>

              <div className="flex w-full flex-wrap justify-center gap-2">
                {quizSetupData.tags.length > 0 ? (
                  quizSetupData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-sm bg-white text-[--text-color] border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-white text-[--text-color] border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]"
                  >
                    No tags yet
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="flex h-12 items-center gap-2 border border-[--border-dark] bg-[--background] px-6 text-lg font-semibold text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-teal-50 hover:border-[--border-dark] hover:shadow-[4px_6px_0px_0px_var(--border-dark)] hover:scale-105 transition-all duration-300"
                  onClick={() => setCreationStep('setup')}
                >
                  <ArrowLeft className="-mt-0.5" size={20} /> Edit Quiz Info
                </Button>
                <Button
                  variant="outline"
                  className="flex h-12 items-center gap-2 border border-[#1F6E91] bg-[--text-color] px-6 text-lg font-semibold text-white shadow-[4px_4px_0px_0px_#1F6E91] hover:bg-white hover:text-[--text-color] hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_#1F6E91] hover:scale-105 transition-all duration-300"
                  onClick={handleGoToPublishStep}
                >
                  {mode === 'create' ? 'Review & Continue' : 'Update Quiz'}{' '}
                  <ArrowRight className="-mt-0.5" size={20} />
                </Button>
              </div>

              <div className="w-full space-y-2 border-t border-slate-200 pt-4">
                <p className="inclusive-sans px-1 text-center text-xs text-slate-500">
                  {draftSavedAt
                    ? `Last saved ${new Date(draftSavedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Edits autosave on this device'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-auto grandstander border-2 border-[#1E5167] px-3 text-[#114257]"
                    onClick={() => persistDraft('manual')}
                  >
                    Save draft
                  </Button>
                  {draftSavedAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-auto grandstander px-2 text-red-600"
                      onClick={() => {
                        clearWorkingDraft(mode, quizId)
                        if (resumeDraftId) deleteQuizDraft(resumeDraftId)
                        setDraftSavedAt(null)
                        setQuizSetupData({
                          title: '',
                          description: '',
                          coverImageUrl: '/images/placeholder.webp',
                          coverImageFile: null,
                          quizType: QuestionType.MULTIPLE_CHOICE,
                          tags: [],
                        })
                        setQuestionsList([])
                        setQuizSettings({ theme: 'default', powerUps: [] })
                        setGenerationBrief(null)
                        setAiFormKey((key) => key + 1)
                        setAiModalOpen(false)
                        setUploadModalOpen(false)
                        setPromptModalOpen(false)
                        setContentView('create')
                        setCreationStep('setup')
                        addToast('Draft discarded.', {
                          variant: 'info',
                          position: 'top-center',
                        })
                      }}
                    >
                      Discard draft
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* MAIN CONTENT AREA - Methods for creating quiz content */}
            <div className="basis-3/4 mt-2 flex h-full flex-col items-center gap-4 align-middle grandstander text-[--text-color] lg:mt-0">
              <div className="flex w-full h-full max-w-screen-2xl flex-col border border-[--border-dark] bg-white shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg">
                {questionsList.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
                    <div className="max-w-md text-center">
                      <h3 className="text-xl font-bold">Add your first question</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Choose how you want to start building this quiz.
                      </p>
                    </div>
                    <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionsList([
                            {
                              question: '',
                              answers: ['', '', '', ''],
                              correctAnswer: '',
                              imageUrl: '/images/placeholder.webp',
                              imageFile: null,
                              type: quizSetupData.quizType,
                            },
                          ])
                          setContentView('create')
                        }}
                        className="flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-[--border-dark] bg-white px-4 py-5 text-center shadow-[4px_4px_0px_0px_var(--border-dark)] transition hover:bg-[--primary-light]"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--primary-accent] bg-[--background]">
                          <Plus size={22} />
                        </div>
                        <span className="text-base font-semibold">Add question</span>
                        <span className="text-xs text-slate-600">Write it manually</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadModalOpen(true)}
                        className="flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-[--border-dark] bg-white px-4 py-5 text-center shadow-[4px_4px_0px_0px_var(--border-dark)] transition hover:bg-[--primary-light]"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--border-dark] bg-[--background]">
                          <Upload size={22} />
                        </div>
                        <span className="text-base font-semibold">Upload file</span>
                        <span className="text-xs text-slate-600">Import from a spreadsheet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPromptModalOpen(true)}
                        className="flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-[--border-dark] bg-white px-4 py-5 text-center shadow-[4px_4px_0px_0px_var(--border-dark)] transition hover:bg-[--primary-light]"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--border-dark] bg-[--background]">
                          <ClipboardCopy size={22} />
                        </div>
                        <span className="text-base font-semibold">Prompt</span>
                        <span className="text-xs text-slate-600">Copy for ChatGPT / Gemini</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiModalOpen(true)}
                        className="flex min-h-[9rem] flex-col items-center justify-center gap-3 rounded-xl border-2 border-violet-700 bg-violet-600 px-4 py-5 text-center text-white shadow-[4px_4px_0px_0px_var(--border-dark)] transition hover:bg-violet-500"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/80">
                          <Sparkles size={22} />
                        </div>
                        <span className="text-base font-semibold">AI generate</span>
                        <span className="text-xs text-violet-100">Create with AI</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 px-4 py-3">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          setContentView('create')
                          setUploadModalOpen(false)
                          setPromptModalOpen(false)
                          setAiModalOpen(false)
                        }}
                        className="h-10 w-auto shrink-0 border border-[--border-dark] bg-white px-3 pr-4 pl-1 text-sm font-semibold text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-[--primary-light]"
                      >
                        <div className="mr-2 flex items-center justify-center rounded-full border-2 border-[--primary-accent] bg-[--background] p-1.5">
                          <Pencil size={16} />
                        </div>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          setAiModalOpen(false)
                          setPromptModalOpen(false)
                          setUploadModalOpen(true)
                        }}
                        className="h-10 w-auto shrink-0 border border-[--border-dark] bg-white px-3 pr-4 pl-1 text-sm font-semibold text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-[--primary-light]"
                      >
                        <div className="mr-2 flex items-center justify-center rounded-full bg-[--background] p-1.5">
                          <Upload size={16} />
                        </div>
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          setAiModalOpen(false)
                          setUploadModalOpen(false)
                          setPromptModalOpen(true)
                        }}
                        className="h-10 w-auto shrink-0 border border-[--border-dark] bg-white px-3 pr-4 pl-1 text-sm font-semibold text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-[--primary-light]"
                      >
                        <div className="mr-2 flex items-center justify-center rounded-full bg-[--background] p-1.5">
                          <ClipboardCopy size={16} />
                        </div>
                        Prompt
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          setUploadModalOpen(false)
                          setPromptModalOpen(false)
                          setAiModalOpen(true)
                        }}
                        className="h-10 w-auto shrink-0 border border-violet-700 bg-violet-600 px-3 text-sm font-semibold text-white shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-violet-500"
                      >
                        <Sparkles size={16} className="mr-2" />
                        AI Generator
                      </Button>
                    </div>
                    <QuizForm
                      ref={quizFormRef}
                      quizId={quizId}
                      quizOverallType={quizSetupData.quizType}
                      onQuizCoverImageChange={handleQuizCoverImageChangeInContentStep}
                      initialQuestions={questionsList}
                      onQuestionsChange={handleQuestionsListChange}
                      onConfirmQuestions={handleQuestionsConfirmed}
                      className="bg-transparent shadow-none border-0"
                    />
                  </>
                )}
              </div>

              <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent className="flex max-h-[92vh] w-[min(96vw,800px)] max-w-[800px] flex-col gap-0 overflow-hidden border-[--border-dark] bg-white p-0 text-[--text-color] shadow-[6px_6px_0px_0px_var(--border-dark)] sm:rounded-lg">
                  <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                      <Upload className="h-5 w-5" />
                      Upload questions
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600">
                      Import from a spreadsheet, then return to the manual editor.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <UploadForm
                      quizOverallType={quizSetupData.quizType}
                      onAddQuestions={(questions) => {
                        handleAddQuestions(questions)
                      }}
                      className="bg-transparent shadow-none border-0"
                    />
                    <div className="mt-4 space-y-2 text-sm font-normal">
                      <h2 className="text-base font-semibold">Even faster quiz creation</h2>
                      <p>Use our quiz template to make a quiz in Excel then simply upload the quiz.</p>
                      <p>You can add images by going to the quiz list and editing the quiz.</p>
                      <DownloadButton />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
                <DialogContent className="flex max-h-[92vh] w-[min(96vw,800px)] max-w-[800px] flex-col gap-0 overflow-hidden border-[--border-dark] bg-white p-0 text-[--text-color] shadow-[6px_6px_0px_0px_var(--border-dark)] sm:rounded-lg">
                  <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                      <ClipboardCopy className="h-5 w-5" />
                      Prompt import
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600">
                      Fill in the fields, copy the prompt, then paste the JSON back here.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <PromptImportForm
                      quizTitle={quizSetupData.title}
                      quizDescription={quizSetupData.description}
                      tags={quizSetupData.tags}
                      quizOverallType={quizSetupData.quizType}
                      onAddQuestions={handleAddQuestions}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                <DialogContent className="flex max-h-[92vh] w-[min(96vw,800px)] max-w-[800px] flex-col gap-0 overflow-hidden border-[--border-dark] bg-white p-0 text-[--text-color] shadow-[6px_6px_0px_0px_var(--border-dark)] sm:rounded-lg">
                  <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                      <Sparkles className="h-5 w-5 text-violet-600" />
                      AI Question Generator
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600">
                      Generate and review questions here, then return to the manual editor.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <AIGenerationForm
                      key={aiFormKey}
                      onQuestionsGenerated={handleAddQuestions}
                      onTagsSync={handleAiTagsSync}
                      quizType={quizSetupData.quizType}
                      quizTitle={quizSetupData.title}
                      quizDescription={quizSetupData.description}
                      existingTags={quizSetupData.tags}
                      initialBrief={generationBrief}
                      onBriefChange={setGenerationBrief}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            </div>
          </div>
        )}

        {/* ========================================================================
         * STEP 3: PUBLISH/UPDATE
         * Final review, settings configuration, and submission
         * ======================================================================== */}
        { creationStep === 'publish' && (
          <div className="w-full max-w-screen-2xl mt-0 flex-grow">
            <QuizFinalizeForm 
              quizSetupData={quizSetupData}
              questionsList={questionsList}
              initialQuizSettings={quizSettings}
              onFinalize={handleFinalQuizSubmit}
              onGoBackToContent={() => setCreationStep('content')}
              isPublishing={isPublishing}
              publishStatusMessage={publishStatusMessage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
