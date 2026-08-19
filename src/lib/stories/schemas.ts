import { z } from 'zod';
import { CEFR_LEVELS, GRAMMAR_TAGS, type CefrLevelId } from '@/lib/taxonomy/quiz-taxonomy';

export const STORY_PANEL_COUNT = 4;

export const STORY_TYPES = [
  'Everyday mishap',
  'Adventure',
  'Funny surprise',
  'Helping a friend',
  'Magical discovery',
  'Animal antics',
] as const;

export type StoryType = (typeof STORY_TYPES)[number];

export const MOUTH_STYLES = ['cartoon', 'duck', 'monster'] as const;

export type MouthStyle = (typeof MOUTH_STYLES)[number];

const levelIds = CEFR_LEVELS.map((level) => level.id) as [
  CefrLevelId,
  ...CefrLevelId[],
];

/** Mouth placement in coordinates normalized to the panel image (0-1). */
export const mouthPlacementSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  /** Mouth width as a fraction of the image width. */
  scale: z.number().min(0.02).max(0.6),
  /** Degrees, positive = clockwise. */
  rotation: z.number().min(-60).max(60).default(0),
  style: z.enum(MOUTH_STYLES).default('cartoon'),
});

export type MouthPlacement = z.infer<typeof mouthPlacementSchema>;

export const DEFAULT_MOUTH: MouthPlacement = {
  x: 0.5,
  y: 0.55,
  scale: 0.14,
  rotation: 0,
  style: 'cartoon',
};

const grammarTags = GRAMMAR_TAGS as readonly string[];

export const storyBriefSchema = z.object({
  topicPrompt: z.string().trim().min(3).max(800),
  level: z.enum(levelIds).default('A1'),
  storyType: z.enum(STORY_TYPES).default('Everyday mishap'),
  grammarFocus: z
    .array(z.string().trim().min(1))
    .max(4)
    .default([])
    .transform((tags) => tags.filter((tag) => grammarTags.includes(tag))),
  characters: z.string().trim().max(300).default(''),
  /** Optional context carried over from a lesson screenshot analysis. */
  lessonSummary: z.string().trim().max(600).optional(),
  keyVocabulary: z.array(z.string().trim().min(1)).max(30).optional(),
});

export type StoryBrief = z.infer<typeof storyBriefSchema>;

/** Structured plan returned by the story-plan Gemini call. */
export const storyPlanSchema = z.object({
  title: z.string().trim().min(1).max(120),
  characterSheet: z.string().trim().min(1).max(1200),
  artStyle: z.string().trim().min(1).max(500),
  panels: z
    .array(
      z.object({
        sceneDescription: z.string().trim().min(1).max(1000),
        exampleSentence: z.string().trim().min(1).max(300),
      })
    )
    .length(STORY_PANEL_COUNT),
});

export type StoryPlan = z.infer<typeof storyPlanSchema>;

export const storyPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  exampleStory: z.string().trim().max(2000).optional(),
  showExampleToStudents: z.boolean().optional(),
  status: z.enum(['DRAFT', 'READY', 'ARCHIVED']).optional(),
});

export const panelPatchSchema = z.object({
  exampleSentence: z.string().trim().max(300).optional(),
  sceneDescription: z.string().trim().min(1).max(1000).optional(),
  mouth: mouthPlacementSchema.optional(),
});

export const panelGenerateSchema = z.object({
  /** Optional teacher tweak, e.g. "make the dog bigger". */
  tweak: z.string().trim().max(300).optional(),
});

/** Limits for student audio submissions. */
export const RECORDING_MAX_BYTES = 6 * 1024 * 1024;
export const RECORDING_MAX_DURATION_MS = 90_000;
export const ENVELOPE_WINDOW_MS = 50;
const ENVELOPE_MAX_POINTS = Math.ceil(RECORDING_MAX_DURATION_MS / ENVELOPE_WINDOW_MS) + 10;

export const submissionMetaSchema = z
  .array(
    z.object({
      panelOrder: z.number().int().min(1).max(STORY_PANEL_COUNT),
      durationMs: z.number().int().min(200).max(RECORDING_MAX_DURATION_MS),
      envelope: z.array(z.number().min(0).max(1)).max(ENVELOPE_MAX_POINTS),
    })
  )
  .length(STORY_PANEL_COUNT)
  .refine(
    (items) =>
      new Set(items.map((item) => item.panelOrder)).size === STORY_PANEL_COUNT,
    { message: 'One recording per panel is required' }
  );

export type SubmissionMeta = z.infer<typeof submissionMetaSchema>;

export const studentNameSchema = z.string().trim().min(1).max(40);
