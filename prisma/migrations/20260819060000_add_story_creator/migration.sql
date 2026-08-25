-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StorySubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWED');

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL DEFAULT 'admin',
    "title" TEXT NOT NULL,
    "topicPrompt" TEXT NOT NULL,
    "tags" TEXT[],
    "storyType" TEXT,
    "characterSheet" TEXT,
    "artStyle" TEXT,
    "exampleStory" TEXT,
    "showExampleToStudents" BOOLEAN NOT NULL DEFAULT false,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPanel" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "sceneDescription" TEXT NOT NULL,
    "imagePrompt" TEXT,
    "exampleSentence" TEXT,
    "mouth" JSONB,

    CONSTRAINT "StoryPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorySubmission" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "status" "StorySubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryRecording" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "panelOrder" INTEGER NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "envelope" JSONB,

    CONSTRAINT "StoryRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_shareToken_key" ON "Story"("shareToken");

-- CreateIndex
CREATE INDEX "Story_authorId_idx" ON "Story"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryPanel_storyId_order_key" ON "StoryPanel"("storyId", "order");

-- CreateIndex
CREATE INDEX "StorySubmission_storyId_idx" ON "StorySubmission"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryRecording_submissionId_panelOrder_key" ON "StoryRecording"("submissionId", "panelOrder");

-- AddForeignKey
ALTER TABLE "StoryPanel" ADD CONSTRAINT "StoryPanel_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorySubmission" ADD CONSTRAINT "StorySubmission_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRecording" ADD CONSTRAINT "StoryRecording_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "StorySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
