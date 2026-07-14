-- CreateTable
CREATE TABLE "QuizLike" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizFavorite" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizLike_userId_idx" ON "QuizLike"("userId");

-- CreateIndex
CREATE INDEX "QuizLike_quizId_idx" ON "QuizLike"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizLike_quizId_userId_key" ON "QuizLike"("quizId", "userId");

-- CreateIndex
CREATE INDEX "QuizFavorite_userId_idx" ON "QuizFavorite"("userId");

-- CreateIndex
CREATE INDEX "QuizFavorite_quizId_idx" ON "QuizFavorite"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizFavorite_quizId_userId_key" ON "QuizFavorite"("quizId", "userId");

-- AddForeignKey
ALTER TABLE "QuizLike" ADD CONSTRAINT "QuizLike_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizFavorite" ADD CONSTRAINT "QuizFavorite_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill null statistics to zeros
UPDATE "Quiz"
SET "statistics" = '{"likes":0,"favoritesCount":0,"playsCount":0}'::jsonb
WHERE "statistics" IS NULL;
