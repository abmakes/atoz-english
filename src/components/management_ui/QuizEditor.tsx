'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import QuizForm, { QuizFormHandle } from "@/components/management_ui/forms/QuizForm"
import UploadForm from "@/components/management_ui/forms/UploadForm"
import QuizSetupForm from "@/components/management_ui/forms/QuizSetupForm"
import AIGenerationForm, {
  type AIGenerationDraftBrief,
} from "@/components/management_ui/forms/AIGenerationForm"
import DownloadButton from "@/components/management_ui/DownloadButton"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuestionType } from '@/types/question_types'
import QuizFinalizeForm from "@/components/management_ui/forms/QuizFinalizeForm"
import { useCustomToast } from '@/components/ui/CustomToast'
import { Sparkles, Upload, Pencil, ArrowRight, Check, ArrowLeft } from 'lucide-react'
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

  // Current view in the content step (create, upload, or AI generation)
  const [contentView, setContentView] = useState<'create' | 'upload' | 'ai-generation'>('create')
  const [generationBrief, setGenerationBrief] = useState<AIGenerationDraftBrief | null>(null)

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const draftHydrated = useRef(false)
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
    setContentView(draft.contentView || 'create')
    setDraftSavedAt(draft.updatedAt)
    addToast('Restored your saved draft from this device.', {
      variant: 'info',
      position: 'top-center',
    })
  }, [mode, quizId, resumeDraftId, workingDraftId, initialData, addToast])

  // Debounced autosave — keeps partial work if publish fails or the tab closes
  useEffect(() => {
    if (!draftHydrated.current) return
    const timer = window.setTimeout(() => {
      persistDraft('auto')
    }, 800)
    return () => window.clearTimeout(timer)
  }, [persistDraft])

  // Warn before leaving with unsaved/in-progress work
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
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
    setContentView('ai-generation')
    setCreationStep('content')
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
    const action = mode === 'create' ? 'Publishing' : 'Updating';
    addToast(`${action} your quiz...`, { variant: 'info', position: 'top-center' });

    const { quizSetup, questions, settings } = finalizedData;
    setQuizSettings(settings);
    // Snapshot immediately so a failed publish never loses the finished quiz
    persistDraft('pre-submit');

    // Download and store Pixabay images before submitting
    const updatedQuestions = await downloadPixabayImages(questions);
    const updatedQuizSetup = await downloadPixabayCoverImage(quizSetup);
    
    // Prepare FormData for submission
    const formData = new FormData();
    
    // Add quiz setup information
    formData.append('title', updatedQuizSetup.title);
    formData.append('description', updatedQuizSetup.description || '');
    formData.append('quizType', updatedQuizSetup.quizType);
    
    // Add tags as JSON string (API expects them as a single JSON field)
    formData.append('tags', JSON.stringify(updatedQuizSetup.tags));

    // Add cover image (either new file or existing URL)
    if (updatedQuizSetup.coverImageFile) {
      formData.append('quizImageFile', updatedQuizSetup.coverImageFile);
    } else {
      formData.append('quizImageUrl', updatedQuizSetup.coverImageUrl);
    }

    // Add questions and their potential image files
    updatedQuestions.forEach((q, index) => {
      // Add question ID if it exists (for existing questions)
      if (q.id) {
        formData.append(`questions[${index}][id]`, q.id);
      }
      
      formData.append(`questions[${index}][question]`, q.question);
      formData.append(`questions[${index}][correctAnswer]`, q.correctAnswer);
      formData.append(`questions[${index}][type]`, q.type);
      
      // Add answers as JSON string (API expects them as a single JSON field)
      formData.append(`questions[${index}][answers]`, JSON.stringify(q.answers));
      
      if (q.imageFile) {
        formData.append(`questions[${index}][imageFile]`, q.imageFile);
      } else if (q.imageUrl) {
        formData.append(`questions[${index}][imageUrl]`, q.imageUrl);
      }
    });

    // Structure and append the defaultSettings JSON object
    const defaultSettings = {
      theme: settings.theme ?? 'default',
      powerUps: settings.powerUps ?? [],
      gameMode: settings.gameMode ?? 'basic',
      guessOptions: settings.guessOptions ?? 'zero',
      timeLimit: settings.timeLimit ?? 'ten',
      music: settings.music ?? true,
      soundEffects: settings.soundEffects ?? true,
    };
    formData.append('defaultSettings', JSON.stringify(defaultSettings));

    try {
      // Validate quizId for edit mode
      if (mode === 'edit' && !quizId) {
        throw new Error('Quiz ID is required for editing');
      }
      
      // Determine API endpoint and method based on mode
      const url = mode === 'create' ? '/api/quizzes' : `/api/quizzes/${quizId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      

      
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

      clearWorkingDraft(mode, quizId)
      if (resumeDraftId) {
        deleteQuizDraft(resumeDraftId)
      }
      setDraftSavedAt(null)
      
      const successMessage = mode === 'create' ? 'Quiz Published Successfully!' : 'Quiz Updated Successfully!';
      addToast(successMessage, { variant: 'success', position: 'top-center' });
      
      // Call onSuccess callback if provided
      if (onSuccess && result.data?.id) {
        onSuccess(result.data.id);
      }
    } catch (error) {
      console.error(`Failed to ${mode === 'create' ? 'submit' : 'update'} quiz:`, error);
      persistDraft('pre-submit');
      addToast(
        `Error ${mode === 'create' ? 'submitting' : 'updating'} quiz: ${error instanceof Error ? error.message : 'Unknown error'}. Your draft was kept on this device.`,
        { variant: 'error', position: 'top-center' }
      );
    } 
  };

  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  
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

            <div className="flex flex-col lg:flex-row flex-grow gap-4">
            {/* SIDEBAR - Quiz Information and Navigation */}
            <div className={`basis-1/4 flex flex-col h-full min-h-[420px] gap-2 grandstander text-[--text-color] bg-white p-4 items-center align-middle border rounded-lg border-[--border-dark] shadow-[4px_4px_0px_0px_var(--border-dark)]`}>
              <div className='flex flex-row lg:flex-col gap-2 w-full'>
                {/* Quiz Title */}
                <div className='flex flex-col w-full justify-center lg:items-center gap-0 '>
                  <h2 className='text-2xl w-full text-center font-bold px-4'>{quizSetupData.title || "Quiz Title"}</h2>
                  
                  {/* Cover Image */}
                  {quizSetupData.coverImageUrl && (
                    <Image 
                      src={quizSetupData.coverImageFile ? URL.createObjectURL(quizSetupData.coverImageFile) : quizSetupData.coverImageUrl} 
                      alt={quizSetupData.title || "Quiz cover image"} 
                      width={300} 
                      height={200} 
                      className='rounded-lg hidden lg:block lg:w-full h-auto my-2 object-cover aspect-[16/9]'
                    />
                  )}
                {/* Description */}
                <span className='text-center'>{quizSetupData.quizType.replace(/_/g, ' ')} QUIZ </span>
                <p className='text-center text-sm py-0'>{quizSetupData.description || "No description yet."}</p>
                </div>
                <div className='flex flex-col w-full justify-center lg:items-center px-6 items-end gap-2 '>

                
                {/* Tags */}
                  <div className='flex gap-2 justify-center'>
                    {quizSetupData.tags.length > 0 && (
                      <div className='text-center'>
                        <div className="flex flex-wrap justify-center gap-2">
                          {quizSetupData.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-sm bg-white text-[--text-color] border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {quizSetupData.tags.length === 0 && (
                      <div className='text-center'><Badge variant="outline" className="text-xs font-medium bg-white text-[--text-color] border-[--primary-accent] shadow-[2px_2px_0px_0px_var(--primary-accent-hover)]">No tags yet</Badge></div>
                    )}
                  </div>
                  
                  {/* Question Count */}
                  <h3 className='text-center text-lg font-bold py-2'>Questions: {questionsList.length}</h3>
                </div>
              </div>

              
              {/* Navigation Buttons */}
              <div className='flex flex-row lg:flex-col gap-4 w-full justify-center'> 
                <Button variant='outline' 
                  className="flex w-full lg:w-auto items-center h-full text-lg font-semibold border border-[--border-dark] gap-2 bg-[--background] text-[--text-color] shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-teal-50 hover:border-[--border-dark] hover:shadow-[4px_6px_0px_0px_var(--border-dark)] hover:scale-105 transition-all duration-300"
                  onClick={() => setCreationStep('setup')}>
                     <ArrowLeft className="-mt-0.5" size={20} /> Edit Quiz Info
                </Button>
                <Button variant='outline' 
                  className="flex w-full lg:w-auto items-center h-full text-lg font-semibold border border-[#1F6E91] gap-2 bg-[--text-color] text-white shadow-[4px_4px_0px_0px_var(--border-dark)] hover:bg-white hover:border-[#1F6E91] hover:shadow-[4px_6px_0px_0px_var(--border-dark)] hover:scale-105 transition-all duration-300"
                  onClick={handleGoToPublishStep}>
                    {mode === 'create' ? 'Review & Continue' : 'Update Quiz'} <ArrowRight className="-mt-0.5" size={20} /> 
                </Button>
              </div>

              {/* Draft controls — use leftover sidebar height without cluttering the main editor */}
              <div className="mt-auto w-full pt-4 border-t border-slate-200 space-y-2">
                <p className="text-xs text-center text-slate-500 inclusive-sans px-1">
                  {draftSavedAt
                    ? `Last saved ${new Date(draftSavedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Edits autosave on this device'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full grandstander border-2 border-[#1E5167] text-[#114257]"
                  onClick={() => persistDraft('manual')}
                >
                  Save draft
                </Button>
                {draftSavedAt ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full grandstander text-red-600"
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
                      setCreationStep('setup')
                      addToast('Draft discarded.', { variant: 'info', position: 'top-center' })
                    }}
                  >
                    Discard draft
                  </Button>
                ) : null}
              </div>
            </div>

            {/* MAIN CONTENT AREA - Methods for creating quiz content */}
            <div className="basis-3/4 flex flex-col gap-4 grandstander items-center text-[--text-color] h-full align-middle ">
              
              {/* Content Method Selector */}
              <div className="md:absolute md:-mt-6 flex w-full md:w-[540px] justify-between items-center grandstander gap-2 bg-[--primary-light] border border-[--border-dark] rounded-lg shadow-[4px_4px_0px_0px_var(--border-dark)]">
                <Button variant='default' className={`w-32 pr-4 pl-1 text-[--text-color] ${contentView === 'create' ? 'bg-white' : 'hover:font-bold'}`} onClick={() => setContentView('create')}>
                  <div className={`flex items-center p-1.5 mr-2 justify-center rounded-full ${contentView === 'create' ? 'bg-[--background] border-2 border-[--primary-accent]' : 'hover:bg-white'}`}>
                    <Pencil size={16} />
                  </div> Edit 
                </Button>
                <Button variant='default' className={`w-32 pr-4 pl-1 text-[--text-color] ${contentView === 'upload' ? 'bg-white' : 'hover:font-bold'}`} onClick={() => setContentView('upload')}>
                  <div className={`flex items-center p-1.5 mr-2 justify-center rounded-full ${contentView === 'upload' ? 'bg-[--background] border-2 border-[--primary-accent]' : 'hover:bg-white'}`}>  
                    <Upload size={16} />
                  </div> Upload
                </Button>
                <Button variant='default' className={`w-40 pr-4 pl-1 text-[--text-color] ${contentView === 'ai-generation' ? 'bg-white' : 'hover:font-bold'}`} onClick={() => setContentView('ai-generation')}>
                  <div className={`flex items-center p-1.5 mr-2 justify-center rounded-full ${contentView === 'ai-generation' ? 'bg-[--background] border-2 border-[--primary-accent]' : 'hover:bg-white'}`}>
                    <Sparkles size={16} />
                  </div> AI Generator
                </Button>
              </div>

              {/* Content Creation Area */}
              <div className='w-full h-full max-w-screen-2xl border border-[--border-dark] bg-white shadow-[4px_4px_0px_0px_var(--border-dark)] rounded-lg'>

                {/* Manual Question Creation */}
                {contentView === 'create' && (
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
                )}

                {/* CSV Upload for Questions */}
                {contentView === 'upload' && (
                  <div className="flex w-full justify-">
                    <Card className="flex flex-col text-2xl w-full h-full border-none font-bold p-6">
                      <UploadForm 
                        quizOverallType={quizSetupData.quizType}
                        onAddQuestions={handleAddQuestions}
                        className="bg-transparent shadow-none border-0"
                      />
                      <div className="text-base font-normal p-4 flex-grow ">
                        <h1 className="text-xl font-semibold mb-2">Even faster quiz creation</h1>
                        <p>Use our quiz template to make a quiz in Excel then simply upload the quiz.</p>
                        <p className='mb-2'>You can add images by going to the quiz list and editing the quiz.</p>
                        <DownloadButton />
                      </div>
                    </Card>
                  </div>
                )}

                {/* AI Question Generation */}
                {contentView === 'ai-generation' && (
                  <AIGenerationForm
                    onQuestionsGenerated={handleAddQuestions}
                    onTagsSync={handleAiTagsSync}
                    quizType={quizSetupData.quizType}
                    quizTitle={quizSetupData.title}
                    quizDescription={quizSetupData.description}
                    existingTags={quizSetupData.tags}
                    initialBrief={generationBrief}
                    onBriefChange={setGenerationBrief}
                  />
                )}
              </div>
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
            />
          </div>
        )}
      </div>
    </div>
  )
}
