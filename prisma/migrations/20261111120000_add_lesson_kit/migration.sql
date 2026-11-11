-- CreateTable
CREATE TABLE "LessonKit" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL DEFAULT 'admin',
    "quizId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "worksheetItems" JSONB NOT NULL,
    "sentences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonKit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonKit_quizId_key" ON "LessonKit"("quizId");

-- CreateIndex
CREATE INDEX "LessonKit_authorId_idx" ON "LessonKit"("authorId");

-- AddForeignKey
ALTER TABLE "LessonKit" ADD CONSTRAINT "LessonKit_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
