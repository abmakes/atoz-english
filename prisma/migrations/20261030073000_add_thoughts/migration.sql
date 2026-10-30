-- CreateEnum
CREATE TYPE "ThoughtChallengeStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ThoughtSubmissionStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "ThoughtChallenge" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL DEFAULT 'admin',
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "ThoughtChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "acceptingResponses" BOOLEAN NOT NULL DEFAULT true,
    "showGallery" BOOLEAN NOT NULL DEFAULT true,
    "allowFunnyVoices" BOOLEAN NOT NULL DEFAULT true,
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThoughtChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThoughtSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "character" JSONB NOT NULL,
    "voiceEffect" TEXT NOT NULL DEFAULT 'original',
    "audioPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "envelope" JSONB NOT NULL,
    "clientKey" TEXT NOT NULL,
    "status" "ThoughtSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThoughtSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThoughtChallenge_shareToken_key" ON "ThoughtChallenge"("shareToken");

-- CreateIndex
CREATE INDEX "ThoughtChallenge_authorId_idx" ON "ThoughtChallenge"("authorId");

-- CreateIndex
CREATE INDEX "ThoughtSubmission_challengeId_createdAt_idx" ON "ThoughtSubmission"("challengeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThoughtSubmission_challengeId_clientKey_key" ON "ThoughtSubmission"("challengeId", "clientKey");

-- AddForeignKey
ALTER TABLE "ThoughtSubmission" ADD CONSTRAINT "ThoughtSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ThoughtChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
