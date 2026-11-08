-- Pasted question images are stored without a Pixabay id.
ALTER TABLE "StoredImage" ALTER COLUMN "pixabayId" DROP NOT NULL;
