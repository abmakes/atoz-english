-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "questionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quiz" ADD COLUMN "playability" JSONB;

-- Backfill counts so catalog cards do not join Question rows.
UPDATE "Quiz"
SET "questionCount" = (
  SELECT COUNT(*)::int
  FROM "Question"
  WHERE "Question"."quizId" = "Quiz"."id"
);
