-- A saved lesson can point at one Thoughts speaking assignment.
ALTER TABLE "LessonKit" ADD COLUMN "thoughtChallengeId" TEXT;

CREATE UNIQUE INDEX "LessonKit_thoughtChallengeId_key" ON "LessonKit"("thoughtChallengeId");

ALTER TABLE "LessonKit" ADD CONSTRAINT "LessonKit_thoughtChallengeId_fkey" FOREIGN KEY ("thoughtChallengeId") REFERENCES "ThoughtChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
