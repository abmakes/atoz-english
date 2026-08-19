import { levelLabelFromId } from '@/lib/taxonomy/quiz-taxonomy';
import { resolveLexicon } from '@/lib/lexicon/resolver';
import {
  storyPlanSchema,
  type StoryBrief,
  type StoryPlan,
} from '@/lib/stories/schemas';

function levelGuidance(level: string): string {
  switch (level) {
    case 'PRE_A1':
      return 'Use only very simple, concrete words and 4-6 word sentences.';
    case 'A1':
      return 'Use basic everyday vocabulary and short, direct sentences (max 8 words).';
    case 'A2':
      return 'Use everyday situations and simple connected sentences (max 12 words).';
    case 'B1':
      return 'Use concise familiar-topic language with simple linking words.';
    default:
      return 'Use concise young-learner language.';
  }
}

/**
 * Prompt for the story-plan text call: title, character sheet, art style,
 * and 4 narrative-arc scenes each with an example sentence in the target grammar.
 */
export function createStoryPlanPrompt(brief: StoryBrief): string {
  const selection = resolveLexicon({
    level: brief.level,
    tags: brief.grammarFocus,
    limit: 80,
  });
  const grammar =
    brief.grammarFocus.length > 0
      ? brief.grammarFocus.join(', ')
      : 'Past Simple (typical for picture storytelling)';
  const vocabulary =
    brief.keyVocabulary && brief.keyVocabulary.length > 0
      ? brief.keyVocabulary.join(', ')
      : 'None provided';

  return `You are an expert young-learner ESL storyteller preparing a Cambridge YLE "tell the story" speaking task.
Create a 4-picture story a child aged 7-11 can narrate, one or two sentences per picture.

TEACHER BRIEF (highest priority):
- Story idea / topic: ${brief.topicPrompt}
- CEFR level: ${levelLabelFromId(brief.level)} (${brief.level})
- Story type: ${brief.storyType}
- Grammar to practise: ${grammar}
- Main character request: ${brief.characters || 'Invent one friendly child or animal character'}
- Lesson context (if any): ${brief.lessonSummary || 'None provided'}
- Vocabulary to prefer: ${vocabulary}

STORY SHAPE (classic Movers arc):
- Picture 1: introduce the character and setting (beginning)
- Picture 2: a problem or surprise appears
- Picture 3: the character does something about it
- Picture 4: a happy or funny resolution

LANGUAGE RULES:
- ${levelGuidance(brief.level)}
- Example sentences MUST use the target grammar: ${grammar}.
- Age-appropriate, cheerful, nothing scary or sad.
- Words typical for this level that may help: ${selection.words.slice(0, 60).join(', ') || 'common classroom words'}

IMAGE PLANNING RULES:
- characterSheet: one reusable visual description of the main character(s) - species/age, hair, clothing colors, distinguishing features. Every picture must show the SAME character(s).
- artStyle: one short reusable description of the illustration style (e.g. "bright flat cartoon, thick outlines, simple shapes, warm colors, children's book style").
- sceneDescription: what is VISIBLE in that picture (setting, action, expression). No text or speech bubbles in the pictures.
- The character's face and mouth must be clearly visible in every scene.

Return ONLY JSON with this exact shape:
{
  "title": "Short fun story title",
  "characterSheet": "...",
  "artStyle": "...",
  "panels": [
    { "sceneDescription": "...", "exampleSentence": "..." },
    { "sceneDescription": "...", "exampleSentence": "..." },
    { "sceneDescription": "...", "exampleSentence": "..." },
    { "sceneDescription": "...", "exampleSentence": "..." }
  ]
}`;
}

export function parseStoryPlan(raw: string): StoryPlan {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  return storyPlanSchema.parse(parsed);
}

/** Build the image-generation prompt for one panel. */
export function createPanelImagePrompt(input: {
  characterSheet: string;
  artStyle: string;
  sceneDescription: string;
  panelOrder: number;
  hasReferenceImage: boolean;
  tweak?: string;
}): string {
  const lines = [
    `Children's book illustration, panel ${input.panelOrder} of a 4-picture story.`,
    `Art style: ${input.artStyle}`,
    `Main character(s): ${input.characterSheet}`,
    `Scene: ${input.sceneDescription}`,
    'The main character\'s face must be clearly visible, mouth closed or neutral.',
    'No text, no speech bubbles, no panel borders, no watermarks.',
    'Bright, friendly, suitable for children aged 7-11.',
  ];
  if (input.hasReferenceImage) {
    lines.push(
      'Use the attached reference image for the exact character design, colors, and art style. Keep the character identical; only the scene changes.'
    );
  }
  if (input.tweak?.trim()) {
    lines.push(`Teacher adjustment for this picture: ${input.tweak.trim()}`);
  }
  return lines.join('\n');
}

/** Assemble the printable example story from panel sentences. */
export function buildExampleStory(sentences: Array<string | null | undefined>): string {
  return sentences
    .map((sentence) => sentence?.trim())
    .filter((sentence): sentence is string => !!sentence)
    .join(' ');
}
