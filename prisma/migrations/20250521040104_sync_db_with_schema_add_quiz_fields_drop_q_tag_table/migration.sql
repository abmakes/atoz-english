/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "authorId" TEXT NOT NULL DEFAULT 'admin',
ADD COLUMN     "defaultSettings" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "quizType" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
ADD COLUMN     "statistics" JSONB,
ADD COLUMN     "tags" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
