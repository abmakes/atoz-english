import { prisma } from '@/lib/prisma';
import { mouthPlacementSchema, type MouthPlacement } from '@/lib/stories/schemas';

export interface StoryPanelDto {
  id: string;
  order: number;
  imageUrl: string | null;
  sceneDescription: string;
  exampleSentence: string | null;
  mouth: MouthPlacement | null;
}

export interface StoryDto {
  id: string;
  title: string;
  topicPrompt: string;
  tags: string[];
  storyType: string | null;
  exampleStory: string | null;
  showExampleToStudents: boolean;
  status: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  panels: StoryPanelDto[];
  submissionCount?: number;
}

type PanelRecord = {
  id: string;
  order: number;
  imageUrl: string | null;
  sceneDescription: string;
  exampleSentence: string | null;
  mouth: unknown;
};

export function parseMouth(value: unknown): MouthPlacement | null {
  const result = mouthPlacementSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function toPanelDto(panel: PanelRecord): StoryPanelDto {
  return {
    id: panel.id,
    order: panel.order,
    imageUrl: panel.imageUrl,
    sceneDescription: panel.sceneDescription,
    exampleSentence: panel.exampleSentence,
    mouth: parseMouth(panel.mouth),
  };
}

type StoryRecord = {
  id: string;
  title: string;
  topicPrompt: string;
  tags: string[];
  storyType: string | null;
  exampleStory: string | null;
  showExampleToStudents: boolean;
  status: string;
  shareToken: string;
  createdAt: Date;
  updatedAt: Date;
  panels: PanelRecord[];
};

export function toStoryDto(
  story: StoryRecord,
  submissionCount?: number
): StoryDto {
  return {
    id: story.id,
    title: story.title,
    topicPrompt: story.topicPrompt,
    tags: story.tags,
    storyType: story.storyType,
    exampleStory: story.exampleStory,
    showExampleToStudents: story.showExampleToStudents,
    status: story.status,
    shareToken: story.shareToken,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    panels: [...story.panels].sort((a, b) => a.order - b.order).map(toPanelDto),
    ...(submissionCount !== undefined ? { submissionCount } : {}),
  };
}

/** Load a story only if it belongs to the given teacher. */
export async function getOwnedStory(storyId: string, userId: string) {
  return prisma.story.findFirst({
    where: { id: storyId, authorId: userId },
    include: { panels: true },
  });
}

/** A story is playable by students once all four panels have images. */
export function isStoryPlayable(story: {
  status: string;
  panels: Array<{ imageUrl: string | null }>;
}): boolean {
  return (
    story.status !== 'ARCHIVED' &&
    story.panels.length > 0 &&
    story.panels.every((panel) => !!panel.imageUrl)
  );
}
