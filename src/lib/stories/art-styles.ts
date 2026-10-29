/**
 * Teacher-facing art style presets for Story Creator.
 * `promptLock` is the locked art-direction text injected into image generation.
 * Preview thumbnails live under /public/images/story-styles/.
 */
export const STORY_ART_STYLES = [
  {
    id: 'picture-book',
    label: 'Picture book',
    ageHint: 'Ages 6–9 · clear & friendly',
    previewSrc: '/images/story-styles/picture-book.webp',
    promptLock:
      'Bright flat children\'s picture-book cartoon with thick clean outlines, soft rounded shapes, simple uncluttered backgrounds, warm cheerful colors, and gentle lighting. Classic early-reader storybook look — never photorealistic.',
  },
  {
    id: 'soft-anime',
    label: 'Soft anime',
    ageHint: 'Ages 8–12 · dreamy & painterly',
    previewSrc: '/images/story-styles/soft-anime.webp',
    promptLock:
      'Soft dreamy anime illustration inspired by gentle Studio Ghibli–like children\'s films: painterly watercolor skies, lush detailed nature, warm natural light, expressive but soft character faces, calm magical atmosphere. Family-friendly, never dark or scary.',
  },
  {
    id: 'chibi',
    label: 'Chibi',
    ageHint: 'Ages 5–8 · super cute',
    previewSrc: '/images/story-styles/chibi.webp',
    promptLock:
      'Super-cute chibi / super-deformed cartoon style: oversized round heads, tiny bodies, huge sparkling eyes, soft pastel colors, thick outlines, playful proportions, simple cheerful backgrounds. Extremely kid-friendly and adorable.',
  },
  {
    id: 'action-anime',
    label: 'Action anime',
    ageHint: 'Ages 9–12 · bold & energetic',
    previewSrc: '/images/story-styles/action-anime.webp',
    promptLock:
      'Bold energetic anime style inspired by classic Dragon Ball–like action cartoons: strong dynamic poses, spiky stylized hair, sharp ink outlines, bright saturated colors, speed-line energy, clear heroic expressions. Still classroom-safe — fun and exciting, not violent or scary.',
  },
  {
    id: 'classic-1950s',
    label: '1950s cartoon',
    ageHint: 'All ages · vintage rubber-hose',
    previewSrc: '/images/story-styles/classic-1950s.webp',
    promptLock:
      'Classic 1950s American cartoon style: rubber-hose limbs, pie-cut eyes, smooth cel-shaded colors, thick black ink outlines, playful squash-and-stretch poses, vintage theatrical cartoon charm like early Saturday-morning shorts. Bright, humorous, and wholesome.',
  },
  {
    id: 'modern-anime',
    label: 'Modern anime',
    ageHint: 'Ages 9–13 · clean manga look',
    previewSrc: '/images/story-styles/modern-anime.webp',
    promptLock:
      'Clean modern anime / light-manga illustration: crisp line art, large expressive eyes, soft cel shading, neat contemporary clothing details, clear readable faces, bright but refined color palette. Polished school-anime look suitable for older kids.',
  },
] as const;

export type StoryArtStyleId = (typeof STORY_ART_STYLES)[number]['id'];

export const DEFAULT_STORY_ART_STYLE_ID: StoryArtStyleId = 'picture-book';

export const STORY_ART_STYLE_IDS = STORY_ART_STYLES.map(
  (style) => style.id
) as [StoryArtStyleId, ...StoryArtStyleId[]];

export function getStoryArtStyle(id: string | null | undefined) {
  return (
    STORY_ART_STYLES.find((style) => style.id === id) ??
    STORY_ART_STYLES.find((style) => style.id === DEFAULT_STORY_ART_STYLE_ID)!
  );
}

/**
 * Build the final art-direction string stored on the Story and used for every panel.
 * Preset lock first; optional one-line teacher note is appended.
 */
export function resolveArtStylePrompt(
  styleId: string | null | undefined,
  note?: string | null
): string {
  const preset = getStoryArtStyle(styleId);
  const trimmed = note?.trim();
  if (!trimmed) return preset.promptLock;
  return `${preset.promptLock} Teacher style note: ${trimmed}`;
}
