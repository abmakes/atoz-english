/**
 * Compatibility re-exports. Prompt assembly lives in `@/lib/ai/quiz-generation`.
 */
export {
  generatedQuestionSchema,
  createQuizGenerationPrompt,
  createRepairPrompt,
  createTeacherFirstPrompt,
  createSoftSimplifyPrompt,
  parseGeneratedQuestions,
  applySuggestedSimplifications,
  type GeneratedQuestionText,
} from '@/lib/ai/quiz-generation';
