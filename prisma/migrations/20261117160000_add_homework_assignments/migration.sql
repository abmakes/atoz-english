-- AlterTable
ALTER TABLE "ThoughtChallenge" ADD COLUMN "dueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Story" ADD COLUMN "dueAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "HomeworkAttemptMode" AS ENUM ('HOMEWORK', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "HomeworkAttemptStatus" AS ENUM ('IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "HomeworkEndReason" AS ENUM ('COMPLETE', 'WRONG', 'TIMEOUT', 'HUNDRED');

-- CreateTable
CREATE TABLE "HomeworkAssignment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL DEFAULT 'admin',
    "quizId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "acceptingResponses" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkAttempt" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "mode" "HomeworkAttemptMode" NOT NULL,
    "status" "HomeworkAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "queue" JSONB NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "answeredCount" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "livesLeft" INTEGER,
    "timeLimitMs" INTEGER,
    "questionStartedAt" TIMESTAMP(3),
    "extraLifeGranted" BOOLEAN NOT NULL DEFAULT false,
    "endReason" "HomeworkEndReason",
    "reachedHundred" BOOLEAN NOT NULL DEFAULT false,
    "timeToHundredMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL DEFAULT '',
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "timeUsedMs" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,

    CONSTRAINT "HomeworkAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeworkAssignment_shareToken_key" ON "HomeworkAssignment"("shareToken");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_authorId_idx" ON "HomeworkAssignment"("authorId");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_quizId_idx" ON "HomeworkAssignment"("quizId");

-- CreateIndex
CREATE INDEX "HomeworkAttempt_assignmentId_createdAt_idx" ON "HomeworkAttempt"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "HomeworkAttempt_assignmentId_mode_status_idx" ON "HomeworkAttempt"("assignmentId", "mode", "status");

-- CreateIndex
CREATE INDEX "HomeworkAnswer_attemptId_questionId_idx" ON "HomeworkAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "HomeworkAnswer_attemptId_order_idx" ON "HomeworkAnswer"("attemptId", "order");

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAttempt" ADD CONSTRAINT "HomeworkAttempt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "HomeworkAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAnswer" ADD CONSTRAINT "HomeworkAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "HomeworkAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
