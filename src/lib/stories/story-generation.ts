import { levelLabelFromId } from '@/lib/taxonomy/quiz-taxonomy';
import { resolveLexicon } from '@/lib/lexicon/resolver';
import { getStoryArtStyle, resolveArtStylePrompt } from '@/lib/stories/art-styles';
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
  const artStyle = resolveArtStylePrompt(brief.artStyleId, brief.artStyleNote);
  const stylePreset = getStoryArtStyle(brief.artStyleId);

  return `You are an expert young-learner ESL storyteller preparing a Cambridge YLE "tell the story" speaking task.
Create a 4-picture story a child aged 7-11 can narrate, one or two sentences per picture.

TEACHER BRIEF (highest priority):
- Story idea / topic: ${brief.topicPrompt}
- CEFR level: ${levelLabelFromId(brief.level)} (${brief.level})
- Story type: ${brief.storyType}
- Grammar to practise: ${grammar}
- Main character request: ${brief.characters || 'Invent one friendly child or animal character'}
- Illustration style preset: ${stylePreset.label} (${stylePreset.ageHint})
- Locked art direction (copy this EXACTLY into the artStyle field — do not invent a different style): ${artStyle}
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

IMAGE PLANNING RULES (these feed a detailed image-generation prompt — write rich visual prose, not short labels):
- characterSheet: 2-4 sentences describing the main character(s) in reusable visual detail — age/species, hair color and style, skin tone, exact clothing colors and items, one distinctive prop or feature. Design the character so they fit the locked art direction above. Every picture must show the SAME character(s) looking identical.
- artStyle: return EXACTLY this locked art direction string, character-for-character: ${JSON.stringify(artStyle)}
- sceneDescription: 2-4 sentences of what is VISIBLE in that picture only — setting, foreground/background layout, action, props, lighting, and the character's expression. No text, no speech bubbles, no panel numbers in the picture. The character's face and mouth must be clearly visible and fairly large in frame.

Return ONLY JSON with this exact shape:
{
  "title": "Short fun story title",
  "characterSheet": "...",
  "artStyle": ${JSON.stringify(artStyle)},
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

/**
 * Build a rich, single-scene image prompt for OpenRouter / Gemini Flash Image.
 * Matches the density of detail of a good image-model prompt (composition,
 * character, setting, lighting, color, mood) while staying a children's
 * picture-book illustration — never photoreal editorial photography.
 */
export function createPanelImagePrompt(input: {
  characterSheet: string;
  artStyle: string;
  sceneDescription: string;
  panelOrder: number;
  hasReferenceImage: boolean;
  tweak?: string;
}): string {
  const character =
    input.characterSheet.trim() ||
    'a friendly cartoon child with simple round features and bright clothing';
  const style =
    input.artStyle.trim() ||
    'bright flat children\'s picture-book cartoon with thick clean outlines, soft rounded shapes, and a warm cheerful color palette';
  const scene =
    input.sceneDescription.trim() ||
    'a clear everyday outdoor setting with the character in the center of the frame';

  const paragraphs = [
    `Children's picture-book illustration for panel ${input.panelOrder} of a four-picture classroom story, rendered as a single full-bleed scene (not a comic strip, not a collage). Art direction: ${style}. Soft, friendly, and clearly readable for children aged 7–11 — never photorealistic, never dark, never scary.`,

    `Main character, kept identical across every panel of this story: ${character}. Place the character prominently in the frame so their face is large, frontal or three-quarter view, and easy to see. Mouth closed or gently neutral (a separate cartoon mouth will be overlaid later).`,

    `Scene and composition: ${scene}. Describe a clear foreground, midground, and simple background. Keep the layout uncluttered so a child can tell the story from the picture alone. Use warm, inviting lighting and saturated but soft colors that match the art direction.`,

    'Hard constraints: no written text of any kind, no letters, no signs with words, no speech bubbles, no captions, no watermarks, no panel borders, no UI chrome. One continuous illustration filling the frame in a landscape 4:3 composition.',
  ];

  if (input.hasReferenceImage) {
    paragraphs.push(
      'A reference image is attached. Match that exact character design, clothing colors, proportions, and art style. Only the scene, pose, and expression may change — the character must look like the same person or animal from the reference.'
    );
  }

  if (input.tweak?.trim()) {
    paragraphs.push(
      `Teacher adjustment for this picture only: ${input.tweak.trim()}. Apply this change while keeping the character identity and overall art style intact.`
    );
  }

  return paragraphs.join('\n\n');
}

/** Assemble the printable example story from panel sentences. */
export function buildExampleStory(sentences: Array<string | null | undefined>): string {
  return sentences
    .map((sentence) => sentence?.trim())
    .filter((sentence): sentence is string => !!sentence)
    .join(' ');
}
